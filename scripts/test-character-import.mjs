import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parsePages,
  textLines,
} from "../src/features/character-lab/parser.mjs";
import { validateFile } from "../src/features/character-lab/pdf.mjs";
import {
  blankDraft,
  correct,
  makeSnapshot,
  validateSnapshot,
  value,
  spellRows,
  comparison,
  checks,
  filename,
} from "../src/features/character-lab/model.mjs";
import { personalize } from "../src/features/character-lab/personalize.mjs";
const fixture = JSON.parse(
  readFileSync(
    new URL("../tests/fixtures/character-import/pages.json", import.meta.url),
  ),
);
const pages = [
  { page: 1, lines: fixture.identity, method: "text" },
  { page: 2, lines: fixture.spells, method: "text" },
];
const parse = () => parsePages(pages);
const ddbPages = () =>
  JSON.parse(
    readFileSync(
      new URL(
        "../tests/fixtures/character-import/ddb-widgets.json",
        import.meta.url,
      ),
    ),
  );
const confirm = (d) => {
  for (const f of Object.values(d.facts))
    if (f.value !== null) f.verification = "user_confirmed";
  return d;
};
test("text sheet: identity, abilities, defenses, slots and per-field evidence", () => {
  const d = parse();
  assert.equal(value(d, "identity.name"), "Mira Testweaver");
  assert.equal(value(d, "defenses.hp_max"), 32);
  assert.equal(value(d, "casting.dc"), 15);
  assert.equal(value(d, "abilities.intelligence.score"), 18);
  assert.equal(value(d, "slots.level1"), "4 total / 2 remaining");
  for (const f of Object.values(d.facts)) {
    assert.ok(f.source);
    assert.ok("confidence" in f);
    assert.notEqual(f.verification, "user_confirmed");
  }
  assert.equal(d.facts["casting.dc"].source.page, 1);
});
test("ambiguous preparation, scroll, book and cantrip states stay separate", () => {
  const spells = spellRows(parse());
  assert.equal(spells.find((s) => s.name === "Web").prepared, true);
  assert.equal(spells.find((s) => s.name === "Misty Step").prepared, null);
  assert.equal(spells.find((s) => s.name === "Detect Magic").book, true);
  assert.equal(spells.find((s) => s.name === "Detect Magic").prepared, null);
  assert.equal(spells.find((s) => s.name === "Fireball").scroll, true);
  assert.equal(spells.find((s) => s.name === "Fireball").book, null);
  assert.equal(spells.find((s) => s.name === "Mage Hand").level, 0);
});
test("OCR observations remain low confidence and manual corrections preserve evidence", () => {
  const d = parsePages(pages.map((p) => ({ ...p, method: "ocr" })));
  const observed = structuredClone(d.facts);
  assert.ok(d.facts["identity.name"].confidence < 0.8);
  correct(d, "defenses.hp_max", 35);
  const s = makeSnapshot(d, observed);
  assert.equal(s.observations["defenses.hp_max"].value, 32);
  assert.equal(s.facts["defenses.hp_max"].provenance, "user_reported");
  assert.equal(s.corrections[0].after, 35);
  assert.equal(s.facts["identity.name"].confidence, 0.55);
  assert.ok(validateSnapshot(s));
});
test("partial sheets, homebrew and mixed class ambiguity produce explicit warnings", () => {
  const d = parsePages([
    {
      page: 1,
      lines: [
        "Character name: Mira",
        "Class & Level: Artificer 1 / Wizard 4",
        "Notes: Homebrew custom feat",
        "Ruleset: mixed",
      ],
      method: "text",
    },
  ]);
  assert.equal(value(d, "defenses.hp_max"), null);
  assert.equal(value(d, "rules.homebrew"), true);
  assert.ok(checks(d).some((x) => x.includes("Multiclass")));
  assert.ok(checks(d).some((x) => x.toLowerCase().includes("spell pages")));
  assert.equal(makeSnapshot(d, d.facts).ruleset_profile_ref, null);
});
test("arithmetic flags discrepancies without rewriting them", () => {
  const d = parse();
  correct(d, "abilities.intelligence.modifier", 3);
  correct(d, "defenses.hp_current", 100);
  correct(d, "defenses.proficiency", 6);
  correct(d, "identity.level", 8);
  const warnings = checks(d);
  assert.ok(warnings.some((x) => x.includes("modifier differs")));
  assert.ok(warnings.some((x) => x.includes("Current HP exceeds")));
  assert.ok(warnings.some((x) => x.includes("Proficiency bonus differs")));
  assert.ok(warnings.some((x) => x.includes("do not add up")));
  assert.equal(value(d, "defenses.hp_current"), 100);
});
test("snapshots append, compare semantic spell changes and never fill unknowns from history", () => {
  const d = parse();
  const first = makeSnapshot(d, d.facts);
  correct(d, "defenses.ac", 17);
  correct(d, "identity.classes", "Wizard 6");
  correct(d, "defenses.hp_current", null);
  const spell = spellRows(d).find((s) => s.name === "Misty Step");
  correct(d, `${spell.key}.prepared`, true);
  const second = makeSnapshot(d, first.facts, first);
  assert.equal(second.character_id, first.character_id);
  assert.notEqual(first.id, second.id);
  assert.equal(second.previous_snapshot_ref, first.id);
  assert.equal(second.revision, 2);
  assert.equal(value(first, "defenses.ac"), 15);
  assert.equal(value(second, "defenses.hp_current"), null);
  assert.ok(comparison(first, second).some((x) => x.label === "Spell state"));
  assert.ok(comparison(first, second).some((x) => x.label === "Armor Class"));
});
test("schema rejects bad provenance and extra canonical mechanics", () => {
  const d = parse();
  const s = makeSnapshot(d, d.facts);
  assert.ok(validateSnapshot(s));
  s.facts["identity.name"].provenance = "guessed";
  assert.equal(validateSnapshot(s), false);
  delete s.facts["identity.name"].provenance;
  assert.equal(validateSnapshot(s), false);
  s.facts["identity.name"].provenance = "sheet_observed";
  s.mechanics = {};
  assert.equal(validateSnapshot(s), false);
});
test("2014 does not silently become the canonical 2024 rules profile", () => {
  const d = parse();
  correct(d, "rules.generation", "2014");
  assert.equal(makeSnapshot(d, d.facts).ruleset_profile_ref, null);
  correct(d, "rules.generation", "2024");
  assert.equal(
    makeSnapshot(d, d.facts).ruleset_profile_ref,
    "ruleset.core2024.v1",
  );
});
test("same-name recommendation does not grant ownership, preparation or rules compatibility", () => {
  const d = confirm(parse());
  const catalog = [
    {
      id: "web",
      name: "Web",
      level: 2,
      generation: "2024",
      sourceSensitive: false,
      canonicalRefs: ["spell.web.core2024"],
      acquisition: "mandatory",
    },
    {
      id: "fireball",
      name: "Fireball",
      level: 3,
      generation: "2024",
      sourceSensitive: false,
      canonicalRefs: [],
      acquisition: "mandatory",
    },
  ];
  const result = personalize(d, catalog);
  assert.equal(
    result.current.some((s) => s.sheet.name === "Fireball"),
    false,
  );
  assert.equal(result.copies[0].name, "Fireball");
  assert.equal(result.available[0].entry.name, "Web");
  assert.equal(result.bookComplete, false);
  assert.ok(result.decisions.length);
  correct(d, "rules.generation", "2014");
  assert.equal(personalize(d, catalog).available.length, 0);
  assert.equal(personalize(d, catalog).levelup.length, 0);
});
test("conflicting form and text readings are retained", () => {
  const d = parsePages([
    {
      page: 1,
      method: "text",
      widgets: [{ name: "AC", value: "18" }],
      lines: ["Armor Class: 15"],
    },
  ]);
  assert.equal(value(d, "defenses.ac"), null);
  assert.deepEqual(
    d.facts["defenses.ac"].alternatives.map((a) => a.value),
    [18, 15],
  );
  assert.ok(d.facts["defenses.ac"].confidence < 0.5);
});
test("value-above-label geometry and columns are supported", () => {
  const items = [
    ["8", 40, 700],
    ["STRENGTH", 40, 681],
    ["14", 200, 700],
    ["DEXTERITY", 200, 681],
  ].map(([str, x, y]) => ({
    str,
    width: str.length * 5,
    transform: [1, 0, 0, 1, x, y],
  }));
  const d = parsePages([{ page: 1, method: "text", lines: textLines(items) }]);
  assert.equal(value(d, "abilities.strength.score"), 8);
  assert.equal(value(d, "abilities.dexterity.score"), 14);
});
test("real file signature, empty and size checks; unsafe filenames sanitized", async () => {
  await assert.rejects(
    validateFile(new File(["no"], "renamed.pdf", { type: "application/pdf" })),
    /not a PDF/,
  );
  await assert.rejects(validateFile(new File([], "empty.pdf")), /non-empty/);
  await assert.rejects(
    validateFile(new File([new Uint8Array(16 * 1024 * 1024)], "large.pdf")),
    /15 MB/,
  );
  await validateFile(new File(["%PDF-1.7"], "odd-name.bin"));
  assert.equal(filename("../bad\u202efile.pdf"), ".._badfile.pdf");
});
test("blank manual entry requires only a name", () => {
  const d = blankDraft();
  assert.throws(() => makeSnapshot(d, d.facts));
  correct(d, "identity.name", "Manual Wizard");
  const s = makeSnapshot(d, blankDraft().facts);
  assert.ok(validateSnapshot(s));
  assert.equal(s.source.type, "manual");
  assert.equal(value(s, "identity.level"), null);
});
test("ordinary spell table columns retain unknown spells and never infer preparation from bullets", () => {
  const d = parsePages(
    [
      {
        page: 2,
        method: "text",
        lines: [
          { text: "SPELL NAME", x: 40, y: 700 },
          { text: "Web Action 60 ft.", x: 40, y: 680 },
          { text: "Copper Comet", x: 40, y: 660 },
          { text: "● Shield", x: 40, y: 640 },
        ],
      },
    ],
    [{ name: "Web" }, { name: "Shield" }],
  );
  assert.deepEqual(
    spellRows(d).map((s) => s.name),
    ["Web", "Copper Comet", "Shield"],
  );
  assert.ok(spellRows(d).every((s) => s.prepared === null));
});
test("spellbook gaps never become current casting options and unknown class source withholds advice", () => {
  const d = confirm(parse());
  const web = spellRows(d).find((s) => s.name === "Web");
  correct(d, `${web.key}.class`, null);
  const catalog = [
    {
      id: "web",
      name: "Web",
      level: 2,
      generation: "2024",
      canonicalRefs: [],
      acquisition: "mandatory",
    },
  ];
  assert.equal(personalize(d, catalog).available.length, 0);
  assert.ok(
    personalize(d, catalog).current.some((s) => s.sheet.name === "Web"),
  );
});
test("generated owner projections are unique and snapshot schema has no spell mechanics owner", () => {
  const owners = JSON.parse(
    readFileSync(
      new URL(
        "../src/features/character-lab/generated/spell-owners.json",
        import.meta.url,
      ),
    ),
  );
  assert.equal(new Set(owners.map((o) => o.id)).size, owners.length);
  const schema = JSON.parse(
    readFileSync(
      new URL(
        "../src/features/character-lab/generated/snapshot.schema.json",
        import.meta.url,
      ),
    ),
  );
  assert.equal(schema.additionalProperties, false);
  assert.equal("mechanics" in schema.properties, false);
});

