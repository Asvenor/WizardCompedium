import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import { fields } from "../../src/features/character-lab/model.mjs";

const fixture = (name) => path.resolve("tests/fixtures/character-import", name);
const field = (page, key) => page.locator(`[id="field-${key}"]`);
const confirmField = (page, key) => page.locator(`[id="confirm-${key}"]`);
const hint = (page, key) => page.locator(`[id="hint-${key}"]`);

async function snapshots(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("wizard-compendium-character-lab-v1");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("snapshots");
          const records = transaction.objectStore("snapshots").getAll();
          records.onsuccess = () => resolve(records.result);
          records.onerror = () => reject(records.error);
          transaction.oncomplete = () => database.close();
        };
      }),
  );
}

async function saveReviewed(page) {
  await page.getByRole("button", { name: "Review comparison" }).click();
  await expect(page.locator("#confirm-step")).toBeVisible();
  await expect(page.locator("#confirm-step")).toContainText(
    "Unconfirmed readings remain observations",
  );
  await page.locator("#confirm-readings").check();
  await page
    .getByRole("button", { name: "Save snapshot & open Play Mode" })
    .click();
  await expect(page).toHaveURL(/\/play\/\?imported=1#my-character$/);
}

test("a delayed history check cannot advance a review after navigation or newer corrections", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await field(page, "identity.name").fill("Previous snapshot fixture");
  await saveReviewed(page);
  const [previous] = await snapshots(page);
  await page.goto(`/play/import/?character=${previous.character_id}`);
  await page
    .locator("#character-pdf")
    .setInputFiles(fixture("wizard-text.pdf"));
  await expect(page.locator("#review-step")).toBeVisible();

  // Delay only delivery of one real, readonly history result. No stored values
  // are changed, and the native IndexedDB method is immediately restored.
  await page.evaluate(() => {
    const nativeGetAll = IDBIndex.prototype.getAll;
    IDBIndex.prototype.getAll = function (...arguments_) {
      const request = nativeGetAll.apply(this, arguments_);
      if (
        this.name !== "character_id" ||
        this.objectStore.name !== "snapshots" ||
        this.objectStore.transaction.mode !== "readonly"
      )
        return request;
      IDBIndex.prototype.getAll = nativeGetAll;
      Object.defineProperty(request, "onsuccess", {
        set(callback) {
          request.addEventListener(
            "success",
            (event) => {
              window.releaseImportHistory = () => callback.call(request, event);
              window.importHistoryIsWaiting = true;
            },
            { once: true },
          );
        },
      });
      return request;
    };
  });
  await page.getByRole("button", { name: "Review comparison" }).click();
  await expect
    .poll(() => page.evaluate(() => window.importHistoryIsWaiting))
    .toBe(true);
  await page.getByRole("button", { name: "Back to upload" }).click();
  await page.getByRole("button", { name: "Return to unsaved review" }).click();
  await field(page, "defenses.hp_current").fill("29");
  await page.evaluate(async () => {
    window.releaseImportHistory();
    // Let the resumed promise and its DOM updates settle before assertions.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await expect(page.locator("#review-step")).toBeVisible();
  await expect(page.locator("#confirm-step")).toBeHidden();
  await expect(field(page, "defenses.hp_current")).toHaveValue("29");
  await expect(page.locator("#import-error")).toBeHidden();
  expect(await snapshots(page)).toEqual([previous]);

  // A fresh action must still work and compare the most recent correction.
  await page.getByRole("button", { name: "Review comparison" }).click();
  await expect(page.locator("#confirm-step")).toBeVisible();
  await expect(
    page
      .locator("#snapshot-diff .lab-diff-row")
      .filter({ hasText: "Current Hit Points" }),
  ).toContainText("Now: 29");
});

test("every supported field is correctable, unknowns cannot be confirmed and review navigation opens sections", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page.getByRole("button", { name: "Enter character manually" }).click();
  for (const definition of fields) {
    await expect(field(page, definition.key)).toHaveCount(1);
    await expect(confirmField(page, definition.key)).toBeDisabled();
  }
  await expect(field(page, "identity.name")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.locator("#review-identity-and-progression summary").click();
  await page.getByRole("button", { name: "Review comparison" }).click();
  await expect(field(page, "identity.name")).toBeFocused();
  await expect(
    page.locator("#review-identity-and-progression"),
  ).toHaveAttribute("open", "");
  await expect(page.locator("#import-error")).toHaveText(
    "Enter a character name.",
  );
  await field(page, "identity.name").fill("Review completeness fixture");
  await expect(field(page, "identity.name")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await expect(confirmField(page, "identity.name")).toBeChecked();
  await expect(hint(page, "identity.name")).toContainText("Player confirmed");
  await field(page, "identity.name").fill("   ");
  await expect(confirmField(page, "identity.name")).toBeDisabled();
  await expect(hint(page, "identity.name")).toContainText(
    "Required before saving",
  );
  await page.locator("#review-identity-and-progression summary").click();
  await page
    .getByRole("navigation", { name: "Character review sections" })
    .getByRole("link", { name: "Identity and progression", exact: true })
    .click();
  await expect(
    page.locator("#review-identity-and-progression summary"),
  ).toBeFocused();
  await expect(field(page, "identity.name")).toBeVisible();
});

test("bulk review does not confirm calculated values and saving preserves optional uncertainty and unnamed spell evidence", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await field(page, "identity.name").fill("Uncertain fixture");
  await field(page, "identity.classes").fill("Wizard 6 / Artificer 1");
  await expect(field(page, "identity.level")).toHaveValue("7");
  await expect(confirmField(page, "identity.level")).not.toBeChecked();
  await page
    .getByRole("button", { name: "Confirm high-confidence readings" })
    .click();
  await expect(confirmField(page, "identity.level")).not.toBeChecked();
  await expect(hint(page, "identity.level")).toContainText(
    "Needs confirmation",
  );
  await confirmField(page, "identity.level").check();
  await expect(hint(page, "identity.level")).toContainText("Player confirmed");
  await confirmField(page, "identity.level").uncheck();
  await page.getByRole("button", { name: "Add a spell or cantrip" }).click();
  await page.getByLabel("Spell level (0 = cantrip)", { exact: true }).fill("2");
  await expect(page.locator("#review-summary")).toContainText(
    "awaiting confirmation",
  );
  await saveReviewed(page);
  const [saved] = await snapshots(page);
  expect(saved.facts["identity.level"]).toMatchObject({
    value: 7,
    provenance: "derived",
    verification: "needs_confirmation",
  });
  expect(saved.unknowns).toContain("identity.level");
  expect(saved.facts["identity.name"]).toMatchObject({
    value: "Uncertain fixture",
    verification: "user_confirmed",
  });
  expect(saved.facts["defenses.hp_max"].value).toBeNull();
  const unnamed = Object.keys(saved.facts).find((key) =>
    /^spells\..+\.name$/.test(key),
  );
  expect(unnamed).toBeTruthy();
  expect(saved.facts[unnamed].value).toBeNull();
  expect(saved.facts[unnamed.replace(/\.name$/, ".level")].value).toBe(2);
});

test("high-confidence review preserves uncertain spell readings unless individually confirmed", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page
    .locator("#character-pdf")
    .setInputFiles(fixture("wizard-text.pdf"));
  await expect(page.locator("#review-step")).toBeVisible();
  await expect(page.locator("#review-source")).toContainText(
    "wizard-text.pdf · 2 pages",
  );
  const spellName = page
    .locator("#spell-review fieldset")
    .first()
    .getByLabel("Confirm Spell name", { exact: true });
  await expect(confirmField(page, "identity.name")).not.toBeChecked();
  await page
    .getByRole("button", { name: "Confirm high-confidence readings" })
    .click();
  await expect(confirmField(page, "identity.name")).toBeChecked();
  await expect(spellName).not.toBeChecked();
  await spellName.check();
  await expect(page.locator("#extraction-progress")).toBeHidden();
  await saveReviewed(page);
  const [saved] = await snapshots(page);
  const spellNames = Object.entries(saved.facts).filter(([key]) =>
    /^spells\..+\.name$/.test(key),
  );
  expect(spellNames).toHaveLength(6);
  const confirmed = spellNames.filter(
    ([, fact]) => fact.verification === "user_confirmed",
  );
  const uncertain = spellNames.filter(
    ([, fact]) => fact.verification !== "user_confirmed",
  );
  expect(confirmed).toHaveLength(1);
  expect(uncertain).toHaveLength(5);
  expect(confirmed[0][1].value).toBe("Web");
  expect(saved.unknowns).not.toContain(confirmed[0][0]);
  expect(uncertain.every(([key]) => saved.unknowns.includes(key))).toBe(true);
  expect(saved.facts["identity.name"].verification).toBe("user_confirmed");
  expect(saved.facts["defenses.hp_temp"].value).toBeNull();
});

test("conflicting PDF values remain blank with alternatives until individually corrected", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page
    .locator("#character-pdf")
    .setInputFiles(fixture("conflicting-readings.pdf"));
  await expect(page.locator("#review-step")).toBeVisible();
  await expect(field(page, "defenses.ac")).toHaveValue("");
  await expect(hint(page, "defenses.ac")).toContainText("Conflicting readings");
  await expect(hint(page, "defenses.ac")).toContainText("15");
  await expect(hint(page, "defenses.ac")).toContainText("18");
  await expect(confirmField(page, "defenses.ac")).toBeDisabled();
  await page
    .getByRole("button", { name: "Confirm high-confidence readings" })
    .click();
  await expect(field(page, "defenses.ac")).toHaveValue("");
  await field(page, "defenses.ac").fill("18");
  await expect(confirmField(page, "defenses.ac")).toBeChecked();
  await expect(hint(page, "defenses.ac")).toContainText("Player confirmed");
  await expect(hint(page, "defenses.ac")).toContainText(
    "Original alternatives",
  );
  await expect(page.locator("#review-summary")).toContainText(
    "0 unresolved conflicts",
  );
  await saveReviewed(page);
  const [saved] = await snapshots(page);
  expect(saved.facts["defenses.ac"]).toMatchObject({
    value: 18,
    verification: "user_confirmed",
  });
  expect(
    saved.facts["defenses.ac"].alternatives.map(
      (alternative) => alternative.value,
    ),
  ).toEqual(expect.arrayContaining([15, 18]));
  expect(saved.observations["defenses.ac"].value).toBeNull();
});

