import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDict, PDFDocument, PDFName, PDFStream } from "pdf-lib";

const origin = `http://127.0.0.1:${process.env.CHARACTER_IMPORT_PORT || 4331}`;
const fixture = (name) => path.resolve("tests/fixtures/character-import", name);
const overlayPrefix = "WizardSheetText_";
const oldDatabase = "wizard-compendium-character-lab-v1";

async function openSheet(page, file = "wizard-layout.pdf") {
  await expect(page.locator("#pdf-file")).toBeEnabled();
  await page.locator("#pdf-file").setInputFiles(fixture(file));
  await expect(page.locator("#pdf-editor")).toBeVisible();
  await expect(page.locator("#pdf-canvas")).toBeVisible();
  await expect(page.locator("#sheet-error")).toBeHidden();
}

async function downloadPdf(page, selector, testInfo, name) {
  const waiting = page.waitForEvent("download");
  await page.locator(selector).click();
  const download = await waiting;
  const output = testInfo.outputPath(name);
  await download.saveAs(output);
  expect(await download.failure()).toBeNull();
  return { output, bytes: await readFile(output) };
}

function inherited(dict, key) {
  const visited = new Set();
  let current = dict;
  while (current && !visited.has(current)) {
    visited.add(current);
    const value = current.lookup(PDFName.of(key));
    if (value !== undefined) return value;
    current = current.lookupMaybe(PDFName.of("Parent"), PDFDict);
  }
}

function assertInteractiveText(pdf, name, expected) {
  const field = pdf.getForm().getTextField(name);
  expect(field.getText()).toBe(expected);
  const widgets = field.acroField.getWidgets();
  expect(widgets.length).toBeGreaterThan(0);
  let pageWidgets = 0;
  for (const page of pdf.getPages()) {
    const annotations = page.node.Annots();
    for (let index = 0; index < (annotations?.size() ?? 0); index++) {
      const annotation = annotations.lookup(index, PDFDict);
      if (!widgets.some((widget) => widget.dict === annotation)) continue;
      expect(inherited(annotation, "V")?.decodeText()).toBe(expected);
      pageWidgets++;
    }
  }
  expect(pageWidgets).toBe(widgets.length);
  for (const widget of widgets) {
    const appearance = widget.getAppearances()?.normal;
    expect(appearance).toBeInstanceOf(PDFStream);
    expect(appearance.getContents().length).toBeGreaterThan(0);
  }
}

async function historicalSnapshots(page) {
  return page.evaluate(async (name) => {
    if (
      !(await indexedDB.databases()).some((database) => database.name === name)
    )
      return [];
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("snapshots")) {
          database.close();
          resolve([]);
          return;
        }
        const transaction = database.transaction("snapshots");
        const all = transaction.objectStore("snapshots").getAll();
        all.onsuccess = () => resolve(all.result);
        all.onerror = () => reject(all.error);
        transaction.oncomplete = () => database.close();
      };
    });
  }, oldDatabase);
}

async function seedHistoricalSnapshot(page) {
  // This is an isolated Playwright profile and fictional record, never user data.
  await page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          for (const store of ["snapshots", "characters", "documents"])
            request.result.createObjectStore(store, { keyPath: "id" });
          request.result.createObjectStore("settings", { keyPath: "key" });
        };
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("snapshots", "readwrite");
          const fact = {
            value: "Preserved fictional wizard",
            provenance: "user_reported",
            confidence: 1,
            verification: "user_confirmed",
            source: {
              page: null,
              label: "Synthetic test fixture",
              method: "manual",
            },
            alternatives: [],
          };
          transaction.objectStore("snapshots").add({
            schema_type: "character",
            schema_version: "1.1.0",
            id: "snapshot.aaa111",
            character_id: "character.bbb222",
            revision: 1,
            name: fact.value,
            observed_at: null,
            recorded_at: "2026-09-08T10:00:00Z",
            source: {
              type: "manual",
              filename: null,
              sha256: null,
              page_count: 0,
              methods: ["manual"],
              retained: false,
            },
            ruleset_profile_ref: null,
            facts: { "identity.name": fact },
            observations: { "identity.name": structuredClone(fact) },
            corrections: [],
            unknowns: [],
            scope_restrictions: ["Fictional preservation test"],
            previous_snapshot_ref: null,
          });
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
      }),
    oldDatabase,
  );
}

test.beforeEach(async ({ page }) => {
  // Tests intentionally leave unsaved fictional edits to verify discard behavior.
  page.on("dialog", (dialog) => dialog.accept());
});

