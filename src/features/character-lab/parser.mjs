import {
  fields,
  blankDraft,
  clean,
  norm,
  unknown,
  addSpell,
  spellRows,
  refreshDerivedLevel,
} from "./model.mjs";
import { parseDDBForms } from "./ddb-forms.mjs";
const labels = new Map(
  fields.flatMap((f) => f.aliases.map((a) => [norm(a), f])),
);
function put(draft, key, val, source, confidence = 0.9) {
  if (val === null || val === "") return;
  const old = draft.facts[key] ?? unknown();
  if (old.value === null && old.alternatives.length) {
    if (!old.alternatives.some((a) => a.value === val))
      old.alternatives.push({
        value: val,
        page: source.page,
        label: source.label,
      });
    return;
  }
  if (old.value !== null) {
    if (old.value !== val) {
      old.alternatives = [
        { value: old.value, page: old.source.page, label: old.source.label },
        ...old.alternatives,
        { value: val, page: source.page, label: source.label },
      ];
      old.value = null;
      old.confidence = Math.min(old.confidence, 0.4);
      old.verification = "needs_confirmation";
    }
    return;
  }
  draft.facts[key] = {
    value: val,
    source,
    confidence:
      source.method === "ocr" ? Math.min(0.55, confidence) : confidence,
    provenance: "sheet_observed",
    verification: "needs_confirmation",
    alternatives: [],
  };
}
const convert = (f, s) => {
  s = clean(s);
  if (/^(?:--+|—|n\/a)$/i.test(s)) return null;
  if (f.type === "number") {
    const m = s.match(/^[+−-]?\d{1,4}$/);
    return m ? Number(s.replace("−", "-")) : null;
  }
  if (f.type === "boolean")
    return /^(yes|true)$/i.test(s)
      ? true
      : /^(no|false)$/i.test(s)
        ? false
        : null;
  if (f.type === "ruleset")
    return /^(2014|2024|mixed)$/i.test(s) ? s.toLowerCase() : null;
  if (
    f.key === "defenses.hit_dice" &&
    !/^\d{1,2}d\d{1,2}(?:\s*\+\s*\d{1,2}d\d{1,2})*$/i.test(s)
  )
    return null;
  return s || null;
};
const templateText = (s) =>
  /(?:©|all rights reserved|permission is granted to|wizards of the coast|D&D Beyond\s*\|)/i.test(
    s,
  ) ||
  /^(?:(?:NAME|QTY|WEIGHT|CP|SP|EP|GP|PP|TOTAL|CURRENT|TEMP|MAX|HIT|DAMAGE\/TYPE|NOTES|ACTIONS|SPELLS|PREP|SOURCE|PAGE REF|WEIGHT CARRIED|ENCUMBERED|ATTUNED MAGIC ITEMS|PUSH\/DRAG\/LIFT|SUCCESSES|FAILURES)\s*)+$/i.test(
    s,
  );
