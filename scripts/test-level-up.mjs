import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {compilePlanner, selectLevel, readPlannerState, plannerQuery, levelBounds, parseChoices, inlineParts, SUBCLASSES, ROUTES} from '../src/lib/level-up.ts';

const root = new URL('../src/content/vault/character/', import.meta.url);
const planner = readFileSync(new URL('level-progression-planner.md', root), 'utf8');
const dir = new URL('spell-progressions/', root);
const sources = Object.fromEntries(readdirSync(dir).map(file => [file, readFileSync(new URL(file, dir), 'utf8')]));
const data = compilePlanner(planner, sources);
const vault = JSON.parse(readFileSync(new URL('../src/data/vault-index.json', import.meta.url), 'utf8'));
const at = (subclass, route, level, basis = 'character') => selectLevel(data, {subclass, route, level, basis});
const names = spells => spells.map(s => s.name);

test('all 35 source routes retain 20 complete rows and legal separate acquisition budgets', () => {
  assert.equal(data.routes.length, 35);
  assert.deepEqual(SUBCLASSES, ['Abjurer', 'Bladesinger', 'Chronurgy', 'Conjurer', 'Diviner', 'Illusionist', 'Necromancer']);
  for (const plan of data.routes) {
    assert.equal(plan.rows.length, 20);
    assert.ok(plan.cantrips, `${plan.subclass} ${plan.route} cantrip source`);
    let priorWizard = 0;
    for (const row of plan.rows) {
      const result = at(plan.subclass, plan.route, row.characterLevel);
      assert.equal(result.bookComplete, true);
      assert.ok([0, 1].includes(row.wizardLevel - priorWizard));
      const expectedChoices = row.advanced.startsWith('Wizard') ? (row.wizardLevel === 1 ? 6 : 2) : 0;
      assert.equal(row.normal.spells.length, expectedChoices, `${plan.subclass}/${plan.route}/${row.characterLevel}`);
      assert.equal(result.normalCount, result.baseline?.book ?? 0);
      assert.equal(result.book.length, result.normalCount + result.extraCount, 'No duplicated book acquisition silently spends a choice');
      assert.equal(result.slots.length, row.highestSlot);
      assert.equal(result.baseline?.highest ?? 0, row.highest);
      assert.equal(result.proficiency, data.wizard[row.characterLevel - 1].proficiency);
      if (!result.advancesWizard) {assert.deepEqual(result.checklist, []); assert.equal(row.extra.spells.length, 0);}
      priorWizard = row.wizardLevel;
    }
  }
});

test('every parsed book choice resolves to a recorded spell at or below Wizard access, not shared-slot access', () => {
  const cards = new Map(vault.notes.map(n => [`/library/${n.slug}/`, n]));
  for (const plan of data.routes) for (const row of plan.rows) for (const spell of [...row.normal.spells, ...row.extra.spells]) {
    const card = cards.get(spell.href);
    assert.ok(card, `${spell.name} card exists`);
    assert.ok(Number.isInteger(card.metadata.level) && card.metadata.level >= 1 && card.metadata.level <= row.highest, `${plan.subclass} ${plan.route} Wizard${row.wizardLevel}: ${spell.name} must fit Wizard access`);
  }
});

test('shared calendar is identical across subclasses; no-subclass lookup reveals baseline, never a favored route', () => {
  for (const route of ROUTES) for (let level = 1; level <= 20; level++) {
    const baseline = at('', route.id, level);
    assert.equal(baseline.plan, null);
    assert.equal(baseline.bookComplete, false);
    assert.deepEqual(baseline.book, []);
    assert.deepEqual(baseline.always, []);
    assert.deepEqual(baseline.row.normal.spells, []);
    for (const subclass of SUBCLASSES) {
      const selected = at(subclass.toLowerCase(), route.id, level);
      assert.equal(selected.row.wizardLevel, baseline.row.wizardLevel);
      assert.equal(selected.row.advanced, baseline.row.advanced);
      assert.deepEqual(selected.slots, baseline.slots);
    }
  }
  assert.equal(at('', 'pure', 9).baseline.prepared, 14);
  assert.equal(at('', 'pure', 9).baseline.book, 22);
});