test("fillable PDF edits save locally, reopen, export interactively, and preserve the original", async ({
  page,
  context,
}, testInfo) => {
  const remote = [],
    ocrRequests = [],
    errors = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      !url.startsWith(origin + "/") &&
      !url.startsWith("data:") &&
      !url.startsWith("blob:")
    )
      remote.push(url);
    if (/tesseract|traineddata|\/character-import\/worker\.min\.js/i.test(url))
      ocrRequests.push(url);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/play/import/");
  await seedHistoricalSnapshot(page);
  const priorSnapshots = await historicalSnapshots(page);
  expect(priorSnapshots).toHaveLength(1);
  await openSheet(page);
  const hp = page.locator("#pdf-fields").getByLabel("HPMax", { exact: true });
  await expect(hp).toHaveValue("32");
  await hp.fill("47");
  await page.locator("#sheet-title").fill("Friday Wizard");
  await page.locator("#sheet-save").click();
  await expect(page.locator("#sheet-status")).toContainText(/saved/i);
  await page.reload();
  await page
    .locator("#saved-sheets")
    .getByRole("button", { name: "Open Friday Wizard", exact: true })
    .click();
  await expect(hp).toHaveValue("47");
  const original = await downloadPdf(
    page,
    "#sheet-original",
    testInfo,
    "original-wizard.pdf",
  );
  expect(
    original.bytes.equals(await readFile(fixture("wizard-layout.pdf"))),
  ).toBe(true);
  const exported = await downloadPdf(
    page,
    "#sheet-export",
    testInfo,
    "edited-wizard.pdf",
  );
  const pdf = await PDFDocument.load(exported.bytes);
  assertInteractiveText(pdf, "HPMax", "47");
  await page.reload();
  await page.locator("#pdf-file").setInputFiles(exported.output);
  await expect(hp).toHaveValue("47");
  await hp.fill("48");
  await expect(hp).toHaveValue("48");
  await page.screenshot({
    path: testInfo.outputPath("fillable-export-reopened.png"),
    fullPage: true,
  });
  expect(await historicalSnapshots(page)).toEqual(priorSnapshots);
  const separate = await context.browser().newContext();
  try {
    const other = await separate.newPage();
    await other.goto(origin + "/play/import/");
    await expect(
      other.locator("#saved-sheets").getByRole("button", { name: /^Open / }),
    ).toHaveCount(0);
  } finally {
    await separate.close();
  }
  expect(remote).toEqual([]);
  expect(ocrRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("opening and typing do not automatically save or import a character", async ({
  page,
}) => {
  await page.goto("/play/import/");
  const before = await historicalSnapshots(page);
  await openSheet(page);
  await page
    .locator("#pdf-fields")
    .getByLabel("HPMax", { exact: true })
    .fill("51");
  await expect(
    page.locator("#review-step, #confirm-step, #spell-review"),
  ).toHaveCount(0);
  expect(await historicalSnapshots(page)).toEqual(before);
  await page.reload();
  await expect(
    page.locator("#saved-sheets").getByRole("button", { name: /^Open / }),
  ).toHaveCount(0);
  await expect(page.locator("#pdf-editor")).toBeHidden();
});

test("recoverable DDB page widgets become real editable exported fields", async ({
  page,
}, testInfo) => {
  await page.goto("/play/import/");
  await openSheet(page, "ddb-widgets.pdf");
  const maxHp = page
    .locator("#pdf-fields")
    .getByLabel("MaxHP", { exact: true });
  await expect(maxHp).toHaveValue("42");
  await maxHp.fill("46");
  await page.locator("#page-select").selectOption({ index: 1 });
  const secondPageName = page
    .locator("#pdf-fields")
    .getByLabel("CharacterName2", { exact: true });
  await expect(secondPageName).toHaveValue("Rowan Fixture");
  await secondPageName.fill("Rowan, session update");
  await expect(secondPageName).toHaveValue("Rowan, session update");
  await page.locator("#page-select").selectOption({ index: 0 });
  await expect(maxHp).toHaveValue("46");
  const exported = await downloadPdf(
    page,
    "#sheet-export",
    testInfo,
    "repaired-ddb-widgets.pdf",
  );
  const pdf = await PDFDocument.load(exported.bytes);
  assertInteractiveText(pdf, "MaxHP", "46");
  assertInteractiveText(pdf, "CharacterName2", "Rowan, session update");
  const names = pdf
    .getForm()
    .getFields()
    .map((field) => field.getName());
  expect(new Set(names).size).toBe(names.length);
  await page.reload();
  await page.locator("#pdf-file").setInputFiles(exported.output);
  await expect(maxHp).toHaveValue("46");
  await page.screenshot({
    path: testInfo.outputPath("repaired-widgets-reopened.png"),
    fullPage: true,
  });
});

test("printed-sheet additions and visual covers export as editable fields", async ({
  page,
}, testInfo) => {
  await page.goto("/play/import/");
  await openSheet(page, "wizard-text.pdf");
  await expect(
    page.locator("#pdf-fields input, #pdf-fields textarea, #pdf-fields select"),
  ).toHaveCount(0);
  await page.locator("#text-add").click();
  await page.locator("#text-placement").click({ position: { x: 120, y: 180 } });
  await page.locator("#text-value").fill("Session note: bring spellbook");
  await page.locator("#text-width").fill("230");
  await page.locator("#text-size").fill("12");
  await page.locator("#text-replace").click();
  await page.locator("#text-placement").click({ position: { x: 100, y: 100 } });
  await page.locator("#text-value").fill("Mira, revised for this session");
  await page.locator("#text-x").fill("35");
  await page.locator("#text-y").fill("45");
  await page.locator("#text-width").fill("260");
  await page.locator("#text-height").fill("28");
  await page.locator("#text-value").focus();
  await expect(page.locator("[data-overlay-id]")).toHaveCount(2);
  await expect(
    page.getByText(
      /not secure redaction|not a secure redaction|not a redaction tool/i,
    ),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("printed-text-cover-editor.png"),
    fullPage: true,
  });
  const exported = await downloadPdf(
    page,
    "#sheet-export",
    testInfo,
    "editable-text-additions.pdf",
  );
  const pdf = await PDFDocument.load(exported.bytes);
  const additions = pdf
    .getForm()
    .getFields()
    .filter((field) => field.getName().startsWith(overlayPrefix));
  expect(additions).toHaveLength(2);
  expect(additions.map((field) => field.getText()).sort()).toEqual(
    ["Mira, revised for this session", "Session note: bring spellbook"].sort(),
  );
  for (const field of additions)
    assertInteractiveText(pdf, field.getName(), field.getText());
  await page.reload();
  await page.locator("#pdf-file").setInputFiles(exported.output);
  const controls = page.locator(
    `#pdf-fields [data-field-name^='${overlayPrefix}']`,
  );
  await expect(controls).toHaveCount(2);
  await controls.first().fill("Still editable after reopening");
  await expect(controls.first()).toHaveValue("Still editable after reopening");
  await page.screenshot({
    path: testInfo.outputPath("editable-additions-reopened.png"),
    fullPage: true,
  });
});

test("new overlays can be removed and saved additions stay editable next session", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await openSheet(page, "wizard-scanned.pdf");
  await page.locator("#text-add").click();
  await page.locator("#text-placement").click({ position: { x: 120, y: 180 } });
  await page.locator("#text-value").fill("Temporary note");
  await page.locator("#text-remove").click();
  await expect(page.locator("[data-overlay-id]")).toHaveCount(0);
  await page.locator("#text-add").click();
  await page.locator("#text-placement").click({ position: { x: 120, y: 180 } });
  await page.locator("#text-value").fill("Scanned sheet note");
  await page.locator("#text-width").fill("240");
  await page.locator("#sheet-title").fill("Scanned Session");
  await page.locator("#sheet-save").click();
  await expect(page.locator("#sheet-status")).toContainText(/saved/i);
  await page.reload();
  await page
    .locator("#saved-sheets")
    .getByRole("button", { name: "Open Scanned Session", exact: true })
    .click();
  const note = page.locator(
    `#pdf-fields [data-field-name^='${overlayPrefix}']`,
  );
  await expect(note).toHaveValue("Scanned sheet note");
  await note.fill("Scanned sheet note, updated");
  await page.locator("#sheet-save").click();
  await expect(page.locator("#sheet-status")).toContainText(/saved/i);
  await page.reload();
  await page
    .locator("#saved-sheets")
    .getByRole("button", { name: "Open Scanned Session", exact: true })
    .click();
  await expect(note).toHaveValue("Scanned sheet note, updated");
});

