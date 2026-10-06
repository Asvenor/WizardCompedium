import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const notes=JSON.parse(readFileSync(new URL('../src/data/vault-index.json',import.meta.url),'utf8')).notes;
const sections=JSON.parse(readFileSync(new URL('../src/data/vault-index.json',import.meta.url),'utf8')).sections;
const rules=readFileSync(new URL('../public/_redirects',import.meta.url),'utf8').split('\n')
  .filter(line=>line.trim()&&!line.trim().startsWith('#')).map(line=> {
    assert.ok(line.length<=1000,'Cloudflare redirect line limit');
    const fields=line.trim().split(/\s+/);
    assert.equal(fields.length,3,'source, destination, status');
    return {from:fields[0],to:fields[1],status:Number(fields[2])};
  });
const bySource=new Map(rules.map(rule=>[rule.from,rule]));
const normalize=value=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const spellAliases={
  'leomunds-tiny-hut':'Tiny Hut',
  'otilukes-resilient-sphere':'Resilient Sphere',
  'rarys-telepathic-bond':'Telepathic Bond',
  'instant-summons':"Drawmij's Instant Summons",
};

test('legacy redirects are exact permanent paths, below Cloudflare limits, without duplicates or chains',()=> {
  assert.equal(rules.length,356);
  assert.ok(rules.length<=2000);
  assert.equal(bySource.size,rules.length);
  for(const rule of rules){
    assert.equal(rule.status,301);
    assert.match(rule.from,/^\/[a-z0-9/-]+$/);
    assert.ok(!/[*:#?]/.test(rule.from));
    assert.ok(rule.to.startsWith('/')&&!rule.to.startsWith('//'));
    const destination=new URL(rule.to,'https://wizard.local');
    assert.ok(!bySource.has(destination.pathname),`Redirect chain: ${rule.from}`);
    const counterpart=rule.from.endsWith('/')?rule.from.slice(0,-1):rule.from+'/';
    assert.equal(bySource.get(counterpart)?.to,rule.to,`Both slash forms: ${rule.from}`);
  }
});

test('every redirect destination is an existing page, reference, or valid section filter',()=> {
  for(const rule of rules){
    const destination=new URL(rule.to,'https://wizard.local');
    if(destination.pathname.startsWith('/library/')&&destination.pathname!=='/library/'){
      const slug=destination.pathname.replace(/^\/library\//,'').replace(/\/$/,'');
      const note=notes.find(note=>note.slug===slug);
      assert.ok(note,`Missing note: ${rule.to}`);
      assert.ok(existsSync(new URL(`../src/content/vault/${slug}.md`,import.meta.url)));
    }else{
      const relative=destination.pathname.replace(/^\//,'');
      const candidates=[`../src/pages/${relative}index.astro`,`../src/pages/${relative.replace(/\/$/,'')}.astro`];
      assert.ok(candidates.some(candidate=>existsSync(new URL(candidate,import.meta.url))),`Missing page: ${rule.to}`);
    }
    if(destination.searchParams.has('section'))assert.ok(sections.some(section=>section.id===destination.searchParams.get('section')));
  }
});

test('old spell URLs retain the same spell identity and use canonical cards',()=> {
  const spellRules=rules.filter(rule=>/^\/spells\/[^/]+\/$/.test(rule.from)&&rule.from!=='/spells/compare/');
  assert.equal(spellRules.length,165);
  for(const rule of spellRules){
    const oldId=rule.from.split('/')[2];
    const targetSlug=rule.to.replace(/^\/library\//,'').replace(/\/$/,'');
    const note=notes.find(note=>note.slug===targetSlug);
    assert.equal(note?.type,'spell');
    assert.equal(note?.section,'spells');
    assert.match(note.slug,/^spells\/spell-cards\//);
    assert.equal(normalize(note.title),normalize(spellAliases[oldId]??oldId),`Changed spell identity: ${oldId}`);
  }
});

test('retired chapters, unsupported spells, and unknown URLs retain genuine 404 behavior',()=> {
  for(const retired of ['/chapters/05-flagship-artificer-1-wizard-19/','/chapters/unmapped-chapter/',
    '/spells/invulnerability/','/spells/unmapped-spell/','/wizard/','/unrelated-path/']){
    assert.ok(!bySource.has(retired),`Unexpected inferred mapping: ${retired}`);
  }
  assert.equal(bySource.get('/chapters/')?.to,'/library/');
  assert.ok(!rules.some(rule=>rule.from.includes('*')||rule.from.includes(':')));
});
