import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import {
  MAX_PDF_BYTES,
  SHEET_DATABASE,
  sanitizeSheetName,
  validateSaveInput,
} from "../src/features/pdf-sheet/storage.mjs";

const validId = "sheet.12345678-1234-1234-1234-123456789012";
const blob = () =>
  new Blob(["%PDF-1.7\nopaque test bytes"], { type: "application/pdf" });
const sample = () => ({
  name: "Original sheet",
  original: blob(),
  document: blob(),
});

test("sheet names remove control/directional/path characters, preserve readable Unicode and have a safe fallback", () => {
  assert.equal(
    sanitizeSheetName("  Zoë\nFixture/Sheet\u202e.pdf  "),
    "Zoë Fixture_Sheet .pdf",
  );
  assert.equal(sanitizeSheetName("...\u0000"), "Untitled character sheet");
  assert.equal(sanitizeSheetName("x".repeat(300)).length, 200);
  assert.equal(
    sanitizeSheetName("<script>evil</script>"),
    "_script_evil__script_",
  );
});

test("save input requires bounded non-empty Blobs and explicit valid update revisions", () => {
  assert.equal(validateSaveInput(sample()).id, null);
  assert.equal(
    validateSaveInput({ ...sample(), id: validId, expectedRevision: 1 })
      .expectedRevision,
    1,
  );
  assert.throws(() => validateSaveInput(null), { code: "INVALID_SAVE" });
  assert.throws(
    () => validateSaveInput({ ...sample(), original: new Blob() }),
    { code: "INVALID_PDF" },
  );
  assert.throws(
    () => validateSaveInput({ ...sample(), document: new Uint8Array(10) }),
    { code: "INVALID_PDF" },
  );
  assert.throws(
    () =>
      validateSaveInput({
        ...sample(),
        original: new Blob([new Uint8Array(MAX_PDF_BYTES + 1)]),
      }),
    { code: "PDF_TOO_LARGE" },
  );
  assert.throws(
    () =>
      validateSaveInput({
        ...sample(),
        document: new Blob([new Uint8Array(MAX_PDF_BYTES + 1)]),
      }),
    { code: "PDF_TOO_LARGE" },
  );
  assert.equal(
    validateSaveInput({
      ...sample(),
      original: new Blob([new Uint8Array(MAX_PDF_BYTES)]),
    }).original.size,
    MAX_PDF_BYTES,
  );
  assert.throws(() => validateSaveInput({ ...sample(), id: "bad" }), {
    code: "INVALID_SHEET_ID",
  });
  assert.throws(() => validateSaveInput({ ...sample(), id: validId }), {
    code: "INVALID_REVISION",
  });
  assert.throws(
    () => validateSaveInput({ ...sample(), id: validId, expectedRevision: 0 }),
    { code: "INVALID_REVISION" },
  );
  assert.throws(() => validateSaveInput({ ...sample(), expectedRevision: 1 }), {
    code: "INVALID_REVISION",
  });
  assert.notEqual(SHEET_DATABASE, "wizard-compendium-character-lab-v1");
});

let browser;
let source;
before(async () => {
  source = await readFile(
    new URL("../src/features/pdf-sheet/storage.mjs", import.meta.url),
    "utf8",
  );
  browser = await chromium.launch({ channel: "chrome", headless: true });
});
after(async () => {
  await browser?.close();
});

async function isolated(t) {
  const context = await browser.newContext();
  t.after(() => context.close());
  // All requests are intercepted; these isolated tests never contact a server.
  await context.route("**/*", (route) =>
    route.fulfill(
      route.request().url().endsWith("/storage.mjs")
        ? { contentType: "text/javascript", body: source }
        : {
            contentType: "text/html",
            body: "<!doctype html><title>Isolated PDF storage test</title>",
          },
    ),
  );
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:45679/");
  await page.evaluate(async () => {
    window.sheetStorage = await import("/storage.mjs");
  });
  return { context, page };
}