test("invalid and password-protected uploads report errors without losing a saved sheet", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await openSheet(page);
  await page.locator("#sheet-title").fill("Preserved Wizard");
  await page.locator("#sheet-save").click();
  await expect(page.locator("#sheet-status")).toContainText(/saved/i);
  await page.locator("#sheet-close").click();
  await expect(page.locator("#sheet-upload")).toBeVisible();
  for (const name of ["invalid.pdf", "corrupt.pdf", "password.pdf"]) {
    await expect(page.locator("#pdf-file")).toBeEnabled();
    await page.locator("#pdf-file").setInputFiles(fixture(name));
    await expect(page.locator("#sheet-error")).toBeVisible();
    await expect(page.locator("#sheet-error")).not.toHaveText("");
    if (name === "password.pdf")
      await expect(page.locator("#sheet-error")).toContainText(
        /password|protect|encrypt|locked/i,
      );
    await expect(
      page
        .locator("#saved-sheets")
        .getByRole("button", { name: "Open Preserved Wizard", exact: true }),
    ).toBeVisible();
  }
  await page
    .locator("#saved-sheets")
    .getByRole("button", { name: "Open Preserved Wizard", exact: true })
    .click();
  await expect(
    page.locator("#pdf-fields").getByLabel("HPMax", { exact: true }),
  ).toHaveValue("32");
});

test("mobile sheet editing stays readable and keyboard controls remain accessible", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play/import/");
  await openSheet(page);
  const hp = page.locator("#pdf-fields").getByLabel("HPMax", { exact: true });
  await hp.focus();
  await expect(hp).toBeFocused();
  await hp.fill("40");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("pdf-sheet-mobile.png"),
    fullPage: true,
  });
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.locator("#zoom-select").selectOption({ index: 1 });
  await expect(hp).toHaveValue("40");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