test("dropping multiple files reports a focused error without discarding an unsaved review", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await field(page, "identity.name").fill("Keep this review");
  await page.getByRole("button", { name: "Back to upload" }).click();
  await page.locator("#import-drop").evaluate((drop) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(["%PDF-1.7"], "first.pdf", { type: "application/pdf" }),
    );
    transfer.items.add(
      new File(["%PDF-1.7"], "second.pdf", { type: "application/pdf" }),
    );
    drop.dispatchEvent(
      new DragEvent("drop", { bubbles: true, dataTransfer: transfer }),
    );
  });
  await expect(page.locator("#import-error")).toHaveText(
    "Choose one character PDF at a time.",
  );
  await expect(page.locator("#import-error")).toBeFocused();
  await expect(page.locator("#extraction-progress")).toBeHidden();
  await page.getByRole("button", { name: "Return to unsaved review" }).click();
  await expect(field(page, "identity.name")).toHaveValue("Keep this review");
  expect(await snapshots(page)).toEqual([]);
});

test("mobile review remains within the viewport and has labeled accessible correction controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play/import/");
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await field(page, "identity.name").fill("Mobile review fixture");
  await page.getByRole("button", { name: "Add a spell or cantrip" }).click();
  await page
    .getByLabel("Spell name", { exact: true })
    .fill("A fictional spell with a long descriptive name for narrow displays");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .include("#character-import")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page
    .getByRole("navigation", { name: "Character review sections" })
    .getByRole("link", { name: "Identity and progression", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/import-review-complete-mobile.png",
  });
});
