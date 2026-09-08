// PDF-sheet saves are explicit and separate from immutable Character Lab snapshots.
export const SHEET_DATABASE = "wizard-compendium-pdf-sheets-v1";
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
const METADATA = "sheets";
const FILES = "files";

function problem(code, message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.name = "PDFSheetStorageError";
  error.code = code;
  return error;
}

function storageProblem(error) {
  if (error?.name === "PDFSheetStorageError") return error;
  if (error?.name === "QuotaExceededError")
    return problem(
      "STORAGE_QUOTA",
      "Browser storage is full. Download your edited PDF before freeing space or trying again. No saved sheet was replaced.",
      error,
    );
  return problem(
    "STORAGE_UNAVAILABLE",
    "Local PDF-sheet storage is unavailable. Allow site storage or use another browser profile. You can still download your edited PDF.",
    error,
  );
}

export function sanitizeSheetName(name) {
  return (
    String(name ?? "")
      .normalize("NFKC")
      .replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, " ")
      .replace(/[\\/:<>"|?*]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200)
      .replace(/^[. ]+|[. ]+$/g, "") || "Untitled character sheet"
  );
}

function validateId(id) {
  if (
    typeof id !== "string" ||
    !/^sheet\.[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)
  )
    throw problem("INVALID_SHEET_ID", "Choose a valid saved PDF sheet.");
}

function validateRevision(revision) {
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw problem(
      "INVALID_REVISION",
      "Reopen the saved PDF sheet before changing it.",
    );
}

function validateBlob(blob, label) {
  // The PDF editor validates the file format. Storage treats the bytes as opaque.
  if (!(blob instanceof Blob) || blob.size === 0)
    throw problem("INVALID_PDF", `${label} must be a non-empty PDF file.`);
  if (blob.size > MAX_PDF_BYTES)
    throw problem(
      "PDF_TOO_LARGE",
      `${label} exceeds the 15 MB limit. Download it instead of saving it in this browser.`,
    );
}

export function validateSaveInput(input) {
  if (!input || typeof input !== "object")
    throw problem("INVALID_SAVE", "Choose a PDF sheet before saving.");
  const existing = input.id !== undefined && input.id !== null;
  if (existing) {
    validateId(input.id);
    validateRevision(input.expectedRevision);
  } else if (
    input.expectedRevision !== undefined &&
    input.expectedRevision !== null
  ) {
    throw problem(
      "INVALID_REVISION",
      "A new PDF sheet cannot replace an existing revision.",
    );
  }
  validateBlob(input.original, "The original PDF");
  validateBlob(input.document, "The edited PDF");
  return {
    id: existing ? input.id : null,
    expectedRevision: existing ? input.expectedRevision : null,
    name: sanitizeSheetName(input.name),
    original: input.original,
    document: input.document,
  };
}

function metadata(record) {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    revision: record.revision,
    originalSize: record.originalSize,
    documentSize: record.documentSize,
  };
}

function openSheets() {
  return new Promise((resolve, reject) => {
    let request;
    let settled = false;
    const fail = (error) => {
      settled = true;
      reject(storageProblem(error));
    };
    try {
      request = indexedDB.open(SHEET_DATABASE, 1);
    } catch (error) {
      fail(error);
      return;
    }
    request.onupgradeneeded = () => {
      request.result.createObjectStore(METADATA, { keyPath: "id" });
      request.result.createObjectStore(FILES, { keyPath: "id" });
    };
    request.onsuccess = () => {
      const database = request.result;
      if (settled) {
        database.close();
        return;
      }
      database.onversionchange = () => database.close();
      settled = true;
      resolve(database);
    };
    request.onerror = () => fail(request.error);
    request.onblocked = () =>
      fail(
        problem(
          "STORAGE_BLOCKED",
          "Close other PDF-sheet tabs, then reopen your saved sheets. Nothing was overwritten.",
        ),
      );
  });
}