test("browser CRUD preserves original bytes, returns metadata-only lists and never touches Character Lab", async (t) => {
  const { page } = await isolated(t);
  const result = await page.evaluate(async () => {
    const api = window.sheetStorage;
    const legacyName = "wizard-compendium-character-lab-v1";
    await new Promise((resolve, reject) => {
      const open = indexedDB.open(legacyName, 1);
      open.onupgradeneeded = () =>
        open.result
          .createObjectStore("sentinel")
          .put("keep immutable snapshots", "existing");
      open.onsuccess = () => {
        open.result.close();
        resolve();
      };
      open.onerror = () => reject(open.error);
    });
    const before = await api.listSheets();
    const first = await api.saveSheet({
      name: "Test / original",
      original: new Blob(["original bytes"]),
      document: new Blob(["first editable bytes"]),
    });
    const reopened = await api.readSheet(first.id);
    const second = await api.saveSheet({
      id: first.id,
      expectedRevision: first.revision,
      name: "Updated",
      original: new Blob(["different caller bytes must not replace original"]),
      document: new Blob(["second editable bytes"]),
    });
    const latest = await api.readSheet(first.id);
    const listed = await api.listSheets();
    const deleted = await api.deleteSheet(first.id, second.revision);
    const after = await api.listSheets();
    const gone = await api.readSheet(first.id);
    const legacy = await new Promise((resolve, reject) => {
      const open = indexedDB.open(legacyName, 1);
      open.onsuccess = () => {
        const database = open.result;
        const transaction = database.transaction("sentinel");
        const read = transaction.objectStore("sentinel").get("existing");
        read.onsuccess = () => resolve(read.result);
        read.onerror = () => reject(read.error);
        transaction.oncomplete = () => database.close();
      };
    });
    return {
      before,
      first,
      second,
      listed,
      deleted,
      after,
      gone,
      legacy,
      original: await reopened.original.text(),
      firstBytes: await reopened.document.text(),
      preservedOriginal: await latest.original.text(),
      latestBytes: await latest.document.text(),
    };
  });
  assert.deepEqual(result.before, []);
  assert.equal(result.first.revision, 1);
  assert.equal(result.first.name, "Test _ original");
  assert.equal(result.second.revision, 2);
  assert.equal(result.first.id, result.second.id);
  assert.equal(result.first.createdAt, result.second.createdAt);
  assert.ok(result.second.updatedAt > result.first.updatedAt);
  assert.equal(result.original, "original bytes");
  assert.equal(result.preservedOriginal, "original bytes");
  assert.equal(result.firstBytes, "first editable bytes");
  assert.equal(result.latestBytes, "second editable bytes");
  assert.deepEqual(
    Object.keys(result.listed[0]).sort(),
    [
      "id",
      "name",
      "createdAt",
      "updatedAt",
      "revision",
      "originalSize",
      "documentSize",
    ].sort(),
  );
  assert.equal(result.deleted, true);
  assert.deepEqual(result.after, []);
  assert.equal(result.gone, null);
  assert.equal(result.legacy, "keep immutable snapshots");
});

test("two browser tabs cannot overwrite or delete a newer saved revision", async (t) => {
  const { context, page } = await isolated(t);
  const first = await page.evaluate(() =>
    window.sheetStorage.saveSheet({
      name: "Concurrent sheet",
      original: new Blob(["original"]),
      document: new Blob(["revision one"]),
    }),
  );
  const other = await context.newPage();
  await other.goto("http://127.0.0.1:45679/");
  const second = await other.evaluate(async ({ id, revision }) => {
    const api = await import("/storage.mjs");
    return api.saveSheet({
      id,
      expectedRevision: revision,
      name: "Other tab",
      original: new Blob(["original"]),
      document: new Blob(["revision two"]),
    });
  }, first);
  const result = await page.evaluate(async (first) => {
    const api = window.sheetStorage;
    const code = async (action) => {
      try {
        await action();
        return "unexpected success";
      } catch (error) {
        return error.code;
      }
    };
    const saveError = await code(() =>
      api.saveSheet({
        id: first.id,
        expectedRevision: first.revision,
        name: "Stale edit",
        original: new Blob(["original"]),
        document: new Blob(["stale bytes"]),
      }),
    );
    const deleteError = await code(() =>
      api.deleteSheet(first.id, first.revision),
    );
    const latest = await api.readSheet(first.id);
    return {
      saveError,
      deleteError,
      revision: latest.revision,
      name: latest.name,
      document: await latest.document.text(),
    };
  }, first);
  assert.equal(second.revision, 2);
  assert.deepEqual(result, {
    saveError: "STALE_REVISION",
    deleteError: "STALE_REVISION",
    revision: 2,
    name: "Other tab",
    document: "revision two",
  });
});

