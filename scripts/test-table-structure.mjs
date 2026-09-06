import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractTableRows } from '../src/lib/compendium-tables.ts';

const chapter = readFileSync(new URL('../src/content/chapters/11-wizard-spell-master-table-and-research-bank.md', import.meta.url), 'utf8');
const choiceMap = chapter.split('<!-- source:B00145 -->')[1].split('<!-- source:B00146 -->')[0];
// Frozen from revision 22e4d71: contextual recommendations, not universal spell metadata.
const expectedChoice = [
  {"level":1,"category":"control / denial","rows":[["Grease","non-concentration control"],["Sleep","early encounter shutdown"]],"notes":[]},
  {"level":1,"category":"flex / defense / mobility","rows":[["Shield","Reaction defense"],["Absorb Elements","elemental defense"],["Find Familiar","scouting + utility"]],"notes":[]},
  {"level":1,"category":"strategy / copy-first","rows":[["Detect Magic","ritual utility"],["Identify","ritual utility"],["Alarm","ritual utility"],["Comprehend Languages","ritual utility"],["Unseen Servant","ritual utility"],["Feather Fall","insurance"]],"notes":[]},
  {"level":2,"category":"control / denial","rows":[["Web","area lockdown"],["Levitate","vertical / single-target control"],["Suggestion","social / encounter control"]],"notes":[]},
  {"level":2,"category":"flex / defense / mobility","rows":[["Misty Step","emergency reposition"],["Mirror Image","non-concentration defense"],["Invisibility","stealth / escape"]],"notes":[]},
  {"level":2,"category":"strategy / copy-first","rows":[["Rope Trick","low-pressure utility"],["Augury","low-pressure utility"],["Locate Object","low-pressure utility"]],"notes":["Expanded options only when selectable"]},
  {"level":3,"category":"control / denial","rows":[["Counterspell","Reaction denial"],["Hypnotic Pattern","mass shutdown"],["Sleet Storm","formation disruption"],["Slow","formation disruption"]],"notes":[]},
  {"level":3,"category":"flex / defense / mobility","rows":[["Fly","concentration mobility"],["Dispel Magic","persistent-magic answer"],["Fireball","area-damage coverage"]],"notes":[]},
  {"level":3,"category":"strategy / copy-first","rows":[["Tiny Hut","strong copy targets"],["Phantom Steed","strong copy targets"],["Sending","strong copy targets"],["Animate Dead","build / campaign dependent"]],"notes":[]},
  {"level":4,"category":"control / denial","rows":[["Polymorph","flexible encounter swing"],["Banishment","clean removal"],["Resilient Sphere","protected removal"]],"notes":[]},
  {"level":4,"category":"flex / defense / mobility","rows":[["Dimension Door","rescue / reposition"],["Arcane Eye","scouting"],["Greater Invisibility","combat + stealth"]],"notes":[]},
  {"level":4,"category":"strategy / copy-first","rows":[["Divination","information"],["Conjure Minor Elementals","build / table ceiling"]],"notes":[]},
  {"level":5,"category":"control / denial","rows":[["Wall of Force","hard control"],["Telekinesis","sustained manipulation"],["Synaptic Static","non-concentration area pressure"]],"notes":[]},
  {"level":5,"category":"flex / defense / mobility","rows":[["Bigby's Hand","versatile concentration tool"],["Scrying","strategic information"]],"notes":[]},
  {"level":5,"category":"strategy / copy-first","rows":[["Telepathic Bond","ritual / downtime value"],["Contact Other Plane","ritual / downtime value"],["Planar Binding","ritual / downtime value"]],"notes":[]},
  {"level":6,"category":"control / denial","rows":[["Mass Suggestion","non-concentration influence"],["Globe of Invulnerability","anti-magic zone"],["Scatter","forced reposition"]],"notes":[]},
  {"level":6,"category":"flex / defense / mobility","rows":[["Contingency","preloaded defense / escape"],["True Seeing","mission detection"]],"notes":[]},
  {"level":6,"category":"strategy / copy-first","rows":[["Magic Jar","high-ceiling body tech"]],"notes":["Take early only when the campaign can exploit it"]},
  {"level":7,"category":"control / denial","rows":[["Forcecage","hard control"],["Reverse Gravity","open-area control"]],"notes":[]},
  {"level":7,"category":"flex / defense / mobility","rows":[["Teleport","strategic mobility"],["Plane Shift","travel / escape"]],"notes":[]},
  {"level":7,"category":"strategy / copy-first","rows":[["Simulacrum","action economy + strategy"],["Mirage Arcane","campaign-scale tools"],["Sequester","campaign-scale tools"]],"notes":[]},
  {"level":8,"category":"control / denial","rows":[["Maze","no-save removal"],["Antimagic Field","hard anti-magic"],["Antipathy/Sympathy","setup control"]],"notes":[]},
  {"level":8,"category":"flex / defense / mobility","rows":[["Mind Blank","long-duration defense"],["Clone","survival infrastructure"]],"notes":[]},
  {"level":8,"category":"strategy / copy-first","rows":[["Demiplane","infrastructure / storage"],["Telepathy","specialized coordination"]],"notes":[]},
  {"level":9,"category":"control / denial","rows":[["Prismatic Wall","battlefield control"],["Ravenous Void [D]","selectable gravity control"]],"notes":[]},
  {"level":9,"category":"flex / defense / mobility","rows":[["Wish","universal flexibility"],["Shapechange","transformation"],["True Polymorph","transformation"],["Foresight","reliability"]],"notes":[]},
  {"level":9,"category":"strategy / copy-first","rows":[["Gate","planar access / calling"],["Meteor Swarm","raw area damage"],["Time Stop","setup / sequencing"]],"notes":[]}
];
const expectedProgression = [
  ["1","Pure 1Dip 2","Spellcasting, rituals, Arcane Recovery. Open with Shield, Find Familiar, Detect Magic, Fog Cloud, and Sleep; the route supplies the sixth spell. Pure Wizard: add Mage Armor only if needed.","CHRON: Gift of Alacrity or Feather Fall; DIV: Identify; ILL: Silent Image or Disguise Self; BLADE: Thunderwave as the escape option; TANK: Alarm or Protection from Evil and Good"],
  ["2","Pure 2Dip 3","Scholar. Add Absorb Elements + Unseen Servant.","CHRON: Feather Fall if missing; DIV: Feather Fall or Identify if missing; ILL: complete Disguise Self / Silent Image; BLADE: Feather Fall; keep defenses; TANK: Protection from Evil and Good"],
  ["3","Pure 3Dip 4","Subclass online; 2nd-level spells. Add Web + Misty Step.","CHRON: Fortune's Favor only if selectable and affordable; DIV: Suggestion; ILL: Invisibility; BLADE: copy Mirror Image next; TANK: keep CORE"],
  ["4","Pure 4Dip 5","Feat / Ability Score Improvement + cantrip. Add Mirror Image + Rope Trick.","CHRON: Immovable Object when the campaign supports it; DIV: Locate Object or Augury; ILL: Phantasmal Force or Suggestion; BLADE: keep CORE; TANK: keep CORE"],
  ["5","Pure 5Dip 6","3rd-level spells. Add Counterspell + Hypnotic Pattern.","CHRON: Pulse Wave or later Sleet Storm; DIV: Clairvoyance or Dispel Magic; ILL: Major Image or Fear; BLADE: keep Counterspell; Fireball is optional; TANK: Counterspell; Sleet Storm may replace Pattern"],
  ["6","Pure 6Dip 7","Subclass feature. Add Sleet Storm + Fireball or Slow.","CHRON: Slow; DIV: Sending or Tiny Hut; ILL: Major Image, Phantom Steed, or Fear; BLADE: Slow; keep Sleet Storm; TANK: Dispel Magic + Slow"],
  ["7","Pure 7Dip 8","4th-level spells. Add Banishment + Dimension Door.","CHRON: Gravity Sinkhole if selectable; DIV: Arcane Eye or Divination; ILL: Greater Invisibility or Hallucinatory Terrain; BLADE: keep Dimension Door; TANK: keep CORE"],
  ["8","Pure 8Dip 9","Feat / Ability Score Improvement. Add Polymorph + Arcane Eye.","CHRON: Otiluke's Resilient Sphere if preferred; DIV: Divination or Locate Creature; ILL: Hallucinatory Terrain or Greater Invisibility; BLADE: keep Polymorph; TANK: keep CORE"],
  ["9","Pure 9Dip 10","5th-level spells. Add Wall of Force + Synaptic Static.","CHRON: Temporal Shunt only if the Reaction budget supports it; DIV: Scrying or Rary's Telepathic Bond; ILL: Seeming or Mislead; BLADE: Wall of Force; Steel Wind Strike is a later option; TANK: keep CORE"],
  ["10","Pure 10Dip 11","Subclass feature + cantrip. Add Telekinesis + Rary's Telepathic Bond.","CHRON: Telekinesis; DIV: Contact Other Plane or Scrying; ILL: Creation or Seeming; BLADE: Telekinesis or Bigby's Hand; TANK: Telekinesis; Bigby's Hand is optional"],
  ["11","Pure 11Dip 12","6th-level spells. Add Contingency + Mass Suggestion.","CHRON: Gravity Fissure only when the map supports lines; DIV: True Seeing or Globe of Invulnerability; ILL: Programmed Illusion; Magic Jar requires a safe procedure; BLADE: keep CORE; copy Globe later; TANK: Contingency + Globe of Invulnerability"],
  ["12","Pure 12Dip 13","Feat / Ability Score Improvement. Add Globe of Invulnerability + True Seeing; Magic Jar remains gated.","CHRON: Scatter or a missing CORE spell; DIV: complete True Seeing / Globe; ILL: Programmed Illusion or Guards and Wards; BLADE: Globe + True Seeing; TANK: Globe + True Seeing"],
  ["13","Pure 13Dip 14","7th-level spells. Add Simulacrum + Forcecage.","CHRON: Reverse Gravity is the first backfill; DIV: Teleport or Plane Shift when travel is the bottleneck; ILL: Mirage Arcane or Project Image; BLADE: keep CORE; TANK: keep CORE"],
  ["14","Pure 14Dip 15","Subclass feature. Add Mirage Arcane + Teleport.","CHRON: Reverse Gravity or Sequester; DIV: Etherealness or Sequester; ILL: Project Image or Sequester; BLADE: keep Teleport + Mirage Arcane; TANK: keep CORE"],
  ["15","Pure 15Dip 16","8th-level spells. Add Maze + Mind Blank.","CHRON: Dark Star if selectable and party-safe; DIV: Antipathy/Sympathy; ILL: Illusory Dragon or Demiplane; BLADE: keep CORE; TANK: keep CORE; Antipathy/Sympathy when needed"],
  ["16","Pure 16Dip 17","Feat / Ability Score Improvement. Add Antipathy/Sympathy + Demiplane.","CHRON: Reality Break or the missing route spell; DIV: Clone or a telepathy gap; ILL: Illusory Dragon or Telepathy; BLADE: Demiplane for infrastructure; TANK: Demiplane + Antipathy/Sympathy"],
  ["17","Pure 17Dip 18","9th-level spells. Add Wish + Foresight.","CHRON: Time Stop is a later copy, never a replacement; DIV: keep CORE; ILL: keep CORE; BLADE: keep CORE; TANK: keep CORE"],
  ["18","Pure 18Dip 19","Spell Mastery. Add Shapechange + True Polymorph.","CHRON: Time Stop only for planned non-hostile sequences; DIV: Shapechange / True Polymorph; ILL: True Polymorph; BLADE: Shapechange; TANK: keep both"],
  ["19","Pure 19Dip 20","Epic Boon. Add Meteor Swarm + the strongest missing high-level utility or control spell.","CHRON: Ravenous Void if selectable; DIV: fill information, travel, or protection; ILL: fill illusion, deception, or control; BLADE: fill defense or mobility; TANK: fill rescue, information, or control"],
  ["20","Pure 20Dip —","Pure Wizard only: Signature Spells. One-level dips stop at Wizard 19 and do not gain this feature.","CORE: use the decision matrix below; route color does not change eligibility"]
];

