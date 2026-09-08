import {
  activeSnapshot,
  listCharacters,
  getSnapshot,
  history,
  selectSnapshot,
  getDocument,
  forgetCharacter,
} from "./storage.mjs";
import { personalize } from "./personalize.mjs";
import { fields, value, comparison, filename } from "./model.mjs";
import { el, list, display, changesView, download } from "./dom.mjs";
const $ = (id) => document.getElementById(id);
const catalog = JSON.parse($("character-catalog").textContent);
function links(entries, empty) {
  const ul = el("ul");
  if (!entries.length) ul.append(el("li", empty));
  for (const item of entries) {
    const entry = item.entry ?? item;
    const li = el("li");
    li.append(
      el("a", entry.name, { href: entry.href }),
      document.createTextNode(` — ${entry.summary}`),
    );
    ul.append(li);
  }
  return ul;
}
function panel(title, body, entries, href) {
  const section = el("section", "", { class: "lab-play-card" });
  section.append(el("h3", title), el("p", body));
  if (entries)
    section.append(
      links(
        entries,
        "No confirmed matching option. Check the full reference; availability has not been assumed.",
      ),
    );
  if (href) section.append(el("a", "Open full guidance →", { href }));
  return section;
}
async function render() {
  const snapshot = await activeSnapshot();
  const target = $("character-content");
  target.replaceChildren();
  target.hidden = !snapshot;
  if (!snapshot) return;
  $("my-character-title").textContent = snapshot.name;
  $("character-status").textContent =
    `${new URLSearchParams(location.search).has("imported") ? "Snapshot saved. " : ""}Snapshot ${snapshot.revision} · ${new Date(snapshot.recorded_at).toLocaleString()} · local to this browser. Recommendations below are not saved character facts.`;
  const control = el("div", "", { class: "form-actions" });
  const character = el("select", "", {
    id: "active-character",
    class: "field",
    "aria-label": "Active character",
  });
  for (const c of await listCharacters())
    character.append(el("option", c.name, { value: c.latest }));
  const currentChar = (await listCharacters()).find(
    (c) => c.id === snapshot.character_id,
  );
  character.value = currentChar?.latest ?? "";
  character.addEventListener("change", async () => {
    try {
      await selectSnapshot(character.value);
      await render();
    } catch (e) {
      $("character-status").textContent = e.message;
    }
  });
  const versions = await history(snapshot.character_id);
  const select = el("select", "", {
    id: "snapshot-history",
    class: "field",
    "aria-label": "Snapshot history",
  });
  for (const s of versions)
    select.append(
      el(
        "option",
        `Snapshot ${s.revision} · ${new Date(s.recorded_at).toLocaleString()}`,
        { value: s.id },
      ),
    );
  select.value = snapshot.id;
  select.addEventListener("change", async () => {
    try {
      await selectSnapshot(select.value);
      await render();
    } catch (e) {
      $("character-status").textContent = e.message;
    }
  });
  const exportButton = el("button", "Export snapshot JSON", {
    type: "button",
    class: "button",
  });
  exportButton.addEventListener("click", () =>
    download(
      new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      }),
      `${filename(snapshot.name)}-snapshot-${snapshot.revision}.json`,
    ),
  );
  control.append(
    character,
    select,
    el("a", "Import a newer sheet", {
      href: `/play/import/?character=${snapshot.character_id}`,
      class: "button",
    }),
    exportButton,
  );
  target.append(control);
  const overview = el("dl", "", { class: "lab-overview" });
  for (const [key, label] of [
    ["identity.classes", "Class levels"],
    ["identity.level", "Level"],
    ["defenses.ac", "AC"],
    ["defenses.hp_current", "Current HP"],
    ["defenses.hp_max", "Maximum HP"],
    ["casting.dc", "Spell save DC"],
    ["rules.generation", "Rules"],
  ]) {
    const item = el("div");
    item.append(el("dt", label), el("dd", display(value(snapshot, key))));
    overview.append(item);
  }
  target.append(overview);
  const advice = personalize(snapshot, catalog);
  const warning = el("details", "", { class: "lab-details" });
  warning.append(
    el("summary", `${advice.warnings.length} scope checks and unknowns`),
    list(advice.warnings),
  );
  target.append(warning);
  const spells = el("section");
  spells.append(
    el("h3", "Confirmed preparation & other current access"),
    el(
      "p",
      "Access flags are player-confirmed. Slots, components, current concentration and encounter conditions still need checking.",
    ),
  );
  const spellList = el("ul");
  for (const s of advice.current) {
    const li = el("li");
    li.append(
      s.entry
        ? el("a", s.sheet.name, { href: s.entry.href })
        : el("span", s.sheet.name),
      document.createTextNode(
        ` · ${s.sheet.prepared ? "prepared" : s.sheet.granted ? "granted / always prepared" : "other class / feature"} · ${s.sheet.className ?? "class source unknown"}`,
      ),
    );
    spellList.append(li);
  }
  if (!advice.current.length)
    spellList.append(
      el(
        "li",
        "No confirmed current-access spells. Review the spell classifications in a new snapshot.",
      ),
    );
  spells.append(spellList);
  target.append(spells);
  const grid = el("div", "", { class: "lab-play-grid" });
  const current = advice.available;
  grid.append(
    panel(
      "Opening turn",
      "Conditional options from your confirmed access. Match control to the battlefield; do not replace a useful concentration spell automatically.",
      current.filter(
        (s) => s.entry.action === "action" && s.entry.roles.includes("control"),
      ),
      "/chapters/18-combat-decision-engine/",
    ),
  );
  for (const decision of advice.decisions) {
    const card = panel(
      `${decision.title} · source-backed conditions`,
      decision.recommendation_de,
      null,
      "/chapters/18-combat-decision-engine/",
    );
    card.append(
      el(
        "p",
        `Check first: ${decision.all_true.map((s) => s.replaceAll("_", " ")).join(", ")}.`,
      ),
    );
    const evidence = el("details");
    evidence.append(
      el("summary", "Analysis references"),
      el("small", `${decision.id}; ${decision.analysis_ref}.`),
    );
    card.append(evidence);
    grid.append(card);
  }
  grid.append(
    panel(
      "Concentration choices",
      "Compare one ongoing concentration commitment at a time.",
      current.filter((s) => s.entry.concentration),
      "/play/concentration/",
    ),
  );
  grid.append(
    panel(
      "Reaction priority",
      "Choose by the actual trigger and consequences. Spending a reaction has an opportunity cost.",
      current.filter((s) => s.entry.action === "reaction"),
      "/quick/reactions/",
    ),
  );
  grid.append(
    panel(
      "Defense & emergency exits",
      "Confirmed defensive and mobility options, not an assumption that you can cast them right now.",
      current.filter((s) =>
        s.entry.roles.some((r) => ["defense", "mobility"].includes(r)),
      ),
      "/quick/emergency/",
    ),
  );
  const targeting = panel(
    "Save targeting",
    "Enemy defenses are not known from your character sheet. These are the indexed defenses your current options target.",
    null,
    "/quick/targeting/",
  );
  for (const defense of new Set(current.map((s) => s.entry.defense)))
    targeting.append(
      el("h4", defense.toUpperCase()),
      links(
        current.filter((s) => s.entry.defense === defense),
        "None",
      ),
    );
  grid.append(targeting);
  grid.append(
    panel(
      "Spellbook rituals",
      "Requires a confirmed Wizard spellbook entry and an explicitly confirmed ritual flag. Casting time and other restrictions remain in the source entry.",
      advice.ritual,
      "/prepare/",
    ),
  );
  target.append(
    grid,
    el("h3", "Future planning · not current character state"),
  );
  const future = el("div", "", { class: "lab-play-grid" });
  future.append(
    panel(
      advice.bookComplete
        ? "Confirmed spellbook gaps"
        : "Possible gaps · book incomplete",
      "Mandatory acquisition entries from the existing compendium, within the known 2024 Wizard learning ceiling. Not automatically learned or prepared.",
      advice.possibleGaps,
      "/wizard/spellbook/",
    ),
  );
  future.append(
    panel(
      "Owned scrolls to consider copying",
      "Owned scrolls are not spellbook entries. Check copying prerequisites, time, cost and the scroll-copying check. Owners: rule.scroll_copying.core2024; rule.spellbook_copying.core2024.",
      advice.copies,
      "/tools/",
    ),
  );
  future.append(
    panel(
      "Daily preparation candidates",
      "Confirmed book entries not already marked as current access. Select a package for the expected day; no preparations are changed.",
      advice.preparation,
      "/prepare/",
    ),
  );
  future.append(
    panel(
      "Next Wizard level",
      "Conditional on taking another Wizard level under 2024 rules; not a committed build. Reference: sequence.pure_wizard.v1 and class.wizard.core2024. Unknown, mixed or 2014 progression is withheld.",
      advice.levelup,
      "/builds/",
    ),
  );
  future.append(
    panel(
      "Equipment & crafting",
      "Review your actual tools, supplies, currency and downtime before planning a purchase or craft. Unknown inventory is never treated as zero or as owned. Reference: rule.magic_item_crafting.core2024.",
      null,
      "/tools/",
    ),
  );
  target.append(future);
  const inventory = el("details", "", { class: "lab-details" });
  inventory.append(
    el("summary", "Inventory, notes and full snapshot evidence"),
  );
  for (const def of fields) {
    const fact = snapshot.facts[def.key];
    if (!fact) continue;
    inventory.append(
      el("h4", def.label),
      el("p", display(fact.value)),
      el(
        "small",
        `${fact.provenance} · ${fact.verification} · ${fact.confidence >= 0.85 ? "high extraction confidence" : "needs confirmation / not found"} · page ${fact.source.page ?? "—"} · ${fact.source.label}`,
      ),
    );
  }
  target.append(inventory);
  if (snapshot.previous_snapshot_ref) {
    const before = await getSnapshot(snapshot.previous_snapshot_ref);
    const diff = el("details", "", { class: "lab-details" });
    diff.append(
      el("summary", "Changes from previous snapshot"),
      changesView(comparison(before, snapshot)),
    );
    target.append(diff);
  }
  if (snapshot.source.retained) {
    const button = el("button", "Download retained PDF", {
      class: "button",
      type: "button",
    });
    button.addEventListener("click", async () => {
      try {
        const blob = await getDocument(snapshot.id);
        if (blob) download(blob, snapshot.source.filename ?? "character.pdf");
        else $("character-status").textContent = "Retained PDF is unavailable.";
      } catch (e) {
        $("character-status").textContent = e.message;
      }
    });
    target.append(button);
  }
  const privacy = el("details", "", { class: "lab-details" });
  privacy.append(
    el("summary", "Local data & privacy"),
    el(
      "p",
      "No character data is sent to a server. It stays in this browser profile, accessible to anyone sharing that profile. Export a snapshot before clearing site data. Removing this character deletes all its local snapshots and retained PDFs and cannot be undone.",
    ),
  );
  const remove = el("button", "Remove this character from this browser", {
    type: "button",
    class: "button",
  });
  remove.addEventListener("click", async () => {
    if (
      !window.confirm(
        `Delete all local snapshots and retained PDFs for ${snapshot.name}? This cannot be undone.`,
      )
    )
      return;
    try {
      await forgetCharacter(snapshot.character_id);
      location.assign("/play/");
    } catch (e) {
      $("character-status").textContent = e.message;
    }
  });
  privacy.append(remove);
  target.append(privacy);
}
render().catch((e) => {
  $("character-status").textContent =
    e.message ||
    "Local Character Lab storage is unavailable. Reference tools remain usable.";
});
