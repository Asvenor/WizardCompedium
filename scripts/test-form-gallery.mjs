import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildFormGallery} from './build-form-gallery.mjs';
import {getFormGallery,getFormGalleryEntry,galleryHref,gallerySourceHref,formGalleryInfo} from '../src/lib/form-gallery.ts';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(project,'src/data/form-gallery.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(project,'src/data/vault-index.json'),'utf8'));

test('gallery inventory is reproducibly derived from every embedded creature stat block',()=>{
  assert.deepEqual(data,buildFormGallery(project));
  assert.equal(data.entryCount,82);assert.equal(data.checkedCardCount,20);assert.equal(data.galleryOnlyCount,62);
  assert.equal(data.placementCount,119);assert.equal(data.imageCount,82);
  assert.equal(new Set(data.entries.map(entry=>entry.slug)).size,data.entryCount);
  assert.equal(formGalleryInfo.entryCount,getFormGallery().length);
});

test('all checked cards join once; gallery-only routes do not replace them',()=>{
  const cards=index.notes.filter(note=>note.section==='creatures'&&note.type==='creature');
  const joined=data.entries.filter(entry=>entry.checkedCardSlug);
  assert.deepEqual(joined.map(entry=>entry.checkedCardSlug).sort(),cards.map(card=>card.slug).sort());
  assert.equal(galleryHref(getFormGalleryEntry('giant-ape')),'/library/creatures/creature-cards/giant-ape-creature/');
  assert.equal(galleryHref(getFormGalleryEntry('abjurer-archmage')),'/forms/gallery/abjurer-archmage/');
});

test('images retain their original bytes, valid dimensions and canonical local URLs',()=>{
  for(const entry of getFormGallery()){
    assert.ok(entry.images.length>0);
    assert.equal(new Set(entry.images.map(image=>image.sha256)).size,entry.images.length);
    for(const image of entry.images){
      assert.ok(image.url.startsWith('/vault-assets/100%20Assets/Statblocks%20for%20Compendium/'));
      assert.equal(decodeURIComponent(image.url.slice('/vault-assets/'.length)),image.sourcePath);
      const bytes=fs.readFileSync(path.join(project,'public/vault-assets',image.sourcePath));
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),image.sha256);
      assert.equal(bytes.readUInt32BE(16),image.width);assert.equal(bytes.readUInt32BE(20),image.height);
      assert.ok(image.width>0&&image.height>0);
    }
  }
});

test('source gallery headings and categories remain linked to their original notes',()=>{
  for(const entry of getFormGallery()){
    assert.ok(entry.sources.some(source=>source.kind==='gallery'),`${entry.title} needs a gallery source`);
    for(const source of entry.sources){
      const note=index.notes.find(note=>note.slug===source.slug);
      assert.ok(note);assert.equal(note.title,source.title);assert.equal(note.sourcePath,source.sourcePath);
      const content=fs.readFileSync(path.join(project,'src/content/vault',`${source.slug}.md`),'utf8');
      if(source.heading)assert.ok(content.includes(source.heading),`${entry.title}: ${source.heading}`);
      assert.ok(content.includes(`alt="${entry.title}"`));
      assert.match(gallerySourceHref(source),/^\/library\/creatures\/[a-z0-9/-]+\/(?:#.*)?$/);
    }
  }
});

test('gallery references explicitly leave statistics and eligibility unreviewed',()=>{
  for(const entry of getFormGallery()){
    assert.equal(entry.metadata.verification_status,'metadata-not-reviewed');
    assert.match(entry.metadata.verification,/metadata not reviewed/i);
    assert.match(entry.metadata.rules_version,/Mixed/);
    for(const property of ['cr','hp','ac','creature_type','size','senses','polymorph','shapechange','planar_binding','find_familiar'])assert.equal(entry.metadata[property],undefined);
  }
  const page=fs.readFileSync(path.join(project,'src/pages/forms/gallery/[...slug].astro'),'utf8');
  assert.match(page,/filter\(entry=>!entry.checkedCardSlug\)/);
  assert.match(page,/metadata not reviewed/);assert.match(page,/not confirmation/);
  assert.match(page,/Back to form finder/);assert.match(page,/Open full-size image/);
});
