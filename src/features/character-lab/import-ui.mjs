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
  saving = false,
  reviewVersion = 0;
const stages = ["upload-step", "review-step", "confirm-step"];
const resumeReview = el("button", "Return to unsaved review", {
  type: "button",
  class: "button",
  hidden: "",
});
$("manual-entry").parentElement.append(resumeReview);
resumeReview.addEventListener("click", () => stage(1));
function stage(n) {
  if (saving) return;
  reviewVersion++;
  for (const [i, id] of stages.entries()) $(id).hidden = i !== n;
  document.querySelectorAll(".import-steps li").forEach((li, i) => {
    if (i === n) li.setAttribute("aria-current", "step");
    else li.removeAttribute("aria-current");
  });
  $(stages[n]).querySelector("h2").focus();
  $("import-error").hidden = true;
  resumeReview.hidden = !dirty;
}
function error(message) {
  $("import-error").textContent = message;
  $("import-error").hidden = false;
  $("import-error").focus();
}
function loading(on) {
  busy = on;
  $("character-pdf").disabled = on;
  $("manual-entry").disabled = on;
  $("import-character").disabled = on;
  $("cancel-import").hidden = !on;
  $("upload-step").setAttribute("aria-busy", String(on));
  $("extraction-progress").hidden = !on;
  resumeReview.disabled = on;
  resumeReview.hidden = !dirty;
}
function sourceHint(f) {
  const confidence =
    f.verification === "user_confirmed"
      ? "Player confirmed"
      : f.alternatives.length
        ? "Conflicting readings — needs confirmation"
        : f.value === null
          ? "Not found"
          : f.confidence >= 0.85 && f.provenance !== "derived"
            ? "High confidence — not yet confirmed"
            : "Needs confirmation";
  return `${confidence} · ${f.provenance === "user_reported" ? "Player correction" : f.source.method} · ${f.source.page ? `page ${f.source.page}, ` : ""}${f.source.label}${f.alternatives.length ? " · Original alternatives: " + f.alternatives.map((a) => `${display(a.value)} (page ${a.page ?? "?"})`).join("; ") : ""}`;
}
function refreshField(key) {
  const fact = draft.facts[key];
  const input = $(`field-${key}`);
  if (!fact || !input) return;
  const wrapper = input.closest(".lab-field");
  const missingRequired = key === "identity.name" && !fact.value;
  wrapper.classList.toggle("is-unknown", fact.value === null);
  wrapper.classList.toggle("is-required-missing", missingRequired);
  wrapper.classList.toggle(
    "needs-review",
    fact.verification !== "user_confirmed" &&
      (fact.alternatives.length > 0 ||
        (fact.value !== null &&
          (fact.confidence < 0.85 || fact.provenance === "derived"))),
  );
  input.setAttribute("aria-invalid", String(missingRequired));
  $(`hint-${key}`).textContent =
    `${missingRequired ? "Required before saving · " : ""}${sourceHint(fact)}`;
  const confirm = $(`confirm-${key}`);
  if (confirm) {
    confirm.disabled = fact.value === null;
    confirm.checked =
      fact.value !== null && fact.verification === "user_confirmed";
  }
}
function refreshReviewSummary() {
  reviewVersion++;
  const facts = Object.values(draft.facts);
  const missing = facts.filter((f) => f.value === null).length;
  const unconfirmed = facts.filter(
    (f) => f.value !== null && f.verification !== "user_confirmed",
  ).length;
  const conflicting = facts.filter(
    (f) => f.alternatives.length && f.verification !== "user_confirmed",
  ).length;
  $("review-summary").textContent =
    `${facts.length - missing} recorded fields · ${missing} unknown · ${unconfirmed} awaiting confirmation · ${conflicting} unresolved conflicts. Only the character name is required.`;
  $("extraction-warnings").replaceChildren(
    list([...new Set([...draft.warnings, ...checks(draft)])]),
  );
}
function fieldControl(def) {
  const fact = draft.facts[def.key];
  const wrapper = el("div", "", {
    class: `lab-field ${fact.value === null ? "is-unknown" : ""} ${fact.verification !== "user_confirmed" && (fact.alternatives.length || (fact.value !== null && (fact.confidence < 0.85 || fact.provenance === "derived"))) ? "needs-review" : ""}`,
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
    refreshField(def.key);
    if (def.key === "identity.classes") {
      const total = draft.facts["identity.level"];
      $("field-identity.level").value = total.value ?? "";
      refreshField("identity.level");
    }
    if (def.key.startsWith("spells.") && def.key.endsWith(".name")) {
      const card = input.closest("fieldset");
      const index = [...$("spell-review").children].indexOf(card) + 1;
      const name = draft.facts[def.key].value || "Unnamed entry";
      card.querySelector("legend").textContent = `Spell ${index}: ${name}`;
      card
        .querySelector("button")
        .setAttribute("aria-label", `Exclude spell ${index}: ${name}`);
    }
    refreshReviewSummary();
  };
  input.addEventListener("input", change);
  input.addEventListener("change", change);
  wrapper.append(label, input, hint);
  const confirm = el("input", "", {
    type: "checkbox",
    id: `confirm-${def.key}`,
  });
  confirm.disabled = fact.value === null;
  confirm.checked =
    fact.value !== null && fact.verification === "user_confirmed";
  const confirmLabel = el("label", "", {
    for: confirm.id,
    class: "lab-check lab-field-confirm",
  });
  confirmLabel.append(confirm, el("span", `Confirm ${def.label}`));
  confirm.addEventListener("change", () => {
    const current = draft.facts[def.key];
    current.verification =
      current.value === null
        ? "unknown"
        : confirm.checked
          ? "user_confirmed"
          : "needs_confirmation";
    dirty = true;
    refreshField(def.key);
    refreshReviewSummary();
  });
  wrapper.append(confirmLabel);
  if (def.key === "identity.name" && !fact.value) {
    wrapper.classList.add("is-required-missing");
    input.setAttribute("aria-invalid", "true");
    hint.textContent = `Required before saving · ${sourceHint(fact)}`;
  }
  return wrapper;
}
function renderReview() {
  const groups = $("review-fields");
  groups.replaceChildren();
  const navigation = $("review-navigation");
  navigation.replaceChildren();
  $("review-source").textContent = draft.source.filename
    ? `${draft.source.filename} · ${draft.source.page_count} pages · Local extraction`
    : "Manual character entry · Nothing is saved until confirmation";
  function jumpLink(label, section, focusTarget) {
    const link = el("a", label, { href: `#${section.id}` });
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (section.tagName === "DETAILS") section.open = true;
      focusTarget.focus();
      section.scrollIntoView({ block: "start" });
    });
    navigation.append(link);
  }
  for (const group of new Set(fields.map((f) => f.group))) {
    const section = el("details", "", {
      class: "lab-details",
      open: "",
      id: `review-${group.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    });
    const summary = el("summary", group);
    section.append(summary);
    jumpLink(group, section, summary);
    const grid = el("div", "", { class: "lab-field-grid" });
    for (const def of fields.filter((f) => f.group === group))
      grid.append(fieldControl(def));
    section.append(grid);
    groups.append(section);
  }
  renderSpells();
  jumpLink(
    "Wizard spell reconciliation",
    $("wizard-reconciliation"),
    $("wizard-reconciliation").querySelector("h3"),
  );
  refreshReviewSummary();
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
    const exclude = el("button", "Exclude this spell entry", {
      type: "button",
      class: "button",
      "aria-label": `Exclude spell ${i + 1}: ${spell.name || "New entry"}`,
    });
    exclude.addEventListener("click", () => {
      for (const key of Object.keys(draft.facts))
        if (key.startsWith(`${spell.key}.`)) delete draft.facts[key];
      dirty = true;
      renderSpells();
      refreshReviewSummary();
      const next =
        $("spell-review").children[i] ?? $("spell-review").lastElementChild;
      (next?.querySelector("input") ?? $("add-spell")).focus();
    });
    card.append(exclude);
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
  if (id && !found)
    throw Error(
      "This character is no longer available. Choose a different character or explicitly select a new character.",
    );
  const snapshot = found ? await getSnapshot(found.latest) : null;
  if (found && !snapshot)
    throw Error(
      "The latest snapshot is unavailable. Nothing was replaced; export or review your existing character before continuing.",
    );
  return snapshot;
}
function replaceReview() {
  return (
    !dirty ||
    window.confirm(
      "Replace your unsaved character review? Changes on this page will be discarded. Saved snapshots are not affected.",
    )
  );
}
async function load(file) {
  if (busy || !replaceReview()) return;
  loading(true);
  controller = new AbortController();
  try {
    const target = await targetCharacter();
    $("import-error").hidden = true;
    const result = await extractPDF(file, {
      signal: controller.signal,
      onProgress: (t) => ($("import-status").textContent = t),
    });
    draft = parsePages(result.pages, catalog);
    draft.source = result.source;
    observations = structuredClone(draft.facts);
    original = file;
    previous = target;
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
function chooseFiles(files) {
  if (busy || !files?.length) return;
  if (files.length !== 1) error("Choose one character PDF at a time.");
  else load(files[0]);
}
$("character-pdf").addEventListener("change", (e) => {
  chooseFiles(e.target.files);
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
      chooseFiles(e.dataTransfer.files);
    }
  });
$("cancel-import").addEventListener("click", () => controller?.abort());
$("manual-entry").addEventListener("click", async () => {
  if (busy || !replaceReview()) return;
  loading(true);
  try {
    previous = await targetCharacter();
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
  } finally {
    loading(false);
  }
});
$("back-upload").addEventListener("click", () => stage(0));
$("add-spell").addEventListener("click", () => {
  try {
    addSpell(draft);
    dirty = true;
    renderSpells();
    refreshReviewSummary();
    $("spell-review").lastElementChild.querySelector("input").focus();
  } catch (e) {
    error(e.message);
  }
});
$("back-review").addEventListener("click", () => stage(1));
$("confirm-high-confidence").addEventListener("click", () => {
  let count = 0;
  for (const [key, fact] of Object.entries(draft.facts)) {
    if (
      fact.value !== null &&
      fact.verification !== "user_confirmed" &&
      fact.provenance === "sheet_observed" &&
      fact.confidence >= 0.85 &&
      fact.source.method !== "ocr" &&
      !fact.alternatives.length
    ) {
      fact.verification = "user_confirmed";
      refreshField(key);
      count++;
    }
  }
  dirty = true;
  refreshReviewSummary();
  $("import-status").textContent =
    `${count} high-confidence readings confirmed. Uncertain, conflicting and calculated readings still need individual review.`;
});
$("review-step").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!value(draft, "identity.name")) {
    error("Enter a character name.");
    const name = $("field-identity.name");
    name.closest("details").open = true;
    name.focus();
    return;
  }
  const submittedVersion = reviewVersion;
  $("final-warnings").replaceChildren(list(checks(draft)));
  $("snapshot-diff").replaceChildren(
    el("h3", previous ? "Changes since the latest snapshot" : "First snapshot"),
    changesView(comparison(previous, draft)),
    el(
      "p",
      `${Object.values(draft.facts).filter((f) => f.value === null).length} fields remain explicitly unknown; ${Object.values(draft.facts).filter((f) => f.value !== null && f.verification !== "user_confirmed").length} populated readings still await confirmation. Fields left unknown in a newer PDF are not copied from the previous snapshot.`,
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
    // Navigation or another correction invalidates this pending comparison.
    if (submittedVersion !== reviewVersion) return;
    $("duplicate-choice").hidden = !duplicate;
    stage(2);
  } catch (e) {
    if (submittedVersion === reviewVersion) error(e.message);
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
  const saveControls = [
    "save-character",
    "back-review",
    "confirm-readings",
    "retain-pdf",
    "allow-duplicate",
  ];
  for (const id of saveControls) $(id).disabled = true;
  $("confirm-step").setAttribute("aria-busy", "true");
  $("import-status").textContent =
    "Saving your reviewed snapshot in this browser…";
  try {
    const reviewed = structuredClone(draft);
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
    $("import-status").textContent =
      "Could not save. Your review remains available; earlier snapshots were not replaced.";
  } finally {
    saving = false;
    for (const id of saveControls) $(id).disabled = false;
    $("retain-pdf").disabled = !original;
    $("confirm-step").setAttribute("aria-busy", "false");
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
  if (id) {
    if (
      [...$("import-character").options].some((option) => option.value === id)
    )
      $("import-character").value = id;
    else
      error(
        "That character is not saved in this browser. Choose a saved character or import as a new character. Localhost and the live website keep separate local data.",
      );
  }
} catch (e) {
  error(e.message);
}
