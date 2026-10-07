import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getNotes} from '../src/lib/vault.ts';
import {normalizeSearch,searchAliases} from '../src/lib/search.ts';
import {parseSpellComponents} from '../src/lib/calculators.ts';
import {sanitizeFinderContext,rememberFinderContext,finderReturnHref} from '../src/lib/finder-context.ts';
import {validateComponentPlan,parseComponentPlan,saveComponentPlan,loadComponentPlan,COMPONENT_PLAN_KEY} from '../src/lib/component-plan.ts';

const origin='https://wizard.example';
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),values};};
const spells=getNotes().filter(note=>note.type==='spell'&&note.section==='spells').map(note=>({slug:note.slug,title:note.title,...parseSpellComponents(note.title,note.metadata.components)}));
const spell=name=>spells.find(spell=>spell.title===name);
const entry=(name,casts=1)=>{
  const source=spell(name);
  return {slug:source.slug,source:source.raw,casts,targets:source.items.some(item=>item.perTarget)?1:null,
    rows:source.items.map(item=>({price:item.gpCost,sets:item.quantityKind==='sets'||item.consumption==='unknown'?1:null,consumption:item.consumption}))};
};
const plan=entries=>({format:'wizard-compendium-component-plan',version:1,entries});

test('library matching shares apostrophe/diacritic normalization and source aliases',()=>{
  const note=getNotes().find(note=>note.title==="Mordenkainen's Private Sanctum");
  const text=normalizeSearch(`${note.title} ${searchAliases(note).join(' ')} ${note.summary}`);
  for(const query of ['Mordenkainen’s Private Sanctum','mordenkainens private sanctum'])assert.ok(normalizeSearch(query).split(' ').every(term=>text.includes(term)));
  const source=readFileSync(new URL('../src/pages/library/index.astro',import.meta.url),'utf8');
  assert.match(source,/searchAliases\(n\)/);assert.match(source,/normalizeSearch\(input.value\)/);assert.match(source,/data-library-question/);
});

test('finder contexts are bounded, allowlisted and never redirect outside a finder',()=>{
  for(const unsafe of ['https://evil.example/spells/','//evil.example/spells/','javascript:alert(1)','/play/import/','https://user:secret@wizard.example/spells/','/spells/../search/'])assert.equal(sanitizeFinderContext(unsafe,origin),null);
  assert.equal(sanitizeFinderContext('/spells/?q=shield&token=secret&returnTo=https://evil.example&view=rows&level=1#bad',origin),'/spells/?q=shield&view=rows&level=1');
  assert.equal(sanitizeFinderContext('/forms/?compare=gallery/mammoth,gallery/mammoth,../../evil,b,c,d,e',origin),'/forms/?compare=gallery%2Fmammoth%2Cb%2Cc%2Cd');
  assert.equal(sanitizeFinderContext('/spells/?q='+('a'.repeat(800)),origin).length,'/spells/?q='.length+300);
});

test('return controls restore filters, selection and reading view with safe fallbacks',()=>{
  const storage=memory(),href='/spells/?q=shield&school=Abjuration&compare=spells/spell-cards/shield-spell&view=rows';
  const safe=rememberFinderContext(href,origin,storage);
  assert.equal(finderReturnHref('/spells/',origin,{storage}),safe);
  assert.equal(finderReturnHref('/spells/',origin,{returnTo:'/spells/?q=other',storage}),'/spells/?q=other');
  assert.equal(finderReturnHref('/spells/',origin,{returnTo:'https://evil.example/spells/',referrer:origin+'/spells/?level=3',storage}),'/spells/?level=3');
  const blocked={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}};
  assert.equal(rememberFinderContext(href,origin,blocked),safe);
  assert.equal(finderReturnHref('/spells/',origin,{returnTo:safe,storage:blocked}),safe);
  assert.equal(finderReturnHref('/items/',origin,{storage:blocked}),'/items/');
  assert.equal(finderReturnHref('/bad/',origin,{storage}),'/library/');
});

test('component plans round-trip mixed, reusable, per-target and unknown-price materials',()=>{
  const input=plan([entry('Find Familiar',3),entry('Identify',5),entry('Legend Lore',2),entry('Astral Projection',2),entry('Dark Star')]);
  input.entries[1].rows[0].price=125;input.entries[1].rows[0].sets=2;input.entries[3].targets=4;
  const clean=validateComponentPlan(input,spells);
  assert.deepEqual(parseComponentPlan(JSON.stringify(clean),spells),clean);
  assert.equal(clean.entries.at(-1).rows[0].price,null);
  const storage=memory();saveComponentPlan(clean,spells,storage);assert.deepEqual(loadComponentPlan(spells,storage),clean);
  assert.ok(storage.values.has(COMPONENT_PLAN_KEY));assert.equal(loadComponentPlan(spells,memory()),null);
});

test('invalid/stale plans cannot silently change recorded source rules or numeric inputs',()=>{
  const mutate=change=>{const input=plan([entry('Find Familiar')]);change(input);return()=>validateComponentPlan(input,spells);};
  for(const change of [
    input=>input.version=2,input=>input.entries[0].slug='unknown-spell',input=>input.entries.push(input.entries[0]),
    input=>input.entries[0].source='changed source',input=>input.entries[0].casts=0,input=>input.entries[0].casts=1.5,
    input=>input.entries[0].targets=2,input=>input.entries[0].rows=[],input=>input.entries[0].rows[0].price=9,
    input=>input.entries[0].rows[0].price='10',input=>input.entries[0].rows[0].price=Infinity,
    input=>input.entries[0].rows[0].consumption='reusable',input=>input.entries[0].rows[0].sets=1,
  ])assert.throws(mutate(change));
  assert.throws(()=>parseComponentPlan('{invalid',spells),/valid JSON/);
  assert.throws(()=>parseComponentPlan(' '.repeat(1024*1024+1),spells),/1 MB/);
  const sets=plan([entry('Identify')]);sets.entries[0].rows[0].sets=1000;assert.throws(()=>validateComponentPlan(sets,spells),/sets/);
});

test('storage failures are explicit and do not masquerade as a successful save',()=>{
  const blocked={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('quota');}};
  assert.throws(()=>saveComponentPlan(plan([entry('Dark Star')]),spells,blocked),/could not save/);
  assert.throws(()=>loadComponentPlan(spells,blocked),/unavailable/);
  const stale=memory();stale.setItem(COMPONENT_PLAN_KEY,'not JSON');assert.throws(()=>loadComponentPlan(spells,stale),/valid JSON/);
  assert.equal(stale.getItem(COMPONENT_PLAN_KEY),'not JSON');
});
