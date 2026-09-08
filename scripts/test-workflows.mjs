import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSession,
  emptySession,
  loadSession,
  changeSession,
  resetSession,
  SESSION_KEY,
} from '../src/features/my-wizard/session.ts';
import {
  loadWizardProfile,
  saveWizardProfile,
  resetWizardProfile,
} from '../src/features/my-wizard/profile.ts';
import {
  getSpellDefense,
  mentionedSpells,
  normalizeSearch,
  buildBadgeKey,
  buildLabel,
} from '../src/lib/spells.ts';
import { extractTableRows } from '../src/lib/compendium-tables.ts';
import { quickTools, toolDirectory } from '../src/data/quick-tools.ts';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
test('session input validation rejects unsafe pins and malformed values', () => {
  assert.deepEqual(parseSession('{'), emptySession());
  assert.deepEqual(parseSession('[]'), emptySession());
  const result = parseSession(
    JSON.stringify({
      concentration: 'web',
      pins: [
        { title: 'No', url: 'javascript:alert(1)' },
        { title: 'No', url: '//example.com' },
        { title: 'Web', url: '/spells/web/' },
      ],
      spellStatus: { web: 'copy', bad: 'invented' },
      checks: { test: 'false', good: true },
      numbers: { bad: -1, good: 0 },
      reviews: { bad: { seen: '1' } },
    }),
  );
  assert.equal(result.concentration, 'web');
  assert.equal(result.pins.length, 1);
  assert.deepEqual(result.spellStatus, { web: 'copy' });
  assert.deepEqual(result.checks, { good: true });
  assert.deepEqual(result.numbers, { good: 0 });
  assert.deepEqual(result.reviews, {});
});
test('local notebook and profile persist independently and reset cleanly', () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => memory.set(k, v),
    removeItem: (k) => memory.delete(k),
  };
  globalThis.window = { dispatchEvent: () => true };
  assert.equal(
    changeSession((s) => {
      s.concentration = 'web';
      s.numbers['slot-1'] = 2;
      s.spellStatus.fly = 'wanted';
    }),
    true,
  );
  assert.equal(loadSession().concentration, 'web');
  assert.equal(
    saveWizardProfile({
      name: 'Test',
      build: 'DIV',
      characterLevel: 5,
      wizardLevel: 5,
      intelligence: 18,
      spellSaveDc: 15,
      spellAttackBonus: 7,
      constitutionSave: 4,
      warCaster: true,
      ownedSpells: ['web'],
      preparedSpells: ['web'],
    }),
    true,
  );
  assert.equal(loadWizardProfile().constitutionSave, 4);
  assert.equal(loadWizardProfile().warCaster, true);
  resetWizardProfile();
  assert.equal(loadWizardProfile(), null);
  assert.equal(loadSession().concentration, 'web');
  resetSession();
  assert.deepEqual(loadSession(), emptySession());
  assert.equal(memory.has(SESSION_KEY), false);
  globalThis.localStorage = {
    getItem: () => {
      throw Error('blocked');
    },
    setItem: () => {
      throw Error('blocked');
    },
    removeItem: () => {
      throw Error('blocked');
    },
  };
  assert.deepEqual(loadSession(), emptySession());
  assert.equal(
    changeSession(() => {}),
    false,
  );
  assert.equal(resetSession(), false);
  delete globalThis.localStorage;
  delete globalThis.window;
});
const spells = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (path.endsWith('.json'))
      spells.push(JSON.parse(readFileSync(path, 'utf8')));
  }
}
walk('src/content/spells');
test('spell names are matched without nested-name false positives', () => {
  assert.deepEqual(
    mentionedSpells('Fire Shield', spells).map((s) => s.id),
    ['fire-shield'],
  );
  assert.equal(normalizeSearch('ANTI-caster'), 'anti caster');
});
test('maintained spell aliases resolve once without guessing generic spell names', () => {
  assert.deepEqual(
    mentionedSpells(
      'Tiny Hut / Telepathic Bond / Resilient Sphere / Hideous Laughter',
      spells,
    )
      .map((spell) => spell.id)
      .sort(),
    [
      'leomunds-tiny-hut',
      'rarys-telepathic-bond',
      'otilukes-resilient-sphere',
      'tashas-hideous-laughter',
    ].sort(),
  );
  assert.deepEqual(
    mentionedSpells(
      "Otiluke's Resilient Sphere / Resilient Sphere",
      spells,
    ).map((spell) => spell.id),
    ['otilukes-resilient-sphere'],
  );
  assert.deepEqual(
    mentionedSpells('A globe on a table and a hand on the door.', spells),
    [],
  );
});
test('the source defense ladder retains Resilient Sphere and the abbreviated Globe', () => {
  const chapter = readFileSync(
    'src/content/chapters/14-spell-replacement-ladders.md',
    'utf8',
  );
  const ladder = extractTableRows(chapter, 0).find(
    (row) => row[0] === 'Defense and escape',
  );
  const ids = mentionedSpells(ladder[1], spells, {
    includeSourceShorthand: true,
  }).map((spell) => spell.id);
  assert.equal(ids.length, 9);
  assert.ok(ids.includes('otilukes-resilient-sphere'));
  assert.ok(ids.includes('globe-of-invulnerability'));
});
test('every build relevance badge keeps its own identity and readable label', () => {
  for (const build of [
    'core',
    'chron',
    'div',
    'ill',
    'blade',
    'tank',
    'fighter',
  ]) {
    assert.equal(buildBadgeKey(build), build);
    assert.equal(buildLabel(build), build.toUpperCase());
  }
  assert.equal(buildBadgeKey('bladesinger'), 'blade');
  assert.equal(buildLabel('bladesinger'), 'BLADE');
});
test('character import and saved snapshots are discoverable through the tool search directory', () => {
  const urls = toolDirectory.map((tool) => tool.url);
  assert.equal(new Set(urls).size, urls.length);
  for (const url of ['/play/import/', '/play/#my-character']) {
    const tool = toolDirectory.find((tool) => tool.url === url);
    assert.ok(tool, url);
    assert.match(tool.description, /browser/);
  }
});
test('all quick-reference routes still have populated maintained source tables', () => {
  const files = readdirSync('src/content/chapters');
  for (const tool of quickTools) {
    const file = files.find((file) =>
      file.startsWith(`${String(tool.chapter).padStart(2, '0')}-`),
    );
    assert.ok(file, `${tool.id}: chapter ${tool.chapter} exists`);
    const content = readFileSync(join('src/content/chapters', file), 'utf8');
    for (const index of tool.tables) {
      const rows = extractTableRows(content, index);
      assert.ok(rows.length > 1, `${tool.id}: table ${index} has content`);
      assert.ok(
        rows[0].every(Boolean),
        `${tool.id}: table ${index} has labels`,
      );
      assert.ok(
        rows.slice(1).every((row) => row.length === rows[0].length),
        `${tool.id}: table ${index} retains every labeled column`,
      );
    }
  }
});
test('unknown defenses are not treated as no-save spells', () => {
  const spell = structuredClone(spells[0]);
  spell.rules.save = { ability: null, type: null };
  spell.rules.attackRoll = false;
  spell.rules.castingTime = null;
  assert.equal(getSpellDefense(spell), 'unknown');
  spell.rules.castingTime = 'Action';
  assert.equal(getSpellDefense(spell), 'none');
  spell.rules.attackRoll = true;
  assert.equal(getSpellDefense(spell), 'ac');
  spell.rules.save.ability = 'WIS';
  assert.equal(getSpellDefense(spell), 'wis');
});
