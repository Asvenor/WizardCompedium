import test from "node:test";
import assert from "node:assert/strict";
import {
  blankDraft,
  correct,
  makeSnapshot,
  comparison,
  addSpell,
  reviewStatus,
} from "../src/features/character-lab/model.mjs";
import { personalize } from "../src/features/character-lab/personalize.mjs";

const catalog = ["Web", "Shield", "Wish"].map((name, index) => ({
  name,
  level: [2, 1, 9][index],
  generation: "2024",
  sourceSensitive: false,
  canonicalRefs: [],
  acquisition: "mandatory",
}));
function wizard(summary = "Wizard 5") {
  const draft = blankDraft();
  correct(draft, "identity.name", "Completion Fixture");
  correct(draft, "identity.classes", summary);
  correct(draft, "rules.generation", "2024");
  return draft;
}
function spell(draft, status) {
  const key = addSpell(draft);
  correct(draft, `${key}.name`, "Web");
  correct(draft, `${key}.class`, "Wizard");
  correct(draft, `${key}.level`, 2);
  correct(draft, `${key}.${status}`, true);
  return key;
}

test("blank corrections stay unknown rather than confirming an empty string", () => {
  const draft = wizard();
  correct(draft, "identity.background", " \n ");
  assert.equal(draft.facts["identity.background"].value, null);
  assert.equal(reviewStatus(draft.facts["identity.background"]), "Unknown");
});

test("an unconfirmed rules reading never selects a confirmed rules profile", () => {
  const draft = wizard();
  draft.facts["rules.generation"].verification = "needs_confirmation";
  const snapshot = makeSnapshot(draft, draft.facts);
  assert.equal(snapshot.ruleset_profile_ref, null);
  assert.ok(snapshot.unknowns.includes("rules.generation"));
  assert.equal(snapshot.facts["rules.generation"].value, "2024");
  assert.equal(
    reviewStatus(snapshot.facts["rules.generation"]),
    "Needs confirmation",
  );
});

test("snapshot comparisons report reviewed status changes without changing observed values", () => {
  const draft = wizard();
  correct(draft, "defenses.ac", 15);
  draft.facts["defenses.ac"].verification = "needs_confirmation";
  const before = structuredClone(draft);
  draft.facts["defenses.ac"].verification = "user_confirmed";
  const diff = comparison(before, draft);
  assert.deepEqual(diff, [
    {
      label: "Armor Class review status",
      before: "Needs confirmation",
      after: "Player confirmed",
    },
  ]);
});

test("spell review-only changes remain visible in the snapshot comparison", () => {
  const draft = wizard();
  const key = spell(draft, "prepared");
  draft.facts[`${key}.prepared`].verification = "needs_confirmation";
  const before = structuredClone(draft);
  draft.facts[`${key}.prepared`].verification = "user_confirmed";
  const diff = comparison(before, draft);
  assert.equal(diff.length, 1);
  assert.match(diff[0].before, /prepared Needs confirmation/);
  assert.match(diff[0].after, /prepared Player confirmed/);
});

test("known from another feature never independently establishes current preparation", () => {
  const draft = wizard();
  const key = spell(draft, "other");
  assert.equal(personalize(draft, catalog).current.length, 1);
  assert.equal(personalize(draft, catalog).available.length, 0);
  correct(draft, `${key}.prepared`, true);
  assert.equal(personalize(draft, catalog).available.length, 1);
});

test("next-Wizard-level advice respects total multiclass progression and conflicting totals", () => {
  assert.ok(
    personalize(wizard("Wizard 18 / Artificer 1"), catalog).levelup.length,
  );
  const atLimit = wizard("Wizard 19 / Artificer 1");
  assert.equal(personalize(atLimit, catalog).levelup.length, 0);
  assert.equal(personalize(atLimit, catalog).nextLevelSupported, false);
  const mismatch = wizard();
  correct(mismatch, "identity.level", 12);
  assert.equal(personalize(mismatch, catalog).levelup.length, 0);
});

test("unconfirmed names cannot grant casting or remove a possible spellbook gap", () => {
  const draft = wizard();
  const key = spell(draft, "prepared");
  correct(draft, `${key}.book`, true);
  draft.facts[`${key}.name`].verification = "needs_confirmation";
  const advice = personalize(draft, catalog);
  assert.equal(advice.current.length, 0);
  assert.equal(advice.available.length, 0);
  assert.ok(advice.possibleGaps.some((s) => s.name === "Web"));
});

test("a complete-book checkbox cannot silently settle unconfirmed spellbook classifications", () => {
  const draft = wizard();
  const key = spell(draft, "prepared");
  correct(draft, "book.complete", true);
  assert.equal(personalize(draft, catalog).bookComplete, false);
  correct(draft, `${key}.book`, true);
  assert.equal(personalize(draft, catalog).bookComplete, true);
});
