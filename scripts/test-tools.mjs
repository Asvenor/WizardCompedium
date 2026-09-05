import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readNumber, probabilityToMeet, concentrationDc, componentTotals } from '../src/features/calculators/math.ts';
import { loadWizardProfile, saveWizardProfile, WIZARD_PROFILE_KEY } from '../src/features/my-wizard/profile.ts';

test('d20 probabilities agree with enumerated rolls, including automatic success/failure boundaries', () => {
  for (let dc = 1; dc <= 40; dc++) for (let bonus = -10; bonus <= 30; bonus++) {
    const successes = Array.from({ length: 20 }, (_, i) => i + 1).filter(roll => roll + bonus >= dc).length;
    assert.equal(probabilityToMeet(dc, bonus), successes / 20);
  }
  assert.equal(probabilityToMeet(10, 5), 0.8);
  assert.equal(1 - (1 - probabilityToMeet(10, 5)) ** 2, 0.96);
  assert.equal(concentrationDc(31), 15);
  assert.equal(concentrationDc(200), 30);
});

test('invalid or unfinished inputs never become zero or fractional sets', () => {
  for (const input of ['', ' ', '-1', '0', '1.5', 'Infinity', 'NaN', '1000']) assert.equal(readNumber(input, 1, 999), null);
  assert.equal(readNumber('0', 0, 100, false), 0);
  assert.equal(readNumber('10.50', 0, 100, false), 10.5);
});

test('component totals include both Clone components and mark unknown rows as incomplete', () => {
  const clone = JSON.parse(readFileSync(new URL('../src/content/spells/level-8/clone.json', import.meta.url))).rules.components;
  const items = clone.items.map(item => ({ ...item, quantity: 2 }));
  assert.deepEqual(componentTotals(items), { consumed: 2000, required: 4000, incomplete: 0 });
  assert.deepEqual(componentTotals([...items, { gpCost: null, consumed: true, quantity: 1 }]), { consumed: 2000, required: 4000, incomplete: 1 });
  assert.deepEqual(componentTotals([{ gpCost: 0, consumed: false, quantity: 1 }]), { consumed: 0, required: 0, incomplete: 0 });
});

test('malformed saved profiles and blocked storage do not crash tools', () => {
  let stored = '{';
  globalThis.localStorage = { getItem: key => { assert.equal(key, WIZARD_PROFILE_KEY); return stored; }, setItem: () => { throw Error('Storage blocked'); } };
  assert.equal(loadWizardProfile(), null);
  stored = JSON.stringify({ name: 123, build: 'invalid', preparedSpells: null, ownedSpells: [false, 'shield', 'shield'], characterLevel: 4, wizardLevel: 9 });
  const profile = loadWizardProfile();
  assert.deepEqual(profile.preparedSpells, []);
  assert.deepEqual(profile.ownedSpells, ['shield']);
  assert.equal(profile.build, 'CORE');
  assert.equal(profile.wizardLevel, 4);
  assert.equal(saveWizardProfile(profile), false);
  delete globalThis.localStorage;
});