test("DDB widgets restore HP, all saving throws, passives and derived multiclass level", () => {
  const d = parsePages(ddbPages());
  assert.equal(value(d, "identity.name"), "Rowan Fixture");
  assert.equal(d.facts["identity.name"].alternatives.length, 0);
  assert.equal(value(d, "identity.level"), 6);
  assert.equal(d.facts["identity.level"].provenance, "derived");
  assert.equal(d.facts["identity.level"].source.method, "calculation");
  assert.equal(value(d, "defenses.hp_max"), 42);
  assert.equal(value(d, "defenses.hp_current"), null);
  assert.equal(value(d, "defenses.hp_temp"), null);
  assert.equal(value(d, "defenses.hit_dice"), "1d8 + 5d6");
  assert.deepEqual(
    [
      "strength",
      "dexterity",
      "constitution",
      "intelligence",
      "wisdom",
      "charisma",
    ].map((a) => value(d, `saves.${a}`)),
    [-1, 2, 5, 6, 1, 0],
  );
  assert.equal(value(d, "skills.animalhandling"), "+1");
  assert.equal(value(d, "passives.perception"), 14);
  assert.equal(value(d, "passives.insight"), 12);
  assert.equal(value(d, "passives.investigation"), 16);
  assert.ok(validateSnapshot(makeSnapshot(d, d.facts)));
});
test("DDB feature columns, inventory quantities and notes never become template headings", () => {
  const d = parsePages(ddbPages());
  assert.equal(value(d, "identity.subclass"), "Diviner");
  assert.match(value(d, "features.class"), /continues\s+into the next column/);
  assert.match(value(d, "features.feats"), /Fictional focus feat/);
  assert.match(value(d, "features.species"), /Fictional trait/);
  assert.match(
    value(d, "equipment.equipment"),
    /Travel Cloak · quantity 2 · weight 4 lb\./,
  );
  assert.match(value(d, "equipment.attacks"), /Training Staff · hit \+2 · 1d6/);
  assert.match(value(d, "equipment.currency"), /CP: 0/);
  assert.equal(value(d, "equipment.languages"), "Common, Elvish");
  assert.match(value(d, "notes.custom"), /journal entry/);
  assert.doesNotMatch(value(d, "features.other"), /NAME QTY WEIGHT/);
  assert.doesNotMatch(value(d, "equipment.equipment"), /All Rights Reserved/);
  assert.equal(value(d, "rules.generation"), null);
});
test("DDB spell rows retain levels, ritual and distinct class sources despite empty duplicate widgets", () => {
  const d = parsePages(ddbPages(), [{ name: "Web" }]),
    spells = spellRows(d);
  assert.equal(spells.length, 5);
  assert.deepEqual(
    spells.map((s) => s.level),
    [0, 1, 1, 1, 2],
  );
  assert.deepEqual(
    spells.filter((s) => s.name === "Detect Magic").map((s) => s.className),
    ["Wizard", "Artificer"],
  );
  assert.equal(spells[1].ritual, true);
  assert.equal(spells[1].prepared, null);
  assert.equal(spells[2].prepared, true);
  assert.equal(spells[3].granted, true);
  assert.equal(spells[4].className, "Wizard");
  assert.ok(spells.every((s) => s.book === null && s.scroll === null));
  assert.equal(value(d, "slots.level1"), "4 total / remaining not recorded");
  assert.equal(value(d, "slots.level2"), "3 total / remaining not recorded");
  assert.equal(value(d, "casting.dc"), 14);
  assert.equal(value(d, "casting.attack"), 6);
});
test("different multiclass casting values stay unselected with class-specific evidence", () => {
  const pages = ddbPages();
  pages[2].widgets.find((w) => w.name === "spellSaveDC0").value = "13 / 14";
  const d = parsePages(pages);
  assert.equal(value(d, "casting.dc"), null);
  assert.match(d.warnings.join(" "), /Artificer \/ Wizard: 13 \/ 14/);
  assert.match(value(d, "notes.custom"), /DC: 13 \/ 14/);
});
test("bare headings, blank form boxes and distant columns never supply invented values", () => {
  const d = parsePages([
    {
      page: 1,
      method: "text",
      widgets: [{ name: "CurrentHP", value: "" }],
      lines: [
        { text: "24", x: 50, y: 710 },
        { text: "Current Hit Points", x: 50, y: 690 },
        { text: "Total", x: 40, y: 650 },
        { text: "HIT DICE", x: 40, y: 630 },
        { text: "EQUIPMENT", x: 300, y: 500 },
        { text: "NAME QTY WEIGHT", x: 300, y: 490 },
        { text: "ACTIONS", x: 40, y: 600 },
        { text: "NOTES", x: 500, y: 580 },
      ],
    },
  ]);
  for (const key of [
    "defenses.hp_current",
    "defenses.hit_dice",
    "equipment.equipment",
    "notes.custom",
  ])
    assert.equal(value(d, key), null);
});
test("unknown or conflicting class levels are not summed into a false total", () => {
  for (const text of ["Wizard 5 / Custom class 2", "Wizard 0", "Wizard 21"]) {
    const d = parsePages([
      {
        page: 1,
        method: "text",
        lines: [],
        widgets: [{ name: "CLASS LEVEL", value: text }],
      },
    ]);
    assert.equal(value(d, "identity.level"), null);
  }
});

