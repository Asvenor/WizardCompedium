import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
const origin = `http://127.0.0.1:${process.env.CHARACTER_IMPORT_PORT || 4331}`;
const fixture = (name) => path.resolve("tests/fixtures/character-import", name);
test("DDB orphan widgets restore structured fields, split spell sources and preview evidence", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page
    .locator("#character-pdf")
    .setInputFiles(fixture("ddb-widgets.pdf"));
  await expect(page.locator("#review-step")).toBeVisible();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Rowan Fixture",
  );
  await expect(page.getByLabel("Character level", { exact: true })).toHaveValue(
    "6",
  );
  await expect(
    page.getByLabel("Maximum Hit Points", { exact: true }),
  ).toHaveValue("42");
  await expect(
    page.getByLabel("Current Hit Points", { exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByLabel("constitution saving throw", { exact: true }),
  ).toHaveValue("5");
  await expect(page.getByLabel("Spell save DC", { exact: true })).toHaveValue(
    "14",
  );
  await expect(page.getByLabel("Equipment", { exact: true })).toHaveValue(
    /Travel Cloak · quantity 2/,
  );
  await expect(page.getByLabel("Feats", { exact: true })).toHaveValue(
    /Fictional focus feat/,
  );
  await expect(page.locator("#spell-review fieldset")).toHaveCount(5);
  await expect(
    page
      .locator("#spell-review fieldset")
      .nth(1)
      .getByLabel("Granted by / class source", { exact: true }),
  ).toHaveValue("Wizard");
  await expect(
    page
      .locator("#spell-review fieldset")
      .nth(2)
      .getByLabel("Granted by / class source", { exact: true }),
  ).toHaveValue("Artificer");
  await expect(
    page
      .locator("#spell-review fieldset")
      .nth(4)
      .getByLabel("Spell level (0 = cantrip)", { exact: true }),
  ).toHaveValue("2");
  await expect(page.locator("#extracted-pages")).toContainText("MaxHP: 42");
  await page.screenshot({ path: "test-results/ddb-widget-review.png" });
  const axe = await new AxeBuilder({ page })
    .include("#character-import")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  expect(await db(page, "snapshots")).toEqual([]);
});
const upload = async (page, name) => {
  await page.locator("#character-pdf").setInputFiles(fixture(name));
  await expect(page.locator("#review-step")).toBeVisible({ timeout: 150000 });
};
const confirm = async (page) => {
  await page.getByRole("button", { name: "Review comparison" }).click();
  await page.locator("#confirm-readings").check();
};
const save = async (page) => {
  await page
    .getByRole("button", { name: "Save snapshot & open Play Mode" })
    .click();
  await expect(page.locator("#my-character-title")).toHaveText(
    "Mira Testweaver",
  );
};
async function db(page, store) {
  return page.evaluate(
    (store) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("wizard-compendium-character-lab-v1");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(store);
          const r = tx.objectStore(store).getAll();
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
          tx.oncomplete = () => db.close();
        };
      }),
    store,
  );
}
test("text import, corrections, local save, Play advice, history, duplicates and privacy", async ({
  page,
  context,
}) => {
  const remote = [],
    errors = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith(origin + "/") &&
      !r.url().startsWith("data:") &&
      !r.url().startsWith("blob:")
    )
      remote.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/play/");
  await expect(
    page.getByRole("link", { name: "Import D&D Beyond Character" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Import D&D Beyond Character" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose your character sheet" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/import-upload-desktop.png" });
  await upload(page, "wizard-text.pdf");
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Mira Testweaver",
  );
  await expect(
    page.getByLabel("Maximum Hit Points", { exact: true }),
  ).toHaveValue("32");
  await expect(page.locator("#spell-review fieldset")).toHaveCount(6);
  await expect(
    page
      .locator("#spell-review fieldset")
      .nth(4)
      .getByLabel("Currently prepared", { exact: true }),
  ).toHaveValue("");
  await page.getByLabel("Maximum Hit Points", { exact: true }).fill("35");
  const axe = await new AxeBuilder({ page })
    .include("#character-import")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/import-review-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await confirm(page);
  await expect(page.locator("#snapshot-diff")).toContainText(
    "Maximum Hit Points",
  );
  await page.screenshot({ path: "test-results/import-confirm-mobile.png" });
  await save(page);
  await expect(page.locator("#character-content")).toContainText(
    "Opening turn",
  );
  const first = (await db(page, "snapshots"))[0];
  expect(first.facts["defenses.hp_max"].value).toBe(35);
  expect(first.observations["defenses.hp_max"].value).toBe(32);
  expect(first.facts["defenses.hp_max"].provenance).toBe("user_reported");
  expect(await db(page, "documents")).toHaveLength(0);
  await page.screenshot({ path: "test-results/personal-play-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Import a newer sheet" }).click();
  await upload(page, "wizard-updated.pdf");
  await confirm(page);
  await expect(page.locator("#snapshot-diff")).toContainText("Wizard 6");
  await page.locator("#retain-pdf").check();
  await save(page);
  expect(await db(page, "snapshots")).toHaveLength(2);
  expect(await db(page, "documents")).toHaveLength(1);
  await page.locator("#snapshot-history").selectOption(first.id);
  await expect(page.locator("#character-status")).toContainText("Snapshot 1");
  await page.getByRole("link", { name: "Import a newer sheet" }).click();
  await upload(page, "wizard-updated.pdf");
  await confirm(page);
  await page
    .getByRole("button", { name: "Save snapshot & open Play Mode" })
    .click();
  await expect(page.locator("#import-error")).toContainText("already imported");
  expect(await db(page, "snapshots")).toHaveLength(2);
  await page.locator("#allow-duplicate").check();
  await save(page);
  expect(await db(page, "snapshots")).toHaveLength(3);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/personal-play-desktop.png" });
  const finalAxe = await new AxeBuilder({ page })
    .include("#my-character")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(finalAxe.violations).toEqual([]);
  const cleanContext = await context.browser().newContext();
  const other = await cleanContext.newPage();
  await other.goto(origin + "/play/");
  await expect(other.locator("#my-character-title")).toHaveText(
    "A place for your wizard.",
  );
  await cleanContext.close();
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});
test("actual image-only PDF uses local OCR and retains low confidence", async ({
  page,
}) => {
  const remote = [];
  page.on("request", (r) => {
    if (!r.url().startsWith(origin + "/")) remote.push(r.url());
  });
  await page.goto("/play/import/");
  await upload(page, "wizard-scanned.pdf");
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Mira Testweaver",
  );
  await expect(page.locator("#review-fields")).toContainText(
    "Needs confirmation · ocr",
  );
  await expect(page.locator("#extracted-pages")).toContainText("Page 1 · ocr");
  expect(remote).toEqual([]);
});
test("invalid, corrupt, password and cancellation recover into manual entry", async ({
  page,
}) => {
  await page.goto("/play/import/");
  for (const name of ["invalid.pdf", "corrupt.pdf", "password.pdf"]) {
    await page.locator("#character-pdf").setInputFiles(fixture(name));
    await expect(page.locator("#import-error")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#manual-entry")).toBeEnabled();
  }
  await page
    .locator("#character-pdf")
    .setInputFiles(fixture("wizard-scanned.pdf"));
  await page.getByRole("button", { name: "Cancel extraction" }).click();
  await expect(page.locator("#import-error")).toContainText("cancelled");
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await page
    .getByLabel("Character name", { exact: true })
    .fill("Mira Testweaver");
  await confirm(page);
  await expect(page.locator("#retain-pdf")).toBeDisabled();
  await save(page);
  expect(
    (await db(page, "snapshots"))[0].facts["defenses.hp_max"].value,
  ).toBeNull();
});
test("value-above-label and AcroForm export", async ({ page }) => {
  await page.goto("/play/import/");
  await upload(page, "wizard-layout.pdf");
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Mira Testweaver",
  );
  await expect(page.getByLabel("Strength", { exact: true })).toHaveValue("8");
  await expect(page.getByLabel("Dexterity", { exact: true })).toHaveValue("14");
  await expect(
    page.getByLabel("Maximum Hit Points", { exact: true }),
  ).toHaveValue("32");
});
test("multiclass, missing pages and homebrew/version handling", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await upload(page, "multiclass.pdf");
  await expect(page.locator("#extraction-warnings")).toContainText(
    "Multiclass",
  );
  await expect(
    page.getByLabel("Rules generation", { exact: true }),
  ).toHaveValue("mixed");
  await page.getByRole("button", { name: "Back to upload" }).click();
  await upload(page, "missing-spells.pdf");
  await expect(page.locator("#extraction-warnings")).toContainText(
    "Spell pages may be missing",
  );
  await page.getByRole("button", { name: "Back to upload" }).click();
  await upload(page, "homebrew-2014.pdf");
  await expect(
    page.getByLabel("Homebrew present", { exact: true }),
  ).toHaveValue("true");
  await expect(
    page.getByLabel("Rules generation", { exact: true }),
  ).toHaveValue("2014");
  await expect(page.locator("#spell-review")).toContainText("Copper Comet");
});
test("timeout returns to manual entry without saving", async ({ page }) => {
  await page.clock.install();
  await page.route("**/pdf.worker.min*.mjs", () => {});
  await page.goto("/play/import/");
  await page
    .locator("#character-pdf")
    .setInputFiles(fixture("wizard-text.pdf"));
  await expect(page.locator("#cancel-import")).toBeVisible();
  await page.clock.fastForward(121000);
  await expect(page.locator("#import-error")).toContainText("timed out");
  expect(await db(page, "snapshots")).toHaveLength(0);
  await expect(page.locator("#manual-entry")).toBeEnabled();
});
test("two tabs cannot overwrite a newer snapshot; deletion removes retained data", async ({
  page,
  context,
}) => {
  await page.goto("/play/import/");
  await upload(page, "wizard-text.pdf");
  await confirm(page);
  await save(page);
  const first = (await db(page, "snapshots"))[0];
  const url = `/play/import/?character=${first.character_id}`;
  await page.goto(url);
  const other = await context.newPage();
  await other.goto(url);
  await upload(page, "wizard-updated.pdf");
  await upload(other, "wizard-updated.pdf");
  await confirm(page);
  await confirm(other);
  await page.locator("#retain-pdf").check();
  await save(page);
  await other
    .getByRole("button", { name: "Save snapshot & open Play Mode" })
    .click();
  await expect(other.locator("#import-error")).toContainText(
    "Another tab saved",
  );
  expect(await db(page, "snapshots")).toHaveLength(2);
  await other.close();
  await page.getByText("Local data & privacy", { exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Remove this character from this browser" })
    .click();
  await expect(page.locator("#my-character-title")).toHaveText(
    "A place for your wizard.",
  );
  expect(await db(page, "snapshots")).toHaveLength(0);
  expect(await db(page, "documents")).toHaveLength(0);
});
test("keyboard-only manual review and unknown values remain usable", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page.locator("#manual-entry").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Review your character", exact: true }),
  ).toBeFocused();
  await page
    .getByLabel("Character name", { exact: true })
    .fill("<script>test</script>");
  await page
    .getByLabel("Rules generation", { exact: true })
    .selectOption("2014");
  await page.getByRole("button", { name: "Review comparison" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#snapshot-diff")).toContainText(
    "<script>test</script>",
  );
  await expect(page.locator("#confirm-step script")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Confirm a new snapshot", exact: true }),
  ).toBeFocused();
});
