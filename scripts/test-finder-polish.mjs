import test from 'node:test';
import assert from 'node:assert/strict';
import {getNote,findNote} from '../src/lib/vault.ts';
import {getCatalog,getFinderCatalog,catalogRecord,catalogFilters,catalogValue,catalogNotes,candidateRoutes} from '../src/lib/catalog.ts';
import {normalizeSearch} from '../src/lib/search.ts';
import {getFormGallery} from '../src/lib/form-gallery.ts';
import {galleryStatsRecords,getGalleryStats} from '../src/lib/form-stats.ts';

test('website labels clarify misleading source titles without losing original lookup',()=>{
  assert.equal(getNote('home/quick-finder').title,'Quick Finder');
  assert.equal(findNote('General').slug,'home/quick-finder');
  assert.equal(getNote('tactics/spell-tactics').title,'Spell Tactics');
  assert.equal(findNote('Mobility & Kiting').slug,'tactics/spell-tactics');
  assert.equal(getNote('tiers/polymorph-friendly-hostile-tier-list').title,'Friendly & Hostile Polymorph Forms Tier List');
  assert.equal(findNote('Friendly Polymorph Forms Tier List').slug,'tiers/polymorph-friendly-hostile-tier-list');
});

test('finder text uses the same accent and punctuation normalization as full-text search',()=>{
  for(const [query,name] of [['tashas mind whip',"Tasha's Mind Whip"],['dragons breath',"Dragon's Breath"]]){
    const matches=getCatalog('spells').filter(n=>normalizeSearch(query).split(' ').every(t=>catalogFilters(n).text.includes(t)));
    assert.equal(matches.length,1);
    assert.equal(matches[0].title,name);
  }
});

test('all recorded creature senses are searchable, filterable and comparable',()=>{
  const forms=getCatalog('forms');
  for(const sense of ['darkvision','blindsight','truesight','tremorsense']){
    const expected=forms.filter(n=>normalizeSearch(String(n.metadata.senses??'')).includes(sense));
    const matches=forms.filter(n=>catalogFilters(n).text.includes(sense));
    for(const n of expected){
      assert.ok(matches.includes(n),`${n.title}: searchable ${sense}`);
      assert.ok(catalogFilters(n).senses.includes(sense),`${n.title}: filterable ${sense}`);
      assert.equal(catalogRecord(n).fields.Senses,String(n.metadata.senses),`${n.title}: comparable senses`);
    }
  }
  assert.equal(forms.filter(n=>catalogFilters(n).senses.includes('darkvision')).length,8);
  assert.equal(forms.filter(n=>catalogFilters(n).senses.includes('blindsight')).length,7);
});

test('all gallery transcriptions are image-pinned, scoped and never replace the checked cards',()=>{
  const gallery=getFormGallery(),only=gallery.filter(entry=>!entry.checkedCardSlug);
  assert.equal(Object.keys(galleryStatsRecords).length,62);
  assert.deepEqual(Object.keys(galleryStatsRecords).sort(),only.map(entry=>entry.slug).sort());
  const allowed=new Set(['cr','creature_type','size','ac','hp','walk_ft','fly_ft','swim_ft','climb_ft','burrow_ft','hover','senses']);
  for(const entry of only){
    const record=galleryStatsRecords[entry.slug];
    assert.ok(entry.images.some(image=>image.sha256===record.imageSha256));
    assert.ok(Object.keys(record.metadata).every(key=>allowed.has(key)),`${entry.title}: scoped statistics`);
    for(const [key,value] of Object.entries(record.metadata)){
      if(['cr','ac','hp'].includes(key)||key.endsWith('_ft'))assert.ok(value===null||typeof value==='number'&&Number.isFinite(value)&&value>=0,`${entry.title}: ${key}`);
    }
    const metadata=getGalleryStats(entry);
    assert.equal(metadata.verification_status,'image-transcribed');
    for(const [route] of candidateRoutes)assert.equal(metadata[route],undefined);
  }
  for(const entry of gallery.filter(entry=>entry.checkedCardSlug))assert.equal(getGalleryStats(entry),undefined);
  assert.equal(getCatalog('forms').length,20);
  const forms=getFinderCatalog('forms');assert.equal(forms.length,82);assert.equal(new Set(forms.map(note=>note.slug)).size,82);
  assert.equal(forms.filter(note=>note.metadata.verification_status==='metadata-checked').length,20);
  assert.equal(forms.filter(note=>note.metadata.verification_status==='image-transcribed').length,62);
  for(const original of getCatalog('forms')){
    const checked=forms.find(note=>note.slug===original.slug);
    for(const [key,value] of Object.entries(original.metadata))assert.deepEqual(checked.metadata[key],value);
  }
});

test('conditional summon statistics stay unknown instead of becoming false CR and speed filters',()=>{
  for(const slug of ['battle-familiar','undead-spirit']){
    const stats=getGalleryStats(getFormGallery().find(entry=>entry.slug===slug));
    assert.equal(stats.cr,null);assert.equal(stats.ac,null);assert.equal(stats.hp,null);
    assert.equal(stats.fly_ft,null);assert.equal(stats.hover,null);assert.ok(stats.transcription_notes.length>0);
    const note=getFinderCatalog('forms').find(note=>note.slug===`gallery/${slug}`);
    assert.ok(!catalogFilters(note).movement.includes('fly'));
    assert.match(catalogRecord(note).fields['Stat-block conditions'],/CR|Challenge|spell/i);
    assert.match(catalogValue(note,'routes'),/Not reviewed/);
  }
  const mammoth=getFinderCatalog('forms').find(note=>note.title==='Mammoth');
  assert.equal(mammoth.metadata.cr,6);assert.equal(mammoth.metadata.ac,13);assert.equal(mammoth.metadata.hp,126);
  assert.equal(catalogValue(mammoth,'movement'),'walk 50 ft');
  const unknown=getFormGallery().find(entry=>entry.slug==='mammoth');
  assert.throws(()=>getGalleryStats({...unknown,images:[{...unknown.images[0],sha256:'changed'}]}),/Review changed/);
  const succubus=getFinderCatalog('forms').find(note=>note.title==='Succubus');
  assert.ok(catalogNotes(succubus).some(note=>note.includes('true form')));
  assert.ok(catalogFilters(succubus).text.includes('true form'));
  for(const archmage of getFinderCatalog('forms').filter(note=>note.title.includes('Archmage')))assert.ok(catalogNotes(archmage).some(note=>/Mage Armor/.test(note)),archmage.title);
});