test("text-derived totals follow class corrections without replacing explicit totals", () => {
  const d = parsePages([
    {
      page: 1,
      method: "text",
      lines: [
        "Character name: Test Wizard",
        "Class & Level: Wizard 5 / Artificer 1",
      ],
    },
  ]);
  assert.equal(value(d, "identity.level"), 6);
  assert.equal(d.facts["identity.level"].provenance, "derived");
  correct(d, "identity.classes", "Wizard 6 / Artificer 1");
  assert.equal(value(d, "identity.level"), 7);
  correct(d, "identity.classes", "Wizard 6 / Custom class 2");
  assert.equal(value(d, "identity.level"), null);
  correct(d, "identity.classes", "Wizard 6");
  correct(d, "identity.level", 8);
  correct(d, "identity.classes", "Wizard 7");
  assert.equal(value(d, "identity.level"), 8);
  assert.ok(checks(d).some((w) => w.includes("do not add up")));
  const printed = parsePages([
    {
      page: 1,
      method: "text",
      lines: ["Class & Level: Wizard 5", "Character level: 9"],
    },
  ]);
  assert.equal(value(printed, "identity.level"), 9);
  assert.equal(printed.facts["identity.level"].provenance, "sheet_observed");
});

test("duplicate, incomplete and substring class summaries cannot unlock Wizard progression", () => {
  const catalog = [
    {
      name: "Web",
      level: 2,
      generation: "2024",
      canonicalRefs: [],
      acquisition: "mandatory",
    },
  ];
  for (const summary of [
    "Wizard 5 / Custom 2",
    "Wizard 5 / Wizard 5",
    "Wizard 20 / Fighter 1",
    "NotWizard 5",
  ]) {
    const d = confirm(parse());
    correct(d, "identity.classes", summary);
    const advice = personalize(d, catalog);
    assert.equal(advice.available.length, 0, summary);
    assert.equal(advice.levelup.length, 0, summary);
  }
});

