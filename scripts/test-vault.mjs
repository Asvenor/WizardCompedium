import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getNotes,findNote,noteHref} from '../src/lib/vault.ts';
import {getCatalog,catalogRecord,catalogFilters,catalogValue} from '../src/lib/catalog.ts';
import {savedReferences,toggleReference} from '../src/lib/reading-list.ts';
import {normalizeSearch,indexSearch,searchRecords} from '../src/lib/search.ts';
const byName=(kind,name)=>getCatalog(kind).find(n=>n.title===name);

test('full-text search handles punctuation, accents, multiple terms, section filters and exact-title priority',()=>{
  const row=(title,text,section='spells')=>({title,text,section,summary:'',slug:title,url:'/',sectionLabel:section});
  const entries=indexSearch([
    row('A spellbook note','Shield reaction'),row('Shield','An abjuration reaction'),
    row('Shield of Faith','Bless your ally'),row('Mordenkainen’s Sword','Arcane focus'),
    row('Countering Spellcasters','Shield reaction','tactics'),row('Façade','Illusions'),
  ]);
  assert.equal(normalizeSearch('  Mordenkainen’s—Sword!  '),'mordenkainens sword');
  assert.equal(searchRecords(entries,'shield')[0].title,'Shield');
  assert.deepEqual(searchRecords(entries,'shield reaction','tactics').map(r=>r.title),['Countering Spellcasters']);
  assert.equal(searchRecords(entries,'mordenkainen\'s sword')[0].title,'Mordenkainen’s Sword');
  assert.equal(searchRecords(entries,'facade')[0].title,'Façade');
  assert.deepEqual(searchRecords(entries,'!!!'),[]);
  assert.deepEqual(searchRecords(entries,'missing phrase'),[]);
});

test('each source note has a unique stable route; catalogues exclude source templates',()=>{
  const index=JSON.parse(readFileSync(new URL('../src/data/vault-index.json',import.meta.url),'utf8'));
  assert.equal(getNotes().length,index.noteCount);
  assert.equal(new Set(getNotes().map(n=>n.slug)).size,index.noteCount);
  for(const n of getNotes())assert.match(noteHref(n),/^\/library\/[a-z0-9/-]+\/$/);
  assert.equal(getCatalog('spells').length,208);assert.equal(getCatalog('items').length,51);assert.equal(getCatalog('forms').length,20);
  for(const kind of ['spells','items','forms'])assert.ok(getCatalog(kind).every(n=>n.section!=='inbox'));
});
test('special spell access and enemy saving throws stay distinct from source category and self saves',()=>{
  assert.match(byName('spells','Bless').metadata.access,/Cleric\/Paladin.*separate grant/i);
  assert.match(byName('spells','Battle Familiar').metadata.components,/25\+ gp.*not consumed/i);
  const contact=catalogFilters(byName('spells','Contact Other Plane'));
  assert.deepEqual(contact.save,[]);assert.deepEqual(contact.self_save,['INT']);
  assert.equal(catalogFilters(byName('spells','Shield')).range_feet,null);
});
test('canonical spell cards win over inherited redirect notes with the same title',()=>{
  assert.equal(findNote('Battle Familiar').type,'spell');
  assert.ok(noteHref(findNote('Battle Familiar')).includes('/spell-cards/'));
});
test('comparison fields match the entry kind without manufacturing unrelated creature gates',()=>{
  const spell=catalogRecord(byName('spells','Shield'));
  assert.equal(spell.fields.Concentration,'No');assert.equal(spell.fields['Candidate routes'],undefined);
  const form=catalogRecord(byName('forms','Giant Ape'));
  assert.equal(form.fields.CR,'7');assert.match(form.fields['Candidate routes'],/Polymorph/);
  assert.equal(form.fields['Preparation priority'],undefined);
  assert.equal(catalogValue(byName('forms','Giant Ape'),'movement'),'walk 40 ft · climb 40 ft');
});
test('references save and remove independently without overwriting earlier character data',()=>{
  const original=globalThis.localStorage;const entries=new Map([['wizard-compendium-profile-v1','preserve']]);
  try{globalThis.localStorage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
    assert.equal(toggleReference('spells/spell-cards/shield-spell'),true);assert.deepEqual(savedReferences(),['spells/spell-cards/shield-spell']);
    assert.equal(toggleReference('spells/spell-cards/shield-spell'),false);assert.deepEqual(savedReferences(),[]);assert.equal(entries.get('wizard-compendium-profile-v1'),'preserve');
    globalThis.localStorage={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}};assert.deepEqual(savedReferences(),[]);assert.equal(toggleReference('any'),null);
  }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});
