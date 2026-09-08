import {
  fields,
  statuses,
  blankDraft,
  addSpell,
  correct,
  spellRows,
  value,
  checks,
  makeSnapshot,
  comparison,
  clean,
} from "./model.mjs";
import { parsePages } from "./parser.mjs";
import { extractPDF } from "./pdf.mjs";
import {
  listCharacters,
  getSnapshot,
  history,
  saveSnapshot,
} from "./storage.mjs";
import { el, list, display, changesView } from "./dom.mjs";
const $ = (id) => document.getElementById(id);
const catalog = JSON.parse($("character-catalog").textContent);
let draft = blankDraft(),
  observations = structuredClone(draft.facts),
  original = null,
  previous = null,
  controller = null,
  busy = false,
  dirty = false,
  saving = false;
const stages = ["upload-step", "review-step", "confirm-step"];
function stage(n) {
  for (const [i, id] of stages.entries()) $(id).hidden = i !== n;
  document.querySelectorAll(".import-steps li").forEach((li, i) => {
    if (i === n) li.setAttribute("aria-current", "step");
    else li.removeAttribute("aria-current");
  });
  $(stages[n]).querySelector("h2").focus();
  $("import-error").hidden = true;
}
function error(message) {
  $("import-error").textContent = message;
  $("import-error").hidden = false;
}
function loading(on) {
  busy = on;
  $("character-pdf").disabled = on;
  $("manual-entry").disabled = on;
  $("import-character").disabled = on;
  $("cancel-import").hidden = !on;
  $("upload-step").setAttribute("aria-busy", String(on));
}
function sourceHint(f) {
  const confidence =
    f.value === null
      ? "Not found"
      : f.confidence >= 0.85
        ? "High confidence"
        : "Needs confirmation";
  return `${confidence} · ${f.provenance === "user_reported" ? "Player correction" : f.source.method} · ${f.source.page ? `page ${f.source.page}, ` : ""}${f.source.label}${f.alternatives.length ? " · Conflicting readings: " + f.alternatives.map((a) => `${display(a.value)} (page ${a.page ?? "?"})`).join("; ") : ""}`;
}
function fieldControl(def) {
  const fact = draft.facts[def.key];
  const wrapper = el("div", "", {
    class: `lab-field ${fact.value === null ? "is-unknown" : fact.confidence < 0.85 || fact.alternatives.length ? "needs-review" : ""}`,
  });
  const id = `field-${def.key}`;
  const label = el("label", def.label, { for: id });
  let input;
  if (def.type === "boolean" || def.type === "ruleset") {
    input = el("select", "", { id, class: "field" });
    const choices =
      def.type === "boolean"
        ? [
            [null, "Not confirmed"],
            [true, "Yes"],
            [false, "No"],
          ]
        : [
            [null, "Unknown / decide later"],
            ["2014", "2014"],
            ["2024", "2024"],
            ["mixed", "Mixed / legacy"],
          ];
    for (const [v, l] of choices)
      input.append(el("option", l, { value: v === null ? "" : String(v) }));
    input.value = fact.value === null ? "" : String(fact.value);
  } else {
    input = el(def.type === "long" ? "textarea" : "input", "", {
      id,
      class: "field",
      ...(def.type === "long"
        ? { rows: 3 }
        : { type: def.type === "number" ? "number" : "text" }),
      maxlength: def.key === "identity.name" ? 200 : 12000,
    });
    input.value = fact.value ?? "";
    if (def.key === "identity.name") input.required = true;
  }
  const hint = el("small", sourceHint(fact), { id: `hint-${def.key}` });
  input.setAttribute("aria-describedby", hint.id);
  const change = () => {
    let next = input.value.trim();
    next =
      next === ""
        ? null
        : def.type === "number"
          ? Number(next)
          : def.type === "boolean"
            ? next === "true"
            : next;
    correct(draft, def.key, next);
    dirty = true;
    hint.textContent = sourceHint(draft.facts[def.key]);
  };
  input.addEventListener("input", change);
  input.addEventListener("change", change);
  wrapper.append(label, input, hint);
  return wrapper;
}
function renderReview() {
  const groups = $("review-fields");
  groups.replaceChildren();
  for (const group of new Set(fields.map((f) => f.group))) {
    const section = el("details", "", { class: "lab-details", open: "" });
    section.append(el("summary", group));
    const grid = el("div", "", { class: "lab-field-grid" });
    for (const def of fields.filter((f) => f.group === group))
      grid.append(fieldControl(def));
    section.append(grid);
    groups.append(section);
  }
  renderSpells();
  $("extraction-warnings").replaceChildren(
    list([...draft.warnings, ...checks(draft)]),
  );
}
function renderSpells() {
  const target = $("spell-review");
  target.replaceChildren();
  for (const [i, spell] of spellRows(draft).entries()) {
    const card = el("fieldset", "", { class: "lab-spell" });
    card.append(el("legend", `Spell ${i + 1}: ${spell.name || "New entry"}`));
    const grid = el("div", "", { class: "lab-field-grid" });
    for (const [suffix, label, type] of [
      ["name", "Spell name", "text"],
      ["level", "Spell level (0 = cantrip)", "number"],
      ["class", "Granted by / class source", "text"],
      ["ritual", "Ritual explicitly shown", "boolean"],
      ...Object.entries(statuses).map(([k, v]) => [k, v, "boolean"]),
    ])
      grid.append(fieldControl({ key: `${spell.key}.${suffix}`, label, type }));
    card.append(grid);
    target.append(card);
  }
  if (!spellRows(draft).length)
    target.append(
      el(
        "p",
        "No spells found. Add entries below; no spellbook or preparation has been assumed.",
      ),
    );
}
async function targetCharacter() {
  const id = $("import-character").value;
  const characters = await listCharacters();
  const found = characters.find((c) => c.id === id);
  previous = found ? await getSnapshot(found.latest) : null;
}
async function load(file) {
  if (busy) return;
  try {
    await targetCharacter();
    loading(true);
    controller = new AbortController();
    $("import-error").hidden = true;
    const result = await extractPDF(file, {
      signal: controller.signal,
      onProgress: (t) => ($("import-status").textContent = t),
    });
    draft = parsePages(result.pages, catalog);
    draft.source = result.source;
    observations = structuredClone(draft.facts);
    original = file;
    dirty = true;
    $("extracted-pages").replaceChildren();
    for (const p of result.pages) {
      const section = el("section");
      section.append(
        el("h3", `Page ${p.page} · ${p.method}`),
        el("pre", clean(p.lines.map((l) => l.text).join("\n"), 200000)),
      );
      if (p.widgets.some((w) => clean(w.value)))
        section.append(
          el("h4", "Recorded form fields"),
          el(
            "pre",
            clean(
              p.widgets
                .filter((w) => clean(w.value))
                .map((w) => `${w.name}: ${w.value}`)
                .join("\n\n"),
              200000,
            ),
          ),
        );
      $("extracted-pages").append(section);
    }
    renderReview();
    stage(1);
    $("import-status").textContent =
      `${result.pages.length} pages read. Review before saving.`;
  } catch (e) {
    error(e.message || "Could not read the PDF. Use manual entry to continue.");
    $("import-status").textContent = "No snapshot was saved.";
  } finally {
    loading(false);
    controller = null;
  }
}
$("character-pdf").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) load(file);
  e.target.value = "";
});
for (const type of ["dragenter", "dragover"])
  $("import-drop").addEventListener(type, (e) => {
    e.preventDefault();
    $("import-drop").classList.add("is-dragging");
  });