export function parsePages(pages, catalog = []) {
  const draft = blankDraft();
  const orderedCatalog = [...catalog].sort(
    (a, b) => b.name.length - a.name.length,
  );
  draft.source.type = "ddb_pdf";
  draft.source.page_count = pages.length;
  draft.source.methods = [
    ...new Set(
      pages.flatMap((p) => [
        p.method,
        ...p.lines
          .map((line) => (typeof line === "object" ? line.method : null))
          .filter(Boolean),
        ...(p.widgets?.length ? ["acroform"] : []),
      ]),
    ),
  ];
  // Forms are read across all pages before lower-confidence text fallback.
  const formKeys = parseDDBForms(pages, draft, put, convert);
  for (const page of pages) {
    draft.warnings.push(...(page.warnings ?? []));
    const lines = page.lines
      .map((l) =>
        typeof l === "string"
          ? { text: clean(l) }
          : { ...l, text: clean(l.text) },
      )
      .filter((l) => l.text);
    const ddbFormPage = (page.widgets ?? []).some((w) =>
      /^(?:CLASS\s+LEVEL|FeaturesTraits\d+|spellName\d+)$/i.test(w.name),
    );
    const formSpellPage = (page.widgets ?? []).some(
      (w) => /^spellName\d+$/i.test(w.name) && clean(w.value),
    );
    const spellPage = lines.some((l) =>
      /spellcasting|spell name|prepared spells|spellbook|cantrips/i.test(
        l.text,
      ),
    );
    const spellHeaders = lines.filter((l) => /^spell name$/i.test(l.text));
    for (const w of page.widgets ?? []) {
      if (
        /^spells?[\s_]*\d+$/i.test(w.name) &&
        clean(w.value) &&
        spellRows(draft).length < 250
      )
        addSpell(draft, w.value, {
          page: page.page,
          label: clean(w.name, 300),
          method: "acroform",
        });
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i],
        s = line.text,
        source = {
          page: page.page,
          label: s.slice(0, 300),
          method: line.method ?? page.method,
        };
      // Explicit labels are safest. Ordinary headings are never read as values.
      const pair = s.match(/^([^:]{2,70})\s*:\s*(.*)$/);
      const field = labels.get(norm(pair ? pair[1] : s));
      if (field && (pair?.[2] || (!formKeys.has(field.key) && !ddbFormPage))) {
        let raw = pair?.[2] || "";
        if (!raw && line.x !== undefined && field.type !== "long") {
          const candidates = lines
            .filter(
              (l) =>
                l !== line &&
                !labels.has(norm(l.text)) &&
                !templateText(l.text) &&
                convert(field, l.text) !== null &&
                l.x !== undefined &&
                Math.abs(l.x - line.x) < 55 &&
                l.y > line.y &&
                l.y - line.y < 32,
            )
            .sort((a, b) => a.y - b.y);
          raw = candidates[0]?.text ?? "";
        }
        if (
          !raw &&
          line.x === undefined &&
          i > 0 &&
          (lines[i - 1].method ?? page.method) === source.method &&
          !labels.has(norm(lines[i - 1].text)) &&
          !templateText(lines[i - 1].text) &&
          field.type !== "long"
        )
          raw = lines[i - 1].text;
        if (raw)
          put(
            draft,
            field.key,
            convert(field, raw),
            source,
            pair?.[2]?.length ? 0.92 : 0.62,
          );
        if (field.type === "long" && !raw && line.x === undefined) {
          const block = [];
          for (let j = i + 1; j < Math.min(lines.length, i + 28); j++) {
            if (
              labels.has(norm(lines[j].text)) ||
              templateText(lines[j].text) ||
              labels.has(norm(lines[j].text.split(":")[0]))
            )
              break;
            block.push(lines[j].text);
          }
          if (block.length)
            put(draft, field.key, block.join("\n"), source, 0.6);
        }
      }
      // Retain unknown/custom spell rows rather than matching only our catalogue.
      const explicit = s.match(/^(?:Spell|Cantrip)\s*:\s*(.+)$/i);
      const stripped = s.replace(/^[*○●✓\s]+/, "");
      const match =
        !explicit && spellPage && !formSpellPage
          ? orderedCatalog.find(
              (c) =>
                norm(stripped) === norm(c.name) ||
                stripped.toLowerCase().startsWith(c.name.toLowerCase() + " "),
            )
          : null;
      // Column-aligned names absent from the catalogue (including homebrew) remain reviewable.
      const header = spellHeaders.find(
        (l) =>
          /^spell name$/i.test(l.text) &&
          l.x !== undefined &&
          line.x !== undefined &&
          Math.abs(l.x - line.x) < 30 &&
          line.y < l.y,
      );
      const tableName =
        !explicit &&
        !formSpellPage &&
        !match &&
        header &&
        /^[A-Z][A-Za-z'’ -]{2,70}$/.test(s) &&
        !labels.has(norm(s)) &&
        !/^(?:cantrips|spells|prepared|spellcasting|total slots|slots remaining)$/i.test(
          s,
        )
          ? s
          : null;
      if (explicit || match || tableName) {
        const parts = (explicit?.[1] ?? match?.name ?? tableName)
          .split("|")
          .map((p) => p.trim());
        const name = parts[0].replace(/^[*○●✓\s]+/, "");
        if (!name || name.length > 200) continue;
        if (spellRows(draft).length >= 250) {
          if (!draft.warnings.includes("Spell import limited to 250 entries."))
            draft.warnings.push("Spell import limited to 250 entries.");
          continue;
        }
        if (
          !explicit &&
          spellRows(draft).some((r) => norm(r.name) === norm(name))
        )
          continue;
        const prefix = addSpell(draft, name, source);
        const attrs = Object.fromEntries(
          parts.slice(1).map((p) => p.split("=").map((x) => x.trim())),
        );
        for (const key of [
          "level",
          "class",
          "ritual",
          "book",
          "prepared",
          "granted",
          "other",
          "scroll",
        ]) {
          const raw = attrs[key];
          let val =
            raw === undefined
              ? null
              : key === "level"
                ? /^\d$/.test(raw)
                  ? Number(raw)
                  : null
                : key === "class"
                  ? raw
                  : /^(yes|true)$/i.test(raw)
                    ? true
                    : /^(no|false)$/i.test(raw)
                      ? false
                      : null;
          if (key === "level" && /^Cantrip:/i.test(s)) val = 0;
          if (val !== null) put(draft, `${prefix}.${key}`, val, source, 0.85);
        }
        // An unlabelled checkbox/bullet is ambiguous; never converts to prepared.
      }
      if (
        field?.key !== "rules.homebrew" &&
        /homebrew|custom (?:spell|feat|feature)/i.test(s) &&
        !/\b(?:no|without|not|none)\b[^.!?\n]{0,30}\b(?:homebrew|custom (?:spell|feat|feature))\b|\bhomebrew\b\s*(?:(?:present|allowed)\s*)?[:=-]?\s*(?:no|false|none)\b/i.test(
          s,
        )
      )
        put(draft, "rules.homebrew", true, source, 0.65);
    }
  }
  refreshDerivedLevel(draft);
  if (Object.values(draft.facts).filter((f) => f.value !== null).length < 3)
    draft.warnings.push(
      "Unsupported or partial layout: few fields were recognized. Review the page text below or continue with manual entry.",
    );
  return draft;
}

// Preserve reading coordinates. Rows separated by a wide gutter stay independent.
export function textLines(items) {
  const rows = [];
  for (const item of items) {
    if (
      !item ||
      typeof item.str !== "string" ||
      !clean(item.str) ||
      !Array.isArray(item.transform) ||
      item.transform.length < 6 ||
      !Number.isFinite(item.transform[4]) ||
      !Number.isFinite(item.transform[5])
    )
      continue;
    const x = item.transform[4],
      y = item.transform[5];
    let row = rows.find((r) => Math.abs(r.y - y) < 3);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push({
      text: clean(item.str),
      x,
      width: Number.isFinite(item.width) ? item.width : 0,
    });
  }
  const lines = [];
  for (const row of rows.sort((a, b) => b.y - a.y)) {
    let current = null;
    for (const i of row.items.sort((a, b) => a.x - b.x)) {
      if (!current || i.x - current.end > 28) {
        current = { text: i.text, x: i.x, y: row.y, end: i.x + i.width };
        lines.push(current);
      } else {
        current.text += " " + i.text;
        current.end = i.x + i.width;
      }
    }
  }
  return lines;
}