test("personalized plans require reviewed progression and respect spell level and ritual conflicts", () => {
  const d = confirm(parse());
  const catalog = [
    {
      name: "Web",
      level: 2,
      generation: "2024",
      canonicalRefs: [],
      ritual: false,
    },
  ];
  const web = spellRows(d).find((s) => s.name === "Web");
  correct(d, `${web.key}.book`, true);
  correct(d, `${web.key}.ritual`, true);
  assert.equal(personalize(d, catalog).ritual.length, 0);
  assert.ok(
    personalize(d, catalog).warnings.some((w) =>
      w.includes("ritual flag conflicts"),
    ),
  );
  correct(d, `${web.key}.level`, 3);
  assert.equal(personalize(d, catalog).available.length, 0);
  assert.equal(personalize(d, catalog).preparation.length, 0);
  correct(d, `${web.key}.level`, 2);
  d.facts["rules.generation"].verification = "needs_confirmation";
  assert.equal(personalize(d, catalog).available.length, 0);
  assert.equal(personalize(d, catalog).ceiling, null);
});

test("preparation is Wizard-source specific and repeated spell rows do not duplicate advice", () => {
  const d = confirm(
    parsePages([
      {
        page: 1,
        method: "text",
        lines: [
          "Character name: Test Wizard",
          "Class & Level: Wizard 5 / Artificer 1",
          "Ruleset: 2024",
          "Spell: Web | level=2 | class=Wizard | book=yes",
          "Spell: Web | level=2 | class=Wizard | book=yes",
          "Spell: Web | level=2 | class=Artificer | prepared=yes",
          "Spell: Shield | level=1 | book=yes",
        ],
      },
    ]),
  );
  const catalog = [
    {
      name: "Web",
      level: 2,
      generation: "2024",
      canonicalRefs: [],
      ritual: false,
    },
    {
      name: "Shield",
      level: 1,
      generation: "2024",
      canonicalRefs: [],
      ritual: false,
    },
  ];
  assert.deepEqual(
    personalize(d, catalog).preparation.map((s) => s.name),
    ["Web"],
  );
  for (const web of spellRows(d).filter((s) => s.className === "Wizard"))
    correct(d, `${web.key}.prepared`, true);
  assert.equal(personalize(d, catalog).available.length, 1);
  assert.equal(personalize(d, catalog).current.length, 3);
});

