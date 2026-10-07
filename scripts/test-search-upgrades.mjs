import test from 'node:test';
import assert from 'node:assert/strict';
import {getNotes} from '../src/lib/vault.ts';
import {indexSearch,normalizeSearch,searchAliases,searchableNotes,searchRecords} from '../src/lib/search.ts';

const reference=(title,sourcePath,type='reference',section='tactics',metadata={})=>({title,sourcePath,type,section,metadata});
const record=(title,aliases=[],text='',section='tactics')=>({title,aliases,text,section,summary:'',sectionLabel:section,slug:title,url:`/${title}/`});

test('filename and explicit aliases remain searchable after display titles change',()=>{
  const note=reference('Mobility & Kiting','007 Tactics/Spell Tactics.md','reference','tactics',{aliases:['Battlefield tactics']});
  const aliases=searchAliases(note);
  assert.deepEqual(aliases,['Spell Tactics','Battlefield tactics']);
  const entries=indexSearch([record('A general index',[],'Spell Tactics'),record(note.title,aliases)]);
  assert.equal(searchRecords(entries,'spell tactics')[0].title,'Mobility & Kiting');
  assert.equal(searchRecords(entries,'battlefield tactics')[0].title,'Mobility & Kiting');
  assert.equal(searchRecords(entries,'spell tactics','spells').length,0);
});

test('spell filename aliases and optional overlay aliases use the same punctuation normalization',()=>{
  const note={...reference("Tasha’s Mind Whip",'003 Spells/Spell Cards/Tasha’s Mind Whip - Spell.md','spell','spells'),aliases:['Mind Whip']};
  const entries=indexSearch([record(note.title,searchAliases(note),'','spells')]);
  assert.equal(searchRecords(entries,'tashas mind whip')[0].title,note.title);
  assert.equal(searchRecords(entries,'mind whip')[0].title,note.title);
  assert.equal(normalizeSearch('Façade / Dragon’s Breath'),'facade dragons breath');
});

test('only redirects with a canonical card are omitted; tactical guides and unmatched redirects remain',()=>{
  const notes=[
    reference('Battle Familiar','003 Spells/Spell Cards/Battle Familiar - Spell.md','spell','spells'),
    reference('Battle Familiar','003 Spells/Battle Familiar.md','redirect','spells'),
    reference('Battle Familiar','005 Creature, Minions & Forms/Battle Familiar Guide.md','reference','creatures'),
    reference('Existing utility reference','009 Reference/Existing utility reference.md','redirect','reference'),
    reference('Spell Template','011 Inbox/Templates/Spell Template.md','spell','inbox'),
  ];
  const included=searchableNotes(notes);
  assert.equal(included.length,3);
  assert.ok(included.includes(notes[0]));
  assert.ok(included.includes(notes[2]));
  assert.ok(included.includes(notes[3]));
  assert.equal(notes.length,5);
});

test('current vault keeps familiar filenames and one canonical Battle Familiar search result',()=>{
  const notes=searchableNotes(getNotes());
  assert.equal(notes.filter(note=>normalizeSearch(note.title)==='battle familiar').length,1);
  assert.equal(notes.find(note=>normalizeSearch(note.title)==='battle familiar').type,'spell');
  const records=notes.map(note=>({slug:note.slug,title:note.title,section:note.section,sectionLabel:note.sectionLabel,url:`/library/${note.slug}/`,summary:note.summary,text:'',aliases:searchAliases(note)}));
  const indexed=indexSearch(records);
  assert.equal(searchRecords(indexed,'spell tactics')[0].slug,'tactics/spell-tactics');
  assert.equal(searchRecords(indexed,'quick finder')[0].slug,'home/quick-finder');
});
