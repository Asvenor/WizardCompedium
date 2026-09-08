import {
  value,
  spellRows,
  knownClassLevels,
  norm,
  owners,
  checks,
} from "./model.mjs";
const reviewed = (record, key) =>
  record.facts[key]?.verification === "user_confirmed";
const yes = (record, key) =>
  value(record, key) === true && reviewed(record, key);
export function personalize(record, catalog) {
  const rows = spellRows(record);
  const confirmed = rows.filter(
    (s) =>
      reviewed(record, `${s.key}.name`) &&
      ["prepared", "granted", "other"].some((k) =>
        yes(record, `${s.key}.${k}`),
      ),
  );
  const generation = value(record, "rules.generation");
  const byName = new Map();
  for (const entry of catalog) {
    const key = norm(entry.name);
    if (!byName.has(key) || entry.generation === generation)
      byName.set(key, entry);
  }
  const match = (s) => byName.get(norm(s.name));
  const current = confirmed.map((s) => ({
    sheet: s,
    entry: match(s),
    access: ["prepared", "granted", "other"].filter((k) =>
      yes(record, `${s.key}.${k}`),
    ),
  }));
  const progressionConfirmed =
    reviewed(record, "rules.generation") &&
    reviewed(record, "identity.classes");
  const classLevels = progressionConfirmed ? knownClassLevels(record) : null;
  const wizard = classLevels?.find((c) => c.name === "wizard");
  const totalLevel = classLevels?.reduce((total, c) => total + c.level, 0);
  const advancement =
    owners["rule.character_advancement.core2024"].mechanics
      .proficiency_by_character_level;
  const nextLevelSupported =
    totalLevel != null &&
    Object.hasOwn(advancement, totalLevel + 1) &&
    (value(record, "identity.level") === null ||
      value(record, "identity.level") === totalLevel);
  const compatible = (c) =>
    progressionConfirmed &&
    generation === "2024" &&
    c.generation === "2024" &&
    !c.sourceSensitive;
  const book = rows.filter(
    (s) => reviewed(record, `${s.key}.name`) && yes(record, `${s.key}.book`),
  );
  const progression =
    wizard && generation === "2024"
      ? owners["class.wizard.core2024"].progression.find(
          (r) => r.wizard_level === wizard.level,
        )
      : null;
  const ownSlots = progression
    ? owners[progression.slot_row_ref.target_id].mechanics
        .slots_by_caster_level[wizard.level]
    : null;
  const ceiling = ownSlots
    ? ownSlots.reduce((max, n, i) => (n ? i + 1 : max), 0)
    : null;
  const accessSupported = (s) =>
    reviewed(record, `${s.key}.name`) &&
    reviewed(record, `${s.key}.class`) &&
    s.className?.toLowerCase() === "wizard" &&
    ceiling !== null &&
    match(s) &&
    match(s).level <= ceiling &&
    (s.level === null || s.level === match(s).level);
  const unique = (entries) => [
    ...new Map(entries.map((c) => [norm((c.entry ?? c).name), c])).values(),
  ];
  const available = unique(
    current.filter(
      (c) =>
        c.access.some((k) => k === "prepared" || k === "granted") &&
        c.entry &&
        compatible(c.entry) &&
        accessSupported(c.sheet),
    ),
  );
  const ritual = unique(
    book
      .filter((s) => yes(record, `${s.key}.ritual`) && accessSupported(s))
      .map((s) => ({ sheet: s, entry: match(s) }))
      .filter((s) => s.entry?.ritual === true && compatible(s.entry)),
  );
  const ceilingNext =
    wizard &&
    generation === "2024" &&
    nextLevelSupported &&
    wizard.level < owners["class.wizard.core2024"].progression.length
      ? owners[
          "rule.multiclass_slots.core2024"
        ].mechanics.slots_by_caster_level[wizard.level + 1].reduce(
          (max, n, i) => (n ? i + 1 : max),
          0,
        )
      : null;
  const ownedNames = new Set(book.map((s) => norm(s.name)));
  const possibleGaps =
    ceiling === null
      ? []
      : catalog.filter(
          (c) =>
            compatible(c) &&
            c.level > 0 &&
            c.level <= ceiling &&
            !ownedNames.has(norm(c.name)) &&
            c.acquisition === "mandatory",
        );
  const copies = unique(
    rows
      .filter(
        (s) =>
          reviewed(record, `${s.key}.name`) &&
          yes(record, `${s.key}.scroll`) &&
          !ownedNames.has(norm(s.name)) &&
          (s.level === null || s.level === match(s)?.level),
      )
      .map(match)
      .filter(
        (c) =>
          c &&
          compatible(c) &&
          ceiling !== null &&
          c.level > 0 &&
          c.level <= ceiling,
      ),
  );
  const preparation = unique(
    book
      .filter(
        (s) =>
          accessSupported(s) &&
          !available.some((p) => norm(p.sheet.name) === norm(s.name)),
      )
      .map(match)
      .filter((c) => c && compatible(c) && c.level > 0),
  );
  const levelup =
    ceilingNext === null
      ? []
      : catalog.filter(
          (c) =>
            compatible(c) &&
            c.level > 0 &&
            c.level <= ceilingNext &&
            !ownedNames.has(norm(c.name)) &&
            c.acquisition === "mandatory",
        );
  const decisions = Object.values(owners).filter(
    (o) =>
      o.schema_type === "decision_rule" &&
      available.some((s) => s.entry.canonicalRefs.includes(o.option_ref)),
  );
  const unresolvedBook = rows.some(
    (s) =>
      !reviewed(record, `${s.key}.name`) || !reviewed(record, `${s.key}.book`),
  );
  return {
    current,
    available,
    ritual,
    decisions,
    ceiling,
    possibleGaps,
    copies,
    preparation,
    levelup,
    bookComplete: yes(record, "book.complete") && !unresolvedBook,
    nextLevelSupported,
    warnings: [
      ...checks(record),
      ...(yes(record, "book.complete") && unresolvedBook
        ? [
            "Some listed spell names or spellbook classifications are still unconfirmed. Missing spells are shown as possible gaps, not confirmed absences.",
          ]
        : []),
      ...(wizard && !nextLevelSupported
        ? [
            "Next-level advice is withheld because the recorded total is conflicting or the next character level is outside the supported advancement table.",
          ]
        : []),
      ...(!progressionConfirmed
        ? [
            "Confirm the rules generation and class levels before using personalized progression or casting guidance.",
          ]
        : []),
      ...(rows.some(
        (s) =>
          match(s) &&
          ((s.level !== null && s.level !== match(s).level) ||
            (yes(record, `${s.key}.ritual`) && match(s).ritual === false)),
      )
        ? [
            "A recorded spell level or ritual flag conflicts with its compendium entry. The sheet reading is preserved; conflicting automated advice is withheld.",
          ]
        : []),
      ...(current.some((c) => !accessSupported(c.sheet))
        ? [
            "Unknown class source, non-Wizard access or a spell above the known Wizard learning ceiling: sheet state is retained, but automated casting advice is withheld. Check the granting feature or other class separately.",
          ]
        : []),
      ...(current.some((c) => !c.entry)
        ? [
            "Some custom or unmatched spells have no compendium owner. They are retained, but no mechanics are invented.",
          ]
        : []),
      ...(current.some((c) => c.entry && !compatible(c.entry))
        ? [
            "Version-sensitive or unconfirmed spell variants are listed as sheet state only. Confirm the active rules entry before using linked guidance.",
          ]
        : []),
    ],
  };
}
