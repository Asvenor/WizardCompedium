import { test, expect } from "@playwright/test";
import path from "node:path";

const fixture = path.resolve(
  "tests/fixtures/character-import/wizard-layout.pdf",
);
const databaseName = "wizard-compendium-pdf-sheets-v1";
const hp = (page) =>
  page.locator("#pdf-fields").getByLabel("HPMax", { exact: true });

async function openFixture(page) {
  await page.goto("/play/import/");
  await page.locator("#pdf-file").setInputFiles(fixture);
  await expect(hp(page)).toHaveValue("32");
  await expect(page.locator("#pdf-sheet")).toHaveAttribute(
    "aria-busy",
    "false",
  );
}

async function save(page, revision = 1) {
  await page.locator("#sheet-save").click();
  await expect(page.locator("#sheet-save-state")).toHaveText(
    `Local revision ${revision} · saved in this browser`,
  );
  await expect(page.locator("#pdf-sheet")).toHaveAttribute(
    "aria-busy",
    "false",
  );
}

async function metadata(page) {
  return page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("sheets", "readonly");
          const records = transaction.objectStore("sheets").getAll();
          records.onsuccess = () => resolve(records.result);
          records.onerror = () => reject(records.error);
          transaction.oncomplete = () => database.close();
        };
      }),
    databaseName,
  );
}

test("cancelling a delayed local reopen preserves current edits and keeps other actions locked until the read settles", async ({
  page,
}) => {
  await openFixture(page);
  await hp(page).fill("41");
  await page.locator("#sheet-title").fill("Saved lifecycle fixture");
  await save(page);
  const before = await metadata(page);
  await hp(page).fill("63");
  await page.locator("#sheet-title").fill("Unsaved current edits");

  await page.evaluate((name) => {
    const nativeTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...arguments_) {
      const transaction = nativeTransaction.apply(this, arguments_);
      const stores = Array.from(transaction.objectStoreNames);
      if (
        this.name !== name ||
        transaction.mode !== "readonly" ||
        !stores.includes("files")
      )
        return transaction;
      IDBDatabase.prototype.transaction = nativeTransaction;
      // Keep real readonly get results and their transaction intact. Delay only
      // delivery of completion to the storage promise, never a stored value.
      Object.defineProperty(transaction, "oncomplete", {
        set(callback) {
          transaction.addEventListener(
            "complete",
            (event) => {
              window.releaseSavedSheetRead = () =>
                callback.call(transaction, event);
              window.savedSheetReadIsWaiting = true;
            },
            { once: true },
          );
        },
      });
      return transaction;
    };
  }, databaseName);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("#saved-sheets")
    .getByRole("button", { name: "Open Saved lifecycle fixture", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.savedSheetReadIsWaiting))
    .toBe(true);
  await expect(page.locator("#pdf-file")).toBeDisabled();
  await expect(page.locator("#pdf-editor")).toHaveJSProperty("inert", true);
  await expect(page.locator("#saved-sheets")).toHaveJSProperty("inert", true);
  await expect(page.locator("#sheet-cancel")).toBeVisible();
  await page.locator("#sheet-cancel").click();
  await expect(page.locator("#pdf-sheet")).toHaveAttribute("aria-busy", "true");
  await expect(page.locator("#pdf-editor")).toHaveJSProperty("inert", true);
  await expect(page.locator("#saved-sheets")).toHaveJSProperty("inert", true);
  await page.evaluate(() => window.releaseSavedSheetRead());
  await expect(page.locator("#pdf-sheet")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator("#sheet-error")).toContainText(/cancelled/i);
  await expect(page.locator("#pdf-editor")).toHaveJSProperty("inert", false);
  await expect(page.locator("#saved-sheets")).toHaveJSProperty("inert", false);
  await expect(page.locator("#pdf-file")).toBeEnabled();
  await expect(hp(page)).toHaveValue("63");
  await expect(page.locator("#sheet-title")).toHaveValue(
    "Unsaved current edits",
  );
  expect(await metadata(page)).toEqual(before);
});

test("a stale cross-tab delete refreshes the saved revision and a fresh confirmed delete succeeds", async ({
  page,
  context,
}) => {
  await openFixture(page);
  await hp(page).fill("43");
  await page.locator("#sheet-title").fill("Revision safety fixture");
  await save(page);
  await expect(page.locator("#saved-sheets")).toContainText("Revision 1");

  const other = await context.newPage();
  await other.goto("/play/import/");
  await other
    .locator("#saved-sheets")
    .getByRole("button", { name: "Open Revision safety fixture", exact: true })
    .click();
  await expect(hp(other)).toHaveValue("43");
  await hp(other).fill("48");
  await save(other, 2);
  const newest = await metadata(other);
  expect(newest).toHaveLength(1);
  expect(newest[0].revision).toBe(2);

  // This tab still displays revision one; the storage guard must reject it.
  await expect(page.locator("#saved-sheets")).toContainText("Revision 1");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("#saved-sheets")
    .getByRole("button", {
      name: "Delete local copy of Revision safety fixture",
      exact: true,
    })
    .click();
  await expect(page.locator("#sheet-error")).toContainText(
    "Another tab saved a newer version",
  );
  await expect(page.locator("#saved-sheets")).toContainText("Revision 2");
  await expect(page.locator("#pdf-sheet")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  expect(await metadata(page)).toEqual(newest);

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("#saved-sheets")
    .getByRole("button", {
      name: "Delete local copy of Revision safety fixture",
      exact: true,
    })
    .click();
  await expect(page.locator("#sheet-status")).toContainText(
    "Local PDF copy and its stored original deleted",
  );
  await expect(
    page.locator("#saved-sheets").getByRole("button", { name: /^Open / }),
  ).toHaveCount(0);
  expect(await metadata(page)).toEqual([]);
});

test("requesting an export alone does not dismiss the unsaved-edit warning", async ({
  page,
}) => {
  await openFixture(page);
  await hp(page).fill("57");
  const requested = page.waitForEvent("download");
  await page.locator("#sheet-export").click();
  const download = await requested;
  await download.cancel();
  await expect(page.locator("#pdf-sheet")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator("#sheet-save-state")).toHaveText(
    "Not saved in this browser",
  );
  let warning;
  page.once("dialog", async (dialog) => {
    warning = dialog.message();
    await dialog.dismiss();
  });
  await page.locator("#sheet-close").click();
  expect(warning).toMatch(/latest edits are not saved in this browser/i);
  await expect(page.locator("#pdf-editor")).toBeVisible();
  await expect(hp(page)).toHaveValue("57");
  expect(await metadata(page)).toEqual([]);
});