test('choice map has nine levels, 27 categories, and 76 separate spell rows with unchanged purposes', () => {
  const levels = choiceMap.split(/^## /m).slice(1);
  assert.equal(levels.length, 9);
  let rowCount = 0;
  levels.forEach((level, levelIndex) => {
    const groups = level.split(/^### /m).slice(1).filter(group => !group.startsWith('Acquisition guidance'));
    assert.equal(groups.length, 3);
    groups.forEach((group, categoryIndex) => {
      const expected = expectedChoice[levelIndex * 3 + categoryIndex];
      assert.equal(group.split('\n')[0].toLowerCase(), expected.category);
      const rows = extractTableRows(group, 0);
      assert.deepEqual(rows[0], ['Spell', 'Main use']);
      assert.deepEqual(rows.slice(1).map(([name, purpose]) => [name, purpose.replace(' (shared guidance)', '')]), expected.rows);
      for (const note of expected.notes) assert.ok(group.includes(note), note);
      rowCount += rows.length - 1;
    });
  });
  assert.equal(rowCount, 76);
  for (const heading of ['master-spellbook-acquisition-table', 'level-up-choice-map', 'spellbook-strategy']) {
    const text = heading.split('-').join(' ');
    assert.ok(chapter.toLowerCase().replace(/-/g, ' ').includes(text));
  }
});

test('ownership pool has 144 individual spell entries and explicit source tags', () => {
  const pool = chapter.split('<!-- source:B00142 -->')[1].split('<!-- source:B00143 -->')[0];
  let count = 0;
  for (let index = 0; index < 10; index++) {
    const rows = extractTableRows(pool, index);
    assert.deepEqual(rows[0], ['Spell', 'Tags']);
    assert.ok(rows.slice(1).every(row => row.length === 2 && !row[0].includes(', ')));
    count += rows.length - 1;
  }
  assert.equal(count, 144);
  assert.ok(pool.includes('[X] and [D] never grant access by themselves'));
});

test('all 20 level-up records and route clauses survive the progression table restructuring', () => {
  const roadmap = readFileSync(new URL('../src/content/chapters/10-compact-spell-progression-roadmap.md', import.meta.url), 'utf8');
  const rows = extractTableRows(roadmap, 2).filter(row => /^\d+$/.test(row[0] ?? ''));
  assert.equal(rows.length, 20);
  const normalize = text => text.replace(/\s+/g, '');
  assert.deepEqual(rows.map(row => row.map(normalize)), expectedProgression.map(row => row.map(normalize)));
  for (const row of rows) for (const route of ['CHRON','DIV','ILL','BLADE','TANK']) {
    const pattern = new RegExp(route + ':\\s*(.*?)(?=;\\s*(?:CHRON|DIV|ILL|BLADE|TANK):|$)', 'i');
    const original = expectedProgression.find(original => original[0] === row[0]);
    assert.equal(row[3].match(pattern)?.[1]?.trim(), original[3].match(pattern)?.[1]?.trim());
  }
});