for (const type of ["dragleave", "drop"])
  $("import-drop").addEventListener(type, (e) => {
    e.preventDefault();
    $("import-drop").classList.remove("is-dragging");
    if (type === "drop" && !busy) {
      if (e.dataTransfer.files.length !== 1)
        error("Choose one character PDF at a time.");
      else load(e.dataTransfer.files[0]);
    }
  });
$("cancel-import").addEventListener("click", () => controller?.abort());
$("manual-entry").addEventListener("click", async () => {
  try {
    await targetCharacter();
    original = null;
    draft = blankDraft();
    observations = structuredClone(draft.facts);
    $("extracted-pages").replaceChildren();
    renderReview();
    dirty = true;
    stage(1);
    $("import-status").textContent =
      "Manual entry: optional fields can stay unknown.";
  } catch (e) {
    error(e.message);
  }
});
$("back-upload").addEventListener("click", () => stage(0));
$("add-spell").addEventListener("click", () => {
  try {
    addSpell(draft);
    renderSpells();
    $("spell-review").lastElementChild.querySelector("input").focus();
  } catch (e) {
    error(e.message);
  }
});
$("back-review").addEventListener("click", () => stage(1));
$("review-step").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!value(draft, "identity.name")) {
    error("Enter a character name.");
    return;
  }
  for (const s of spellRows(draft))
    if (!s.name)
      for (const key of Object.keys(draft.facts))
        if (key.startsWith(s.key + ".")) delete draft.facts[key];
  $("final-warnings").replaceChildren(list(checks(draft)));
  $("snapshot-diff").replaceChildren(
    el("h3", previous ? "Changes since the latest snapshot" : "First snapshot"),
    changesView(comparison(previous, draft)),
    el(
      "p",
      `${Object.values(draft.facts).filter((f) => f.value === null).length} fields remain explicitly unknown. Fields left unknown in a newer PDF are not copied from the previous snapshot.`,
    ),
  );
  $("retain-pdf").disabled = !original;
  $("retain-pdf").checked = false;
  $("confirm-readings").checked = false;
  $("allow-duplicate").checked = false;
  try {
    const duplicate =
      previous &&
      draft.source.sha256 &&
      (await history(previous.character_id)).some(
        (s) => s.source.sha256 === draft.source.sha256,
      );
    $("duplicate-choice").hidden = !duplicate;
    stage(2);
  } catch (e) {
    error(e.message);
  }
});
$("save-character").addEventListener("click", async () => {
  if (saving) return;
  if (!$("confirm-readings").checked) {
    error("Confirm that you reviewed the populated fields before saving.");
    return;
  }
  if (!$("duplicate-choice").hidden && !$("allow-duplicate").checked) {
    error(
      "This PDF was already imported. Check the corrected-revision box to save it intentionally.",
    );
    return;
  }
  saving = true;
  $("save-character").disabled = true;
  try {
    const reviewed = structuredClone(draft);
    for (const fact of Object.values(reviewed.facts))
      if (fact.value !== null) fact.verification = "user_confirmed";
    const retain = Boolean(original && $("retain-pdf").checked);
    const snapshot = makeSnapshot(
      reviewed,
      observations,
      previous,
      null,
      retain,
    );
    await saveSnapshot(snapshot, retain ? original : null, {
      allowDuplicate: $("allow-duplicate").checked,
    });
    dirty = false;
    original = null;
    $("extracted-pages").replaceChildren();
    window.location.assign("/play/?imported=1#my-character");
  } catch (e) {
    error(e.message);
  } finally {
    saving = false;
    $("save-character").disabled = false;
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) e.preventDefault();
});
window.addEventListener("pagehide", () => {
  controller?.abort();
  original = null;
});
try {
  for (const c of await listCharacters())
    $("import-character").append(
      el("option", `${c.name} · snapshot ${c.revision}`, { value: c.id }),
    );
  const id = new URLSearchParams(location.search).get("character");
  if (id) $("import-character").value = id;
} catch (e) {
  error(e.message);
}
