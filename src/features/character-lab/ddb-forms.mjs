import { clean, norm, fields, classes, addSpell, spellRows } from "./model.mjs";

const aliases = new Map(
  fields.flatMap((f) => f.aliases.map((a) => [norm(a), f.key])),
);
// These are widget names, not printed labels. In particular, a printed "Total"
// or "Animal" must never become a hit-dice or skill reading.
const widgetAliases = {
  maxhp: "defenses.hp_max",
  currenthp: "defenses.hp_current",
  temphp: "defenses.hp_temp",
  total: "defenses.hit_dice",
  animal: "skills.animalhandling",
  passive1: "passives.perception",
  passive2: "passives.insight",
  passive3: "passives.investigation",
  proficiencieslang: "skills.proficiencies",
  ...Object.fromEntries(
    [
      "strength",
      "dexterity",
      "constitution",
      "intelligence",
      "wisdom",
      "charisma",
    ].map((a) => [`st${a}`, `saves.${a}`]),
  ),
};
export function widgetKey(name) {
  const n = norm(name);
  const repeatedIdentity = n.replace(
    /^(charactername|classlevel|race|background)\d+$/,
    "$1",
  );
  return widgetAliases[n] ?? aliases.get(repeatedIdentity);
}
const evidence = (w) => ({
  page: w.page,
  label: clean(w.name, 300),
  method: "acroform",
});
const present = (s) => clean(s) && !/^(?:--+|—|n\/a)$/i.test(clean(s));
const top = (w) =>
  w.rect?.length === 4 ? Math.max(w.rect[1], w.rect[3]) : null;
const numbered = (a, b) =>
  Number(a.name.match(/\d+$/)?.[0] ?? 0) -
  Number(b.name.match(/\d+$/)?.[0] ?? 0);
const spellLevel = (text) =>
  /cantrips/i.test(text)
    ? 0
    : Number(text.match(/\b([1-9])(?:st|nd|rd|th)?\s+level\b/i)?.[1] ?? NaN);

