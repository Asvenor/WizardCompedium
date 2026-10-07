import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import GithubSlugger from 'github-slugger';
import {getNotes,noteHref} from '../src/lib/vault.ts';
import {getFinderCatalog} from '../src/lib/catalog.ts';
import {questionAnswers,findQuestionAnswers} from '../src/lib/questions.ts';
import {normalizeSearch,searchTerms,searchableNotes,searchAliases,markdownSearchText,headingSearchRecords,indexSearch,searchRecords,searchSnippet,searchSuggestions} from '../src/lib/search.ts';

const repository=path.resolve(import.meta.dirname,'..');
const bodies=new Map();
const allHeadings=new Map();
for(const note of getNotes()){
  const content=fs.readFileSync(path.join(repository,'src/content/vault',`${note.slug}.md`),'utf8');
  const body=content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');
  bodies.set(note.slug,body);
  const slugger=new GithubSlugger(),headings=[];
  let fenced=false;
  for(const line of body.split('\n')){
    if(/^\s*(?:```|~~~)/.test(line)){fenced=!fenced;continue;}
    if(fenced)continue;
    const match=line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if(match){const text=markdownSearchText(match[2]);headings.push({depth:match[1].length,text,slug:slugger.slug(text)});}
  }
  allHeadings.set(note.slug,headings);
}
const aliasesByUrl=new Map();
for(const answer of questionAnswers)aliasesByUrl.set(answer.url,[...(aliasesByUrl.get(answer.url)??[]),...answer.questions]);
const notes=searchableNotes(getNotes());
const records=notes.flatMap(note=>{
  const body=bodies.get(note.slug),record={slug:note.slug,title:note.title,section:note.section,sectionLabel:note.sectionLabel,
    kind:'note',url:noteHref(note),summary:note.summary,aliases:searchAliases(note),text:markdownSearchText(body)};
  const isCard=['spell','magic-item','creature'].includes(note.type);
  const headings=allHeadings.get(note.slug).filter(heading=>!isCard||aliasesByUrl.has(`${record.url}#${heading.slug}`));
  return[record,...headingSearchRecords(record,body,headings,aliasesByUrl)];
});
for(const note of getFinderCatalog('forms').filter(note=>note.metadata.kind==='gallery-reference'))records.push({
  slug:note.slug,title:`${note.title} — Stat block`,kind:'gallery',section:note.section,sectionLabel:note.sectionLabel,
  url:noteHref(note),summary:note.summary,aliases:[note.title],text:[note.metadata.gallery_sources,note.metadata.gallery_categories,note.metadata.senses,note.metadata.creature_type,note.metadata.transcription_notes].flat().filter(Boolean).join(' '),
});
const indexed=indexSearch(records);
const countsUrl='/library/character/level-progression-planner/#wizard-level-table';

test('conversational search keeps negations and numbers and uses a bounded synonym/typo vocabulary',()=>{
  assert.deepEqual(searchTerms('How many spells should I have at each level?'),['count','spell','level']);
  assert.deepEqual(searchTerms('Spells WITHOUT concentration at level 5'),['spell','without','concentration','level','5']);
  assert.deepEqual(searchTerms('Prepaired spels in a spellbok'),['prepare','spell','spellbook']);
  assert.ok(searchTerms('spell slots').includes('slot'));
  assert.equal(searchRecords(indexed,'I should please').length,0);
});

test('curated answers link to existing source sections, and every added shortcut is an existing route',()=>{
  assert.ok(questionAnswers.length>8);
  assert.equal(new Set(questionAnswers.map(answer=>answer.id)).size,questionAnswers.length);
  for(const answer of questionAnswers){
    assert.ok(answer.questions.length&&answer.answer.length>30);
    assert.ok(answer.url.startsWith('/library/')&&answer.url.includes('#'));
    for(const link of [{url:answer.url},...(answer.links??[])]){
      const url=new URL(link.url,'https://example.invalid');
      if(url.pathname.startsWith('/library/')){
        const slug=url.pathname.replace(/^\/library\//,'').replace(/\/$/,'');
        assert.ok(bodies.has(slug),link.url);
        assert.ok(!url.hash||allHeadings.get(slug).some(heading=>`#${heading.slug}`===url.hash),link.url);
      }else{
        const route=path.join(repository,'src/pages',url.pathname,'index.astro');
        assert.ok(fs.existsSync(route)||fs.existsSync(path.join(repository,'src/pages',`${url.pathname.replace(/^\//,'').replace(/\/$/,'')}.astro`)),link.url);
        if(url.hash)assert.ok(fs.readFileSync(route,'utf8').includes(`id="${url.hash.slice(1)}"`),link.url);
      }
    }
  }
});

test('natural spell-count questions and technical synonyms lead to the actual Wizard table',()=>{
  for(const query of ['how many spells I should have at each level','spells per level','spellbook totals','prepared spells by level','wizard cantrips by level','wizard level table','how many spells can I prepare at level 5','how many prepaired spels at levle 5']){
    assert.equal(searchRecords(indexed,query)[0]?.url,countsUrl,query);
    if(query!=='wizard level table')assert.equal(findQuestionAnswers(query)[0]?.id,'spell-counts',query);
  }
});

test('home problem examples and related routes return the intended source-backed answer',()=>{
  const queries={
    'Can I cast rituals without preparing them?':'ritual-casting',
    'How do I protect concentration?':'concentration-protection',
    'How do I copy spells into my spellbook?':'copy-spells',
    'How do I stop losing concetration?':'concentration-protection',
    'What is the concentration save DC after damage?':'concentration-damage',
    'How do I deal with Legendary Resistance?':'legendary-resistance',
    'Which creatures can I use for Polymorph?':'form-candidates',
    'Can I cast two concentration spells?':'concentration-one',
    'spells that do not require concentration':'no-concentration-spells',
    'spells without concentration':'no-concentration-spells',
    'How do I protect my spellbook?':'spellbook-backup',
    'Calculate component cost for spells':'component-budget',
  };
  for(const[query,id]of Object.entries(queries)){
    assert.equal(findQuestionAnswers(query)[0]?.id,id,query);
    assert.equal(searchRecords(indexed,query)[0]?.url,questionAnswers.find(answer=>answer.id===id).url,query);
  }
  const noConcentration=findQuestionAnswers('spells without concentration')[0];
  assert.ok(noConcentration.links.some(link=>link.url==='/spells/?focus=no-concentration'));
  assert.ok(questionAnswers.find(answer=>answer.id==='component-budget').links.some(link=>link.url==='/tools/#component-cost'));
  for(const id of ['spell-counts','level-up-spells'])assert.ok(questionAnswers.find(answer=>answer.id===id).links.some(link=>link.url==='/level-up/'));
});

test('unknown questions and unsupported class scope do not invent a quick answer',()=>{
  for(const query of ['Can a cleric use a wizard spellbook?','How many spells should a sorcerer know?','How many prepared spells does a druid have at level 5?','How many bard spells per level?','How many spells can I prepare at level 5 in 2014?','How does 2014 Counterspell work?','Magic Missile','Wish','nonexistent dragon pizza spell','spells without concentration that require concentration','spells with concentration','spells that require concentration']){
    assert.deepEqual(findQuestionAnswers(query),[],query);
  }
  assert.equal(findQuestionAnswers('How do I copy spells into my spellbook?','character').length,0);
  assert.equal(findQuestionAnswers('How do I copy spells into my spellbook?','advanced')[0].id,'copy-spells');
  assert.ok(findQuestionAnswers('Do higher multiclass slots unlock higher Wizard spells?')[0].answer.includes('do not unlock'));
});

test('exact names, title prefixes and filename aliases still lead to canonical cards and notes',()=>{
  for(const[query,slug]of Object.entries({Counterspell:'spells/spell-cards/counterspell-spell','Counter':'spells/spell-cards/counterspell-spell','tashas mind whip':'spells/spell-cards/tasha-s-mind-whip-spell','Spell Tactics':'tactics/spell-tactics','Mobility & Kiting':'tactics/spell-tactics','Quick Finder':'home/quick-finder','General':'home/quick-finder','Battle Familiar':'spells/spell-cards/battle-familiar-spell'})){
    const result=searchRecords(indexed,query)[0];
    assert.equal(result?.slug,slug,query);assert.equal(result?.kind,'note',query);
  }
  assert.equal(records.filter(record=>record.title==='Battle Familiar').length,1);
  assert.equal(records.filter(record=>record.title==='Battle Familiar — Stat block').length,1);
  const itemResults=searchRecords(indexed,'Counterspell','items');
  assert.ok(itemResults.every(record=>record.section==='items'));
  assert.ok(!itemResults.some(record=>record.slug==='spells/spell-cards/counterspell-spell'));
});

test('heading indexing is bounded, preserves full notes and returns only the best destination per parent',()=>{
  assert.equal(records.filter(record=>record.kind==='note').length,notes.length);
  for(const note of notes){
    const headings=records.filter(record=>record.kind==='heading'&&record.slug.split('#')[0]===note.slug);
    assert.ok(headings.length<=10,note.title);assert.ok(headings.every(record=>record.text.length<=1400&&record.parentTitle===note.title&&record.url.includes('#')));
  }
  const results=searchRecords(indexed,'spellbook');
  assert.equal(new Set(results.map(record=>record.slug.split('#')[0])).size,results.length);
  assert.ok(JSON.stringify(records).length<4_000_000,'Index payload stays bounded');
  assert.equal(searchRecords(indexed,'Spellbook Redundancy & Acquisition')[0].kind,'note');
});

test('negations and numeric limits are required even when a longer query permits partial matching',()=>{
  const fixtures=indexSearch([
    {slug:'plain',title:'Spells',section:'spells',sectionLabel:'Spells',url:'/plain/',summary:'',text:'cast ritual spell concentration level 5'},
    {slug:'negative',title:'Reference',section:'spells',sectionLabel:'Spells',url:'/negative/',summary:'',text:'cast ritual spell without concentration level 7'},
  ]);
  assert.deepEqual(searchRecords(fixtures,'cast ritual spells without concentration missing').map(record=>record.slug),['negative']);
  assert.deepEqual(searchRecords(fixtures,'cast ritual spell concentration level 7 missing').map(record=>record.slug),['negative']);
  assert.equal(searchRecords(fixtures,'cast ritual spell concentration level 9 missing').length,0);
});

test('snippets quote a bounded passage from the matching source, not an unrelated summary',()=>{
  const record={title:'Reference',text:'First part. '.repeat(40)+'Copying requires a Wizard spell of a level you can prepare. '+'End part. '.repeat(40),summary:'Unrelated opening summary.'};
  const snippet=searchSnippet(record,'copying wizard spells',180);
  assert.ok(snippet.includes('Copying requires'));assert.ok(snippet.length<=182);
  assert.ok(record.text.includes(snippet.replace(/^…|…$/g,'')));
  assert.ok(!snippet.includes(record.summary));
});

test('typo suggestions are explicit close-name alternatives, not silently changed searches or answers',()=>{
  assert.equal(searchRecords(indexed,'hypontic pattern').length,0);
  assert.equal(searchSuggestions(indexed,'hypontic pattern')[0]?.title,'Hypnotic Pattern');
  assert.equal(searchSuggestions(indexed,'SpellTactics')[0]?.title,'Spell Tactics');
  assert.equal(searchSuggestions(indexed,'QuickFinder')[0]?.title,'Quick Finder');
  assert.equal(searchSuggestions(indexed,'hypontic pattern','items').length,0);
  assert.equal(searchSuggestions(indexed,'how many hypontic pattern spells can I prepare').length,0);
  assert.equal(searchSuggestions(indexed,'thisunknownlongstringwillnotmatchanything').length,0);
  assert.ok(searchSuggestions(indexed,'hypontic pattern').every(record=>record.kind!=='heading'));
  assert.ok(searchSuggestions(indexed,'hypontic pattern').length<=3);
  assert.deepEqual(findQuestionAnswers('hypontic pattern'),[]);
});
