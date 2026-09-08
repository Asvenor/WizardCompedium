import { value, spellRows, classes, norm, owners, checks } from "./model.mjs";
const yes = (record, key) =>
  value(record, key) === true &&
  record.facts[key]?.verification === "user_confirmed";
export function personalize(record, catalog) {
  const rows = spellRows(record);
  const confirmed = rows.filter((s) =>
    ["prepared", "granted", "other"].some((k) => yes(record, `${s.key}.${k}`)),
  );
  const match = (s) => catalog.find((c) => norm(c.name) === norm(s.name));
  const current = confirmed.map((s) => ({ sheet: s, entry: match(s) }));
  const generation = value(record, "rules.generation");
  const wizard = classes(record).find((c) => c.name === "wizard");
  const compatible = (c) =>
    generation === "2024" && c.generation === "2024" && !c.sourceSensitive;
  const book = rows.filter((s) => yes(record, `${s.key}.book`));
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
    s.className?.toLowerCase() === "wizard" &&
    ceiling !== null &&
    (!match(s) || match(s).level <= ceiling);
  const available = current.filter(
    (c) => c.entry && compatible(c.entry) && accessSupported(c.sheet),
  );
  const ritual = book
    .filter((s) => yes(record, `${s.key}.ritual`) && accessSupported(s))
    .map((s) => ({ sheet: s, entry: match(s) }))
    .filter((s) => s.entry && compatible(s.entry));
  const ceilingNext =
    wizard && generation === "2024" && wizard.level < 20
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
  const copies = rows
    .filter(
      (s) => yes(record, `${s.key}.scroll`) && !ownedNames.has(norm(s.name)),
    )
    .map((s) => match(s))
    .filter(
      (c) =>
        c &&
        compatible(c) &&
        ceiling !== null &&
        c.level > 0 &&
        c.level <= ceiling,
    );
  const preparation = book
    .filter((s) => !confirmed.some((p) => norm(p.name) === norm(s.name)))
    .map(match)
    .filter(
      (c) =>
        c &&
        compatible(c) &&
        ceiling !== null &&
        c.level > 0 &&
        c.level <= ceiling,
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
    bookComplete: yes(record, "book.complete"),
    warnings: [
      ...checks(record),
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