export function parseDDBForms(pages, draft, put, convert) {
  // Read the page annotations themselves: some DDB exports have working widgets
  // but no document-level AcroForm field tree. Keep empty fields as evidence of
  // blank boxes, so text fallback cannot substitute a neighboring label.
  const widgets = pages.flatMap((p) =>
    (p.widgets ?? []).map((w) => ({ ...w, page: p.page })),
  );
  const recognized = new Set();
  for (const w of widgets) {
    const key = widgetKey(w.name),
      field = fields.find((f) => f.key === key);
    if (!field) continue;
    recognized.add(key);
    if (present(w.value))
      put(draft, key, convert(field, w.value), evidence(w), 0.96);
  }
  const blocks = (pattern) =>
    widgets
      .filter((w) => pattern.test(w.name) && present(w.value))
      .sort((a, b) => a.page - b.page || numbered(a, b));
  const bundle = (key, list, headings = false) => {
    if (!list.length) return;
    recognized.add(key);
    const body = list
      .map((w) => `${headings ? `${w.name}\n` : ""}${clean(w.value)}`)
      .join("\n\n");
    const label = list.map((w) => `p${w.page} ${w.name}`).join("; ");
    if (body.length > 12000)
      draft.warnings.push(
        `${fields.find((f) => f.key === key)?.label ?? key} exceeds 12,000 characters; review the original PDF for the remainder.`,
      );
    put(
      draft,
      key,
      clean(body),
      { ...evidence(list[0]), label: clean(label, 300) },
      0.96,
    );
  };
  const features = blocks(/^FeaturesTraits\d*$/i);
  bundle("features.other", features);
  // Section headings can start in one widget and continue in the next column/page.
  const sections = [];
  let section;
  for (const w of features) {
    for (const line of clean(w.value).split("\n")) {
      const heading = line.match(/^\s*===\s*(.*?)\s*===\s*$/);
      if (heading) {
        section = {
          title: heading[1],
          value: "",
          name: `${w.name}: ${heading[1]}`,
          page: w.page,
        };
        sections.push(section);
      } else if (section) section.value += line + "\n";
    }
  }
  bundle(
    "features.feats",
    sections.filter((s) => /^feats$/i.test(s.title)),
  );
  bundle(
    "features.class",
    sections.filter((s) => /features$/i.test(s.title)),
    true,
  );
  bundle(
    "features.species",
    sections.filter((s) => /(?:species|racial) traits$/i.test(s.title)),
    true,
  );
  const wizardSection = sections.find((s) =>
    /^wizard features$/i.test(s.title),
  );
  const subclass = wizardSection?.value.match(
    /\*\s*Wizard Subclass[^\n]*\n\s*\|\s*([^\n]+)/i,
  )?.[1];
  if (subclass) {
    recognized.add("identity.subclass");
    put(
      draft,
      "identity.subclass",
      clean(subclass),
      evidence(wizardSection),
      0.96,
    );
  }
  for (const w of widgets.filter((w) => norm(w.name) === "proficiencieslang")) {
    for (const match of clean(w.value).matchAll(
      /===\s*(TOOLS|LANGUAGES)\s*===\s*([\s\S]*?)(?====|$)/gi,
    )) {
      put(
        draft,
        `equipment.${match[1].toLowerCase()}`,
        clean(match[2]),
        evidence(w),
        0.96,
      );
      recognized.add(`equipment.${match[1].toLowerCase()}`);
    }
  }
  const notes = blocks(
    /^(?:AdditionalNotes\d*|Backstory|AlliesOrganizations|PersonalityTraits\s*|Ideals|Bonds|Flaws|SaveModifiers|Actions\d+)$/i,
  );
  // Retain explicitly recorded biography fields without creating rules facts.
  notes.push(...blocks(/^(GENDER|AGE|HEIGHT|WEIGHT|FAITH|SKIN|EYES|HAIR)$/i));
  const inventory = [],
    attacks = [],
    currency = [],
    castingNotes = [];
  for (const page of pages) {
    const ws = widgets.filter((w) => w.page === page.page);
    // DDB continuation templates can contain empty duplicate names with different
    // casing. A blank template row must not overwrite a populated row above it.
    const get = (name, anchor) =>
      ws
        .filter((w) => norm(w.name) === norm(name) && present(w.value))
        .sort((a, b) =>
          anchor && top(anchor) !== null && top(a) !== null && top(b) !== null
            ? Math.abs(top(a) - top(anchor)) - Math.abs(top(b) - top(anchor))
            : 0,
        )[0];
    const val = (n, anchor) => clean(get(n, anchor)?.value);
    for (const w of ws
      .filter((w) => /^Eq Name\d+$/i.test(w.name) && present(w.value))
      .sort(numbered)) {
      const id = w.name.match(/\d+$/)[0];
      inventory.push({
        ...w,
        value: [
          w.value,
          val(`Eq Qty${id}`) && `quantity ${val(`Eq Qty${id}`)}`,
          val(`Eq Weight${id}`) && `weight ${val(`Eq Weight${id}`)}`,
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
    for (const w of ws
      .filter((w) => /^Wpn Name(?: \d+)?$/i.test(w.name) && present(w.value))
      .sort(numbered)) {
      const id = w.name.match(/\d+$/)?.[0] ?? "1";
      attacks.push({
        ...w,
        value: [
          w.value,
          val(`Wpn${id} AtkBonus`) && `hit ${val(`Wpn${id} AtkBonus`)}`,
          val(`Wpn${id} Damage`),
          val(`Wpn Notes ${id}`),
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
    for (const w of ws.filter(
      (w) => /^(?:CP|SP|EP|GP|PP)$/i.test(w.name) && present(w.value),
    ))
      currency.push({ ...w, value: `${w.name}: ${w.value}` });
    for (const kind of ["Ability", "DC", "Attack"]) {
      const pattern = {
        Ability: /^spellCastingAbility\d+$/i,
        DC: /^spellSaveDC\d+$/i,
        Attack: /^spellAtkBonus\d+$/i,
      }[kind];
      const key = {
        Ability: "casting.ability",
        DC: "casting.dc",
        Attack: "casting.attack",
      }[kind];
      for (const w of ws.filter((w) => pattern.test(w.name))) {
        recognized.add(key);
        if (!present(w.value)) continue;
        const suffix = w.name.match(/\d+$/)[0],
          sourceClasses = val(`spellCastingClass${suffix}`);
        const parts = clean(w.value).split(/\s*\/\s*/);
        const field = fields.find((f) => f.key === key),
          values = parts.map((p) => convert(field, p));
        if (values.every((v) => v !== null && v === values[0])) {
          put(
            draft,
            key,
            values[0],
            {
              ...evidence(w),
              label: clean(
                `${w.name}${sourceClasses ? ` (${sourceClasses})` : ""}`,
                300,
              ),
            },
            0.96,
          );
        } else {
          const warning = `Different or unreadable spellcasting ${kind.toLowerCase()} values (${sourceClasses || "class not specified"}: ${clean(w.value, 200)}). No single value was selected; check the class-specific values in notes.`;
          if (!draft.warnings.includes(warning)) draft.warnings.push(warning);
        }
        castingNotes.push({
          ...w,
          value: `${sourceClasses || "Spellcasting"} — ${kind}: ${w.value}`,
        });
      }
    }
    const headers = ws.filter(
      (w) =>
        /^spellHeader\d+$/i.test(w.name) &&
        Number.isInteger(spellLevel(w.value)),
    );
    for (const h of headers) {
      const level = spellLevel(h.value),
        slot = get(`spellslotheader${h.name.match(/\d+$/)[0]}`, h);
      if (level > 0 && slot && present(slot.value)) {
        recognized.add(`slots.level${level}`);
        // Hollow printed circles do not establish remaining slots.
        const count = clean(slot.value).match(/^(\d{1,2})\s+Slots?\b/i)?.[1];
        put(
          draft,
          `slots.level${level}`,
          count ? `${count} total / remaining not recorded` : clean(slot.value),
          evidence(slot),
          0.96,
        );
      }
    }
    for (const w of ws
      .filter((w) => /^spellName\d+$/i.test(w.name) && present(w.value))
      .sort(numbered)) {
      if (spellRows(draft).length >= 250) {
        draft.warnings.push("Spell import limited to 250 entries.");
        break;
      }
      const id = w.name.match(/\d+$/)[0],
        sourceWidget = get(`spellsource${id}`, w),
        prepWidget = get(`spellprepared${id}`, w);
      const rawName = clean(w.value, 200),
        ritual = /\s*\[R\]\s*$/i.test(rawName),
        name = rawName.replace(/\s*\[R\]\s*$/i, "");
      const prefix = addSpell(draft, name, evidence(w));
      draft.facts[`${prefix}.name`].confidence = 0.96;
      const rowY = top(w);
      const header =
        rowY !== null
          ? headers
              .filter(
                (h) =>
                  top(h) !== null &&
                  top(h) > rowY &&
                  Math.abs(h.rect[0] - w.rect[0]) < 40,
              )
              .sort((a, b) => top(a) - top(b))[0]
          : headers.length === 1
            ? headers[0]
            : null;
      if (header)
        put(
          draft,
          `${prefix}.level`,
          spellLevel(header.value),
          evidence(header),
          0.96,
        );
      if (ritual) put(draft, `${prefix}.ritual`, true, evidence(w), 0.96);
      if (sourceWidget && present(sourceWidget.value)) {
        put(
          draft,
          `${prefix}.class`,
          clean(sourceWidget.value, 200),
          evidence(sourceWidget),
          0.96,
        );
        if (/\balways prepared\b/i.test(sourceWidget.value))
          put(draft, `${prefix}.granted`, true, evidence(sourceWidget), 0.96);
      }
      // A P in DDB's explicitly named preparation widget is positive evidence.
      // O/blank and arbitrary bullets remain ambiguous (especially for cantrips).
      if (
        prepWidget &&
        /^(?:P|yes|true|prepared)$/i.test(clean(prepWidget.value))
      )
        put(draft, `${prefix}.prepared`, true, evidence(prepWidget), 0.96);
    }
  }
  bundle("equipment.equipment", inventory);
  bundle("equipment.attacks", attacks);
  bundle("equipment.currency", currency);
  bundle("notes.custom", [...notes, ...castingNotes], true);
  if (draft.facts["identity.level"].value === null) {
    const classFact = draft.facts["identity.classes"],
      parts = classes(draft);
    const summary = String(classFact.value ?? "")
      .replace(
        /(Artificer|Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard)\s*\d{1,2}\b/gi,
        "",
      )
      .replace(/[\s/,+&]/g, "");
    const total = parts.reduce((n, c) => n + c.level, 0);
    if (
      parts.length &&
      !summary &&
      !classFact.alternatives.length &&
      parts.every((c) => c.level > 0) &&
      total <= 20
    ) {
      put(
        draft,
        "identity.level",
        total,
        {
          page: classFact.source.page,
          label: "Sum of recorded class levels",
          method: "calculation",
        },
        classFact.confidence,
      );
      draft.facts["identity.level"].provenance = "derived";
    }
  }
  return recognized;
}