test('preparation, cantrips, baseline, and real non-Savant/Savant totals stay distinct', () => {
  assert.equal(at('diviner', 'pure', 14).baseline.prepared, 18);
  assert.equal(at('diviner', 'pure', 16).baseline.prepared, 21);
  assert.equal(at('diviner', 'pure', 20).baseline.prepared, 25);
  assert.deepEqual([1, 3, 4, 9, 10, 20].map(l => at('diviner', 'pure', l).baseline.cantrips), [3, 3, 4, 4, 5, 5]);
  for (const subclass of SUBCLASSES.map(s => s.toLowerCase())) {
    const savant = !['bladesinger', 'chronurgy'].includes(subclass);
    for (const route of ROUTES) {
      const result = at(subclass, route.id, 20);
      const ordinary = route.id === 'pure' ? 44 : route.id === 'fighter-2' ? 40 : 42;
      assert.equal(result.baseline.book, ordinary);
      assert.equal(result.extraCount, savant ? 9 : 0);
      assert.equal(result.book.length, ordinary + (savant ? 9 : 0));
    }
  }
});

test('caster dips distinguish shared slots from Wizard access and do not repeat acquisitions on dip levels', () => {
  const artificer = at('abjurer', 'artificer-1', 9);
  assert.equal(artificer.row.wizardLevel, 8);
  assert.equal(artificer.casterLevel, 9);
  assert.equal(artificer.baseline.highest, 4);
  assert.equal(artificer.slots.length, 5);
  assert.deepEqual(artificer.slots, [4, 3, 3, 3, 1]);
  assert.equal(artificer.baseline.prepared, 12);
  const cleric = at('illusionist', 'cleric-1', 6);
  assert.equal(cleric.row.wizardLevel, 5);
  assert.equal(cleric.casterLevel, 6);
  assert.deepEqual(cleric.slots, [4, 3, 3]);
  assert.equal(cleric.baseline.prepared, 9);
  assert.deepEqual(cleric.row.normal.spells, []);
  assert.deepEqual(cleric.always, []);
  assert.equal(at('illusionist', 'cleric-1', 7).always.length, 2);
  assert.ok(cleric.plan.dip[0].includes('four level-1 Cleric spells'));
  assert.ok(artificer.plan.dip[0].includes('two separate Artificer preparations'));
});

test('pre-Wizard states, Fighter 2 pause, and Wizard-level lookup have exact printed timing', () => {
  for (const route of ['artificer-1', 'fighter-1', 'fighter-2']) {
    const start = at('necromancer', route, 1);
    assert.equal(start.row.wizardLevel, 0);
    assert.equal(start.baseline, null);
    assert.equal(start.book.length, 0);
    assert.equal(start.slots.length, route === 'artificer-1' ? 1 : 0);
    assert.equal(at('necromancer', route, 0, 'wizard').row.characterLevel, 1);
  }
  const pause = at('chronurgy', 'fighter-2', 7);
  assert.equal(pause.row.wizardLevel, 5);
  assert.equal(pause.casterLevel, 5);
  assert.deepEqual(pause.row.normal.spells, []);
  assert.equal(at('chronurgy', 'fighter-2', 5, 'wizard').row.characterLevel, 6, 'Wizard-level lookup goes to acquisition row, not subsequent dip');
  const last = at('chronurgy', 'fighter-2', 20);
  assert.equal(last.row.wizardLevel, 18);
  assert.match(last.baseline.milestone, /Spell Mastery/);
  assert.ok(!last.checklist.some(c => /Epic Boon/.test(c)));
  assert.equal(last.always.length, 2, 'No Wizard20 Signature Spells on a dip route');
  assert.throws(() => at('chronurgy', 'fighter-2', 19, 'wizard'), RangeError);
});

