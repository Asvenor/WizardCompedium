import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { extractTableRows } from '../src/lib/compendium-tables.ts';
import { getSpellSearchText } from '../src/lib/spells.ts';
import { componentTotals } from '../src/features/calculators/math.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const manifest = JSON.parse(read('src/data/research-integration-20260907.json'));
const spells = readdirSync(new URL('src/content/spells/', root), { recursive: true })
  .filter((path) => path.endsWith('.json'))
  .map((path) => JSON.parse(read('src/content/spells/' + path)));
const byId = new Map(spells.map((spell) => [spell.id, spell]));
const chapter = (number) => read('src/content/chapters/' +
  readdirSync(new URL('src/content/chapters/', root)).find((path) => path.startsWith(String(number).padStart(2, '0') + '-')));

test('all 87 research spells have an explicit disposition without creating off-list Wizard cards', () => {
  assert.equal(manifest.spellInventory.length, 87);
  assert.equal(new Set(manifest.spellInventory.map((row) => row.researchId)).size, 87);
  assert.equal(manifest.newSpellIds.length, 16);
  assert.equal(manifest.enhancedSpellIds.length, 14);
  assert.equal(spells.length, 171);
  for (const row of manifest.spellInventory) {
    if (row.spellId) {
      assert.ok(byId.has(row.spellId), row.name);
      assert.ok(existsSync(new URL(row.path, root)), row.path);
    } else {
      assert.ok(['wish-only', 'subclass-only'].includes(row.status));
      assert.ok(chapter(row.chapter).includes(row.name));
    }
  }
  for (const id of ['summon-beast', 'giant-insect', 'revivify']) assert.equal(byId.has(id), false);
});

test('new Wizard cards have readable tiers, review scope, primary references and ownership rows', () => {
  const pool = chapter(11).split('<!-- source:B00142 -->')[1].split('<!-- source:B00143 -->')[0];
  for (const id of manifest.newSpellIds) {
    const spell = byId.get(id);
    assert.ok(spell);
    assert.match(spell.source.review.access, /Wizard/);
    assert.equal(spell.source.review.date, '2026-09-07');
    assert.ok(spell.source.review.scope.length > 20);
    assert.ok(spell.source.review.references.some((reference) => /dndbeyond\.com|roll20\.net/.test(new URL(reference.url).hostname)));
    assert.match(spell.compendium.tier, /^[SABCD]/);
    assert.ok(spell.compendium.tactics.length >= 2);
    assert.ok(pool.includes('/spells/' + id + '/'), id);
  }
  assert.equal(byId.get('circle-of-power').level, 5);
  assert.equal(byId.get('summon-fey').level, 3);
  for (const id of manifest.partialMechanics) {
    assert.equal(byId.get(id).source.sourceSensitive, true);
    assert.match(byId.get(id).source.review.scope, /unavailable/);
  }
});

test('Wish targets use separate rows and exclude ninth-level duplication', () => {
  const text = chapter(22);
  const core = text.match(/<div[^>]*data-research-table="wish-core"[\s\S]*?<\/div>/)[0];
  const expanded = text.match(/<div[^>]*data-research-table="wish-expanded"[\s\S]*?<\/div>/)[0];
  const rows = extractTableRows(core, 0);
  const extra = extractTableRows(expanded, 0);
  assert.equal(rows.length - 1, 21);
  assert.equal(extra.length - 1, 5);
  for (const row of rows.slice(1)) assert.match(row[1], /^[1-8] · /);
  for (const name of ['Giant Insect', 'Revivify', "Heroes' Feast", 'Prayer of Healing']) assert.ok(rows.some((row) => row[0] === name));
  for (const name of manifest.expandedWishLeads) assert.ok(extra.some((row) => row[0] === name));
  assert.ok(!rows.some((row) => /Foresight|True Resurrection/.test(row[0])));
  assert.match(text, /Foresight and True Resurrection are ninth-level spells and are excluded/);
  assert.match(text, /120 days/);
  assert.match(text, /two-caster sequence/);
  assert.match(chapter(6), /Wizard 6/);
  assert.match(chapter(30), /additional hour|extra hour/);
});

test('research supplements are searchable and priced components distinguish retained costs', () => {
  for (const id of manifest.enhancedSpellIds) assert.ok(byId.get(id).compendium.tactics.length >= 2, id);
  assert.ok(getSpellSearchText(byId.get('summon-fey')).includes('flower'));
  assert.ok(getSpellSearchText(byId.get('circle-of-power')).includes('wizard'));
  const items = ['chromatic-orb', 'summon-fey', 'mordenkainens-sword']
    .map((id) => ({ ...byId.get(id).rules.components, quantity: 1 }));
  assert.deepEqual(componentTotals(items), { consumed: 0, required: 600, incomplete: 0 });
  assert.match(byId.get('minor-illusion').compendium.tactics.join(' '), /requires.*spell slot/);
  assert.match(byId.get('phantom-steed').rules.castingTime, /11 minutes/);
});

test('all combo leads are mapped and imported tiers are editorial, not fabricated creator quotations', () => {
  assert.equal(manifest.comboInventory.length, 18);
  assert.equal(new Set(manifest.comboInventory.map((row) => row.id)).size, 18);
  for (const row of manifest.comboInventory) assert.ok(chapter(row.chapter).length > 0);
  for (const id of manifest.newSpellIds) {
    assert.ok(byId.get(id).compendium.warnings.some((warning) => /not a letter grade quoted/.test(warning)));
    assert.ok(byId.get(id).compendium.research.references.every((reference) => reference.url.startsWith('https://www.youtube.com/')));
  }
});