test("simultaneous updates have one winner and a stale save cannot resurrect a removed sheet", async (t) => {
  const { page } = await isolated(t);
  const result = await page.evaluate(async () => {
    const api = window.sheetStorage;
    const first = await api.saveSheet({
      name: "Race fixture",
      original: new Blob(["original"]),
      document: new Blob(["first"]),
    });
    const input = {
      id: first.id,
      expectedRevision: 1,
      name: "Race update",
      original: new Blob(["original"]),
      document: new Blob(["latest"]),
    };
    const outcomes = await Promise.allSettled([
      api.saveSheet(input),
      api.saveSheet(input),
    ]);
    const latest = await api.readSheet(first.id);
    await api.deleteSheet(latest.id, latest.revision);
    let deletedSave;
    try {
      await api.saveSheet({ ...input, expectedRevision: latest.revision });
    } catch (error) {
      deletedSave = error.code;
    }
    return {
      outcomes: outcomes.map((outcome) => ({
        status: outcome.status,
        code: outcome.reason?.code,
      })),
      deletedSave,
      remaining: await api.listSheets(),
    };
  });
  assert.equal(
    result.outcomes.filter((outcome) => outcome.status === "fulfilled").length,
    1,
  );
  assert.equal(
    result.outcomes.find((outcome) => outcome.status === "rejected").code,
    "STALE_REVISION",
  );
  assert.equal(result.deletedSave, "SHEET_NOT_FOUND");
  assert.deepEqual(result.remaining, []);
});

test("storage failures roll back both binary and metadata changes and explain the download fallback", async (t) => {
  const { page } = await isolated(t);
  const result = await page.evaluate(async () => {
    const api = window.sheetStorage;
    const first = await api.saveSheet({
      name: "Safe version",
      original: new Blob(["original"]),
      document: new Blob(["safe bytes"]),
    });
    const nativePut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...arguments_) {
      if (this.name === "sheets")
        throw new DOMException("Simulated full storage", "QuotaExceededError");
      return nativePut.apply(this, arguments_);
    };
    let failure;
    try {
      await api.saveSheet({
        id: first.id,
        expectedRevision: 1,
        name: "Failed update",
        original: new Blob(["original"]),
        document: new Blob(["must roll back"]),
      });
    } catch (error) {
      failure = { code: error.code, message: error.message };
    } finally {
      IDBObjectStore.prototype.put = nativePut;
    }
    const latest = await api.readSheet(first.id);
    return {
      failure,
      revision: latest.revision,
      name: latest.name,
      bytes: await latest.document.text(),
    };
  });
  assert.equal(result.failure.code, "STORAGE_QUOTA");
  assert.match(result.failure.message, /Download your edited PDF/);
  assert.equal(result.revision, 1);
  assert.equal(result.name, "Safe version");
  assert.equal(result.bytes, "safe bytes");
});

test("metadata listing never opens the binary store and unavailable storage is actionable", async (t) => {
  const { page } = await isolated(t);
  const result = await page.evaluate(async () => {
    const api = window.sheetStorage;
    await api.saveSheet({
      name: "Metadata only",
      original: new Blob(["original"]),
      document: new Blob(["edited"]),
    });
    const nativeStore = IDBTransaction.prototype.objectStore;
    IDBTransaction.prototype.objectStore = function (name) {
      if (name === "files")
        throw Error("Binary reads are forbidden for listing");
      return nativeStore.call(this, name);
    };
    let listed;
    try {
      listed = await api.listSheets();
    } finally {
      IDBTransaction.prototype.objectStore = nativeStore;
    }
    const nativeOpen = IDBFactory.prototype.open;
    IDBFactory.prototype.open = () => {
      throw new DOMException("Blocked by browser", "SecurityError");
    };
    let failure;
    try {
      await api.listSheets();
    } catch (error) {
      failure = { code: error.code, message: error.message };
    } finally {
      IDBFactory.prototype.open = nativeOpen;
    }
    return { count: listed.length, failure };
  });
  assert.equal(result.count, 1);
  assert.equal(result.failure.code, "STORAGE_UNAVAILABLE");
  assert.match(result.failure.message, /browser profile/);
  assert.match(result.failure.message, /download/);
});