test("spell history distinguishes an explicit no from an unconfirmed flag", () => {
  const d = parse(),
    web = spellRows(d).find((s) => s.name === "Web");
  correct(d, `${web.key}.scroll`, false);
  const before = structuredClone(d);
  correct(d, `${web.key}.scroll`, null);
  const changes = comparison(before, d);
  assert.equal(changes.length, 1);
  assert.match(changes[0].before, /Owned scroll: no/);
  assert.doesNotMatch(changes[0].after, /Owned scroll: no/);
});

test("casting statistics from separate class pages stay ambiguous, including repeated text", () => {
  const pages = [
    {
      page: 1,
      method: "text",
      lines: [],
      widgets: [
        { name: "spellSaveDC0", value: "13" },
        { name: "spellCastingClass0", value: "Artificer" },
      ],
    },
    {
      page: 2,
      method: "text",
      lines: ["Spell save DC: 14"],
      widgets: [
        { name: "spellSaveDC0", value: "14" },
        { name: "spellCastingClass0", value: "Wizard" },
      ],
    },
  ];
  const d = parsePages(pages);
  assert.equal(value(d, "casting.dc"), null);
  assert.deepEqual(
    d.facts["casting.dc"].alternatives.map((a) => a.value),
    [13, 14],
  );
  assert.match(value(d, "notes.custom"), /Artificer — DC: 13/);
  assert.match(value(d, "notes.custom"), /Wizard — DC: 14/);
  assert.ok(
    d.warnings.some((w) => w.includes("Different spellcasting readings")),
  );
});