test('feature preparations never inflate the book or ordinary preparation budget', () => {
  const illusion = at('illusionist', 'pure', 6);
  assert.deepEqual(names(illusion.always), ['Summon Beast', 'Summon Fey']);
  assert.ok(!names(illusion.book).includes('Summon Beast'));
  assert.ok(!names(illusion.book).includes('Summon Fey'));
  assert.equal(illusion.baseline.prepared, 10);
  const necro = at('necromancer', 'pure', 6);
  assert.deepEqual(names(necro.always), ['Animate Dead']);
  assert.ok(!names(necro.book).includes('Animate Dead'));
  for (const subclass of SUBCLASSES.map(s => s.toLowerCase())) {
    const mastery = at(subclass, 'pure', 18), signature = at(subclass, 'pure', 20);
    assert.deepEqual(names(mastery.row.featureSpells), ['Magic Missile', 'Invisibility']);
    assert.deepEqual(names(signature.row.featureSpells), ['Counterspell', 'Dispel Magic']);
    assert.ok(signature.row.featureSpells.every(s => signature.book.some(b => b.href === s.href)));
  }
});

test('query state is validated, bounded, deterministic, and round-trips without user text injection', () => {
  const empty = readPlannerState(new URLSearchParams('basis=character&level=9'), data);
  assert.deepEqual(empty.state, {subclass: '', route: 'pure', basis: 'character', level: 9});
  for (const input of ['-1', '0', '21', '999', '3.5', 'NaN', 'Infinity', '', '02', '2e1', '<script>']) {
    const result = readPlannerState(new URLSearchParams({subclass: 'diviner', level: input}), data);
    assert.equal(result.state.level, 1);
    assert.equal(result.warnings.length, 1);
  }
  const duplicate = readPlannerState(new URLSearchParams('subclass=diviner&subclass=abjurer&route=nope&basis=fish&level=3&level=4'), data);
  assert.equal(duplicate.state.subclass, ''); assert.equal(duplicate.warnings.length, 4);
  const zero = readPlannerState(new URLSearchParams('subclass=diviner&route=fighter-2&basis=wizard&level=0'), data);
  assert.equal(zero.state.level, 0); assert.deepEqual(zero.warnings, []);
  assert.equal(readPlannerState(new URLSearchParams('route=fighter-2&basis=wizard&level=20'), data).state.level, 1);
  for (const plan of data.routes) for (const basis of ['character', 'wizard']) {
    const base = {subclass: plan.subclass, route: plan.route, basis};
    const bounds = levelBounds(data, base);
    for (let level = bounds.min; level <= bounds.max; level++) {
      const state = {...base, level};
      assert.deepEqual(readPlannerState(new URLSearchParams(plannerQuery(state)), data), {state, warnings: []});
    }
  }
});

test('unrecognized source acquisition prose stays unresolved and missing tables fail loudly', () => {
  assert.equal(parseChoices('Choose any two eligible spells').complete, false);
  assert.equal(parseChoices('—').complete, true);
  const incomplete = {...sources, 'abjurer-spell-progression.md': sources['abjurer-spell-progression.md'].replace('| 2 | [Feather Fall]', '| 2 | Choose one: [Feather Fall]')};
  const result = selectLevel(compilePlanner(planner, incomplete), {subclass: 'abjurer', route: 'pure', basis: 'character', level: 2});
  assert.equal(result.bookComplete, false);
  assert.throws(() => compilePlanner(planner, {}), /Missing route/);
  assert.throws(() => compilePlanner('', sources), /complete 1–20/);
  const parts = inlineParts('See [Web](/library/spells/spell-cards/web-spell/) and <img src=x> or [bad](javascript:alert(1)).');
  assert.equal(parts.filter(p => p.href).length, 1);
  assert.equal(parts[0].text, 'See ');
  assert.ok(parts.some(p => p.text.includes('<img src=x>')), 'HTML stays inert text for DOM textContent');
});
