import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "./generated/snapshot.schema.json" with { type: "json" };
import owners from "./generated/owners.json" with { type: "json" };

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
export const validateSnapshot = ajv.compile(schema);
export { owners };
export const clean = (v, limit = 12000) =>
  String(v ?? "")
    .normalize("NFKC")
    .replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,
      "",
    )
    .slice(0, limit)
    .trim();
export const filename = (name) =>
  clean(name, 200).replace(/[\\/:<>"|?*]/g, "_");
export const norm = (text) =>
  clean(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export const abilities = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];
const skillNames = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];
const f = (key, label, group, type = "text", aliases = []) => ({
  key,
  label,
  group,
  type,
  aliases: [label, ...aliases],
});
export const fields = [
  f("identity.name", "Character name", "Identity and progression", "text", [
    "CharacterName",
  ]),
  f(
    "identity.classes",
    "Classes and levels",
    "Identity and progression",
    "text",
    ["Class & Level", "CLASS LEVEL", "ClassLevel"],
  ),
  f("identity.level", "Character level", "Identity and progression", "number", [
    "Total level",
  ]),
  f("identity.subclass", "Subclass", "Identity and progression"),
  f("identity.species", "Species", "Identity and progression", "text", [
    "Race",
  ]),
  f("identity.background", "Background", "Identity and progression"),
  f("identity.alignment", "Alignment", "Identity and progression"),
  f("identity.size", "Size", "Identity and progression"),
  ...abilities.flatMap((a) => [
    f(
      `abilities.${a}.score`,
      a[0].toUpperCase() + a.slice(1),
      "Ability scores",
      "number",
      [a.slice(0, 3)],
    ),
    f(`abilities.${a}.modifier`, `${a} modifier`, "Ability scores", "number", [
      `${a.slice(0, 3)}mod`,
    ]),
  ]),
  ...[
    ["ac", "Armor Class", "AC"],
    ["hp_current", "Current Hit Points", "HPCurrent"],
    ["hp_max", "Maximum Hit Points", "HPMax"],
    ["hp_temp", "Temporary Hit Points", "HPTemp"],
    ["initiative", "Initiative", "Init"],
    ["proficiency", "Proficiency bonus", "ProfBonus"],
  ].map(([k, l, a]) =>
    f(`defenses.${k}`, l, "Defenses", "number", [
      a,
      k === "hp_max" ? "Hit Point Maximum" : l,
    ]),
  ),
  f("defenses.hit_dice", "Hit Dice", "Defenses", "text", ["HDTotal"]),
  f("defenses.movement", "Movement", "Defenses", "text", ["Speed"]),
  f("defenses.resistances", "Resistances and immunities", "Defenses", "long", [
    "Defenses",
  ]),
  ...abilities.map((a) =>
    f(`saves.${a}`, `${a} saving throw`, "Skills and proficiencies", "number", [
      `ST ${a.slice(0, 3)}`,
    ]),
  ),
  ...skillNames.map((a) =>
    f(`skills.${norm(a)}`, a, "Skills and proficiencies", "text"),
  ),
  f(
    "skills.proficiencies",
    "Proficiencies",
    "Skills and proficiencies",
    "long",
  ),
  ...["Perception", "Investigation", "Insight"].map((a) =>
    f(
      `passives.${a.toLowerCase()}`,
      `Passive ${a}`,
      "Skills and proficiencies",
      "number",
      [a === "Perception" ? "Passive" : `Passive ${a}`],
    ),
  ),
  f("features.feats", "Feats", "Features and feats", "long"),
  f("features.class", "Class features", "Features and feats", "long"),
  f("features.species", "Species features", "Features and feats", "long"),
  f("features.other", "Features and traits", "Features and feats", "long", [
    "Features & Traits",
  ]),
  ...[
    "Attacks",
    "Weapons",
    "Armor and shields",
    "Equipment",
    "Tools",
    "Languages",
    "Currency",
  ].map((a) =>
    f(`equipment.${norm(a)}`, a, "Equipment", "long", [
      a === "Attacks" ? "Attacks & Spellcasting" : a,
    ]),
  ),
  f("casting.ability", "Spellcasting ability", "Spellcasting", "text", [
    "SpellcastingAbility",
  ]),
  f("casting.dc", "Spell save DC", "Spellcasting", "number", ["SpellSaveDC"]),
  f("casting.attack", "Spell attack bonus", "Spellcasting", "number", [
    "SpellAtkBonus",
  ]),
  ...Array.from({ length: 9 }, (_, i) =>
    f(
      `slots.level${i + 1}`,
      `Level ${i + 1} spell slots`,
      "Spellcasting",
      "text",
      [`SlotsTotal ${i + 19}`, `Slots ${i + 1}`],
    ),
  ),
  f(
    "book.complete",
    "Complete spellbook reviewed",
    "Spellbook and preparation",
    "boolean",
  ),
  f(
    "book.preparation_complete",
    "Current preparation fully reviewed",
    "Spellbook and preparation",
    "boolean",
  ),
  f("rules.generation", "Rules generation", "Ruleset and homebrew", "ruleset", [
    "Ruleset",
  ]),
  f("rules.homebrew", "Homebrew present", "Ruleset and homebrew", "boolean"),
  f(
    "rules.legacy",
    "Legacy options allowed",
    "Ruleset and homebrew",
    "boolean",
  ),
  f(
    "rules.rulings",
    "DM rulings and compatibility notes",
    "Ruleset and homebrew",
    "long",
    ["DM rulings"],
  ),
  f(
    "notes.custom",
    "Notes and custom entries",
    "Ruleset and homebrew",
    "long",
    ["Notes", "Custom entries"],
  ),
];
export const statuses = {
  book: "In spellbook",
  prepared: "Currently prepared",
  granted: "Granted / always prepared",
  other: "Known from another class / feature",
  scroll: "Owned scroll",
};
export const unknown = () => ({
  value: null,
  provenance: "sheet_observed",
  confidence: 0,
  verification: "unknown",
  source: { page: null, label: "Not found", method: "text" },
  alternatives: [],
});
export function blankDraft() {
  return {
    facts: Object.fromEntries(fields.map((f) => [f.key, unknown()])),
    source: {
      type: "manual",
      filename: null,
      sha256: null,
      page_count: 0,
      methods: ["manual"],
      retained: false,
    },
    warnings: [],
  };
}
export const value = (record, key) => record?.facts?.[key]?.value ?? null;
export function classes(record) {
  return [
    ...String(value(record, "identity.classes") ?? "").matchAll(
      /(Artificer|Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard)\s*(\d{1,2})\b/gi,
    ),
  ].map((m) => ({ name: m[1].toLowerCase(), level: Number(m[2]) }));
}
export function spellRows(record) {
  return Object.keys(record?.facts ?? {})
    .filter((k) => /^spells\.[a-z0-9_]+\.name$/.test(k))
    .map((k) => {
      const prefix = k.slice(0, -5);
      return {
        key: prefix,
        name: value(record, k),
        level: value(record, `${prefix}.level`),
        className: value(record, `${prefix}.class`),
        ritual: value(record, `${prefix}.ritual`),
        ...Object.fromEntries(
          Object.keys(statuses).map((s) => [
            s,
            value(record, `${prefix}.${s}`),
          ]),
        ),
      };
    });
}
export function addSpell(draft, name = "", source = null) {
  if (spellRows(draft).length >= 250)
    throw Error("This import supports up to 250 spell entries.");
  const prefix = `spells.s${crypto.randomUUID().replaceAll("-", "")}`;
  for (const [key, val] of Object.entries({
    name: clean(name, 200) || null,
    level: null,
    class: null,
    ritual: null,
    ...Object.fromEntries(Object.keys(statuses).map((s) => [s, null])),
  })) {
    draft.facts[`${prefix}.${key}`] = {
      ...unknown(),
      value: val,
      ...(source
        ? {
            source,
            confidence: source.method === "ocr" ? 0.55 : 0.8,
            verification: val === null ? "unknown" : "needs_confirmation",
          }
        : {}),
    };
  }
  return prefix;
}
export function correct(draft, key, next) {
  const before = draft.facts[key] ?? unknown();
  draft.facts[key] = {
    ...before,
    value: typeof next === "string" ? clean(next) : next,
    provenance: "user_reported",
    verification: next === null ? "unknown" : "user_confirmed",
    source: before.source.page
      ? before.source
      : { page: null, label: "Player review", method: "manual" },
  };
}
export function checks(record) {
  const warnings = [];
  const v = (k) => value(record, k);
  const cs = classes(record);
  if (!v("identity.name"))
    warnings.push(
      "A character name is required. All other fields may remain unknown.",
    );
  if (!v("rules.generation"))
    warnings.push(
      "Rules generation is unknown. Version-dependent advice is withheld.",
    );
  if (cs.length > 1)
    warnings.push(
      "Multiclass: class-specific preparation, spell sources and learning limits need separate confirmation. Combined slots do not prove Wizard access.",
    );
  if (
    cs.some((c) => c.level < 1 || c.level > 20) ||
    (v("identity.level") !== null &&
      (v("identity.level") < 1 || v("identity.level") > 20))
  )
    warnings.push(
      "A class or character level is outside the standard 1–20 range. Confirm the reading or homebrew.",
    );
  if (!cs.length)
    warnings.push(
      "Class levels are unknown or unsupported. Use “Wizard 5 / Fighter 1” to enable level checks.",
    );
  if (
    cs.length &&
    v("identity.level") !== null &&
    cs.reduce((n, c) => n + c.level, 0) !== v("identity.level")
  )
    warnings.push(
      "Class levels do not add up to the reported character level.",
    );
  for (const a of abilities) {
    const s = v(`abilities.${a}.score`),
      m = v(`abilities.${a}.modifier`);
    if (s !== null && (s < 1 || s > 30))
      warnings.push(
        `${a}: score outside the standard 1–30 range; confirm homebrew or extraction.`,
      );
    if (s !== null && m !== null && m !== Math.floor((s - 10) / 2))
      warnings.push(
        `${a}: printed modifier differs from floor((score − 10) / 2). Check bonuses or transcription; no value was changed.`,
      );
  }
  if (
    v("defenses.hp_current") !== null &&
    v("defenses.hp_max") !== null &&
    v("defenses.hp_current") > v("defenses.hp_max")
  )
    warnings.push(
      "Current HP exceeds maximum HP. Temporary HP belongs in its own field.",
    );
  if (
    ["defenses.hp_current", "defenses.hp_max", "defenses.hp_temp"].some(
      (k) => v(k) !== null && v(k) < 0,
    )
  )
    warnings.push(
      "A Hit Point value is negative. Check the transcription or campaign convention.",
    );
  if (
    spellRows(record).some(
      (s) =>
        s.level !== null &&
        (!Number.isInteger(s.level) || s.level < 0 || s.level > 9),
    )
  )
    warnings.push(
      "A spell level is outside 0–9. Check the entry; 0 means cantrip.",
    );
  if (v("rules.generation") === "2024") {
    const pb =
      owners["rule.character_advancement.core2024"].mechanics
        .proficiency_by_character_level[v("identity.level")];
    if (
      pb &&
      v("defenses.proficiency") !== null &&
      pb !== v("defenses.proficiency")
    )
      warnings.push(
        `Proficiency bonus differs from ${pb} in the canonical 2024 advancement table.`,
      );
    const wiz = cs.find((c) => c.name === "wizard");
    if (wiz) {
      const row = owners["class.wizard.core2024"].progression.find(
        (r) => r.wizard_level === wiz.level,
      );
      const spells = spellRows(record);
      const counted = spells.filter(
        (s) =>
          s.prepared === true &&
          s.granted !== true &&
          s.className?.toLowerCase() === "wizard" &&
          s.level > 0,
      );
      if (row && counted.length > row.prepared)
        warnings.push(
          `Confirmed Wizard preparations exceed the base ${row.prepared} from the 2024 class table. Check grants and DM exceptions.`,
        );
    }
  }
  if (v("rules.homebrew") === true)
    warnings.push(
      "Homebrew requires player/DM confirmation; importing is not a legality certificate.",
    );
  if (v("rules.generation") === "mixed" || v("rules.legacy") === true)
    warnings.push(
      "Mixed/legacy permission is campaign-dependent. A displayed D&D Beyond option does not establish compatibility.",
    );
  if (v("book.complete") !== true)
    warnings.push(
      "Spellbook completeness is unconfirmed; an absent spell is not proven missing.",
    );
  if (v("book.preparation_complete") !== true)
    warnings.push(
      "Preparation completeness is unconfirmed; only individually confirmed options are shown as available.",
    );
  if (!spellRows(record).length)
    warnings.push(
      "No spell entries found. Spell pages may be missing; add spells manually or upload a complete export.",
    );
  return warnings;
}
export function makeSnapshot(
  draft,
  observations,
  previous = null,
  characterId = null,
  retained = false,
) {
  const now = new Date().toISOString();
  const facts = structuredClone(draft.facts);
  const corrections = [
    ...new Set([...Object.keys(facts), ...Object.keys(observations)]),
  ]
    .filter(
      (k) =>
        JSON.stringify(facts[k]?.value ?? null) !==
        JSON.stringify(observations[k]?.value ?? null),
    )
    .map((path) => ({
      path,
      before: observations[path]?.value ?? null,
      after: facts[path]?.value ?? null,
      recorded_at: now,
    }));
  const snapshot = {
    schema_type: "character",
    schema_version: "1.1.0",
    id: `snapshot.${crypto.randomUUID().replaceAll("-", "_")}`,
    character_id:
      previous?.character_id ??
      characterId ??
      `character.${crypto.randomUUID().replaceAll("-", "_")}`,
    revision: (previous?.revision ?? 0) + 1,
    name: clean(facts["identity.name"].value, 200),
    observed_at: null,
    recorded_at: now,
    source: { ...draft.source, retained },
    ruleset_profile_ref:
      value(draft, "rules.generation") === "2024"
        ? "ruleset.core2024.v1"
        : null,
    facts,
    observations: structuredClone(observations),
    corrections,
    unknowns: Object.entries(facts)
      .filter(
        ([, f]) => f.value === null || f.verification !== "user_confirmed",
      )
      .map(([k]) => k),
    scope_restrictions: [
      ...checks(draft),
      "Player-confirmed sheet state is not independently rules-verified.",
      "Observed date is unknown; import time is not the sheet creation date.",
      "Storage is local to this browser profile; no account or cross-device sync.",
    ],
    previous_snapshot_ref: previous?.id ?? null,
  };
  if (!validateSnapshot(snapshot))
    throw Error("Snapshot validation failed. Review the fields before saving.");
  if (!snapshot.name) throw Error("Enter a character name.");
  return snapshot;
}
export function comparison(previous, next) {
  const changes = [];
  for (const f of fields) {
    const a = value(previous, f.key),
      b = value(next, f.key);
    if (JSON.stringify(a) !== JSON.stringify(b))
      changes.push({ label: f.label, before: a, after: b });
  }
  const a = spellRows(previous),
    b = spellRows(next);
  for (const name of new Set([...a, ...b].map((s) => norm(s.name)))) {
    const left = a.filter((s) => norm(s.name) === name),
      right = b.filter((s) => norm(s.name) === name);
    const summarize = (rows) =>
      rows
        .map(
          (s) =>
            `${s.name} [${
              Object.entries(statuses)
                .filter(([k]) => s[k] === true)
                .map(([, l]) => l)
                .join(", ") || "unconfirmed"
            }]; level ${s.level ?? "?"}; source ${s.className ?? "?"}; ritual ${s.ritual ?? "?"}`,
        )
        .sort()
        .join(" / ") || null;
    if (summarize(left) !== summarize(right))
      changes.push({
        label: "Spell state",
        before: summarize(left),
        after: summarize(right),
      });
  }
  return changes;
}