async function transaction(stores, mode, operate) {
  const database = await openSheets();
  return new Promise((resolve, reject) => {
    let tx;
    let result;
    let failure;
    try {
      tx = database.transaction(stores, mode);
    } catch (error) {
      database.close();
      reject(storageProblem(error));
      return;
    }
    const fail = (error) => {
      failure = storageProblem(error);
      try {
        tx.abort();
      } catch {
        database.close();
        reject(failure);
      }
    };
    const read = (request, receive) => {
      request.onsuccess = () => {
        try {
          receive(request.result);
        } catch (error) {
          fail(error);
        }
      };
    };
    tx.oncomplete = () => {
      database.close();
      resolve(result);
    };
    tx.onabort = () => {
      database.close();
      reject(failure || storageProblem(tx.error));
    };
    tx.onerror = (event) => {
      failure ||= storageProblem(event.target?.error || tx.error);
    };
    try {
      operate(
        tx,
        (value) => {
          result = value;
        },
        read,
      );
    } catch (error) {
      fail(error);
    }
  });
}

export async function listSheets() {
  return transaction([METADATA], "readonly", (tx, result, read) => {
    read(tx.objectStore(METADATA).getAll(), (records) => {
      result(
        records
          .map(metadata)
          .sort(
            (left, right) =>
              right.updatedAt.localeCompare(left.updatedAt) ||
              left.id.localeCompare(right.id),
          ),
      );
    });
  });
}

export async function readSheet(id) {
  validateId(id);
  return transaction([METADATA, FILES], "readonly", (tx, result, read) => {
    read(tx.objectStore(METADATA).get(id), (record) => {
      if (!record) {
        result(null);
        return;
      }
      read(tx.objectStore(FILES).get(id), (files) => {
        if (
          !(files?.original instanceof Blob) ||
          !(files?.document instanceof Blob)
        )
          throw problem(
            "SHEET_DAMAGED",
            "This saved sheet is missing its PDF data. Reopen an exported PDF instead; no stored data was changed.",
          );
        result({
          ...metadata(record),
          original: files.original,
          document: files.document,
        });
      });
    });
  });
}

export async function saveSheet(input) {
  const prepared = validateSaveInput(input);
  const id = prepared.id ?? `sheet.${crypto.randomUUID()}`;
  return transaction([METADATA, FILES], "readwrite", (tx, result, read) => {
    const sheets = tx.objectStore(METADATA);
    const files = tx.objectStore(FILES);
    read(sheets.get(id), (current) => {
      if (prepared.id && !current)
        throw problem(
          "SHEET_NOT_FOUND",
          "This sheet was removed in another tab. Save it as a new sheet to keep your edits.",
        );
      if (
        current &&
        (current.revision !== prepared.expectedRevision || !prepared.id)
      )
        throw problem(
          "STALE_REVISION",
          "Another tab saved a newer version. Reopen the saved sheet or download your edits; nothing was overwritten.",
        );
      if (current?.revision === Number.MAX_SAFE_INTEGER)
        throw problem(
          "INVALID_REVISION",
          "Save this PDF as a new sheet to continue editing.",
        );
      const finish = (original) => {
        const timestamp = new Date(
          Math.max(Date.now(), (Date.parse(current?.updatedAt) || 0) + 1),
        ).toISOString();
        const record = {
          id,
          name: prepared.name,
          createdAt: current?.createdAt ?? timestamp,
          updatedAt: timestamp,
          revision: (current?.revision ?? 0) + 1,
          originalSize: original.size,
          documentSize: prepared.document.size,
        };
        files.put({ id, original, document: prepared.document });
        sheets.put(record);
        result(metadata(record));
      };
      if (current) {
        read(files.get(id), (stored) => {
          if (!(stored?.original instanceof Blob))
            throw problem(
              "SHEET_DAMAGED",
              "The saved original PDF is unavailable. Save your edited PDF as a new sheet instead.",
            );
          finish(stored.original);
        });
      } else finish(prepared.original);
    });
  });
}

export async function deleteSheet(id, expectedRevision) {
  validateId(id);
  validateRevision(expectedRevision);
  return transaction([METADATA, FILES], "readwrite", (tx, result, read) => {
    read(tx.objectStore(METADATA).get(id), (current) => {
      if (!current)
        throw problem(
          "SHEET_NOT_FOUND",
          "This saved sheet has already been removed.",
        );
      if (current.revision !== expectedRevision)
        throw problem(
          "STALE_REVISION",
          "Another tab saved a newer version. Reopen the saved sheet before removing it; nothing was deleted.",
        );
      tx.objectStore(FILES).delete(id);
      tx.objectStore(METADATA).delete(id);
      result(true);
    });
  });
}
