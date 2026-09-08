import { clean, filename } from "./model.mjs";
import { textLines } from "./parser.mjs";
export const MAX_BYTES = 15 * 1024 * 1024;
export const MAX_TEXT = 200000;
const processingLimit = () =>
  Error(
    "The extracted text exceeds the safe processing limit. Use a character-only export.",
  );

export function readableWidgets(annotations) {
  if (annotations.length > 10000) throw processingLimit();
  let total = 0;
  return annotations.flatMap((a) => {
    // Only values of text/choice widgets are data. Links, actions, attachments
    // and ambiguous checkbox export values are never activated or interpreted.
    if (a?.subtype !== "Widget" || !["Tx", "Ch"].includes(a.fieldType))
      return [];
    const value =
      typeof a.fieldValue === "string"
        ? a.fieldValue
        : a.fieldType === "Ch" &&
            Array.isArray(a.fieldValue) &&
            a.fieldValue.every((v) => typeof v === "string")
          ? a.fieldValue.join("\n")
          : null;
    if (value === null) return [];
    const name = typeof a.fieldName === "string" ? clean(a.fieldName, 300) : "";
    if (!name) return [];
    if (value.length > MAX_TEXT) throw processingLimit();
    total += name.length + value.length;
    if (total > MAX_TEXT) throw processingLimit();
    return [{ name, value: clean(value, MAX_TEXT), rect: a.rect }];
  });
}

export async function readPageContent(page, pageNumber) {
  const [text, annotations] = await Promise.allSettled([
    Promise.resolve().then(() => page.getTextContent()),
    Promise.resolve().then(() => page.getAnnotations({ intent: "display" })),
  ]);
  const warnings = [];
  const items =
    text.status === "fulfilled" && Array.isArray(text.value?.items)
      ? text.value.items
      : [];
  const textFailed =
    text.status === "rejected" || !Array.isArray(text.value?.items);
  if (textFailed)
    warnings.push(
      `Page ${pageNumber}: selectable text could not be read. Local OCR was requested; review this page carefully.`,
    );
  if (annotations.status === "rejected")
    warnings.push(
      `Page ${pageNumber}: form fields could not be read. Text/OCR readings remain available; check the original form values.`,
    );
  // Apply bounds before grouping text geometry, not only after allocating and
  // processing an arbitrarily large decoded content stream.
  if (items.length > 10000) throw processingLimit();
  const rawLength = items.reduce(
    (n, item) => n + (typeof item?.str === "string" ? item.str.length : 0),
    0,
  );
  if (rawLength > MAX_TEXT) throw processingLimit();
  const widgets = readableWidgets(
    annotations.status === "fulfilled" && Array.isArray(annotations.value)
      ? annotations.value
      : [],
  );
  if (
    rawLength +
      widgets.reduce((n, w) => n + w.name.length + w.value.length, 0) >
    MAX_TEXT
  )
    throw processingLimit();
  return {
    lines: textLines(items).map((line) => ({ ...line, method: "text" })),
    widgets,
    warnings,
    textFailed,
  };
}

export function mergeOCRLines(embedded, recognized) {
  if (recognized.length > MAX_TEXT) throw processingLimit();
  const seen = new Set(embedded.map((line) => clean(line.text)));
  return [
    ...embedded,
    ...recognized
      .split("\n")
      .map((text) => clean(text))
      .filter((text) => text && !seen.has(text))
      .map((text) => ({ text, method: "ocr" })),
  ];
}
export async function validateFile(file) {
  if (!file || file.size === 0 || file.size > MAX_BYTES)
    throw Error("Choose a non-empty PDF smaller than 15 MB.");
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-")
    throw Error(
      "This file is not a PDF. Renaming another file to .pdf does not convert it.",
    );
}
export async function extractPDF(
  file,
  { signal, onProgress = () => {}, timeout = 120000 } = {},
) {
  await validateFile(file);
  let task, ocr, render;
  const pages = [];
  let total = 0,
    finished = false,
    stopped = false;
  const cancelled = () => {
    if (signal?.aborted || stopped)
      throw Error(
        "Import cancelled. You can choose another file or enter the character manually.",
      );
  };
  const cleanup = async () => {
    render?.cancel();
    const pending = [];
    if (ocr) pending.push(ocr.terminate().catch(() => {}));
    if (task) pending.push(task.destroy().catch(() => {}));
    await Promise.race([
      Promise.all(pending),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
  };
  let timer, abort;
  const abortPromise = new Promise((_, reject) => {
    abort = () => {
      stopped = true;
      cleanup();
      reject(Error("Import cancelled. Manual entry is still available."));
    };
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => {
      stopped = true;
      cleanup();
      reject(
        Error(
          "Extraction timed out. Try a smaller export, or continue with manual entry.",
        ),
      );
    }, timeout);
  });
  try {
    const result = await Promise.race([
      abortPromise,
      (async () => {
        cancelled();
        onProgress("Checking PDF…");
        const [pdfjs, buffer] = await Promise.all([
          import("pdfjs-dist"),
          file.arrayBuffer(),
        ]);
        const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
          .default;
        cancelled();
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const sha256 = [
          ...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
        ]
          .map((n) => n.toString(16).padStart(2, "0"))
          .join("");
        cancelled();
        task = pdfjs.getDocument({
          data: new Uint8Array(buffer),
          isEvalSupported: false,
          enableXfa: false,
          stopAtErrors: true,
          verbosity: 0,
          maxImageSize: 16000000,
          canvasMaxAreaInBytes: 16000000,
          useSystemFonts: false,
          cMapUrl: "/character-import/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/character-import/standard_fonts/",
          wasmUrl: "/character-import/wasm/",
          isOffscreenCanvasSupported: false,
        });
        task.onPassword = () => {
          task.destroy();
        };
        const pdf = await task.promise;
        cancelled();
        if (pdf.numPages > 20)
          throw Error(
            "This PDF exceeds the 20-page limit. Export only the character sheet and spell pages.",
          );
        for (let n = 1; n <= pdf.numPages; n++) {
          cancelled();
          onProgress(`Reading page ${n} of ${pdf.numPages}…`);
          const page = await pdf.getPage(n);
          const content = await readPageContent(page, n);
          const { widgets, warnings } = content;
          let lines = content.lines,
            method = "text";
          if (
            content.textFailed ||
            (lines.reduce((n, l) => n + l.text.length, 0) < 100 &&
              widgets.reduce((n, w) => n + w.value.length, 0) < 80)
          ) {
            onProgress(
              `Reading scanned page ${n} of ${pdf.numPages} on this device…`,
            );
            if (!ocr) {
              const { createWorker } = await import("tesseract.js");
              cancelled();
              ocr = await createWorker(
                "eng",
                1,
                {
                  workerPath: "/character-import/worker.min.js",
                  corePath: "/character-import",
                  langPath: "/character-import",
                  workerBlobURL: false,
                  cacheMethod: "none",
                  logger: () => {},
                },
                { load_system_dawg: "0", load_freq_dawg: "0" },
              );
              if (stopped || signal?.aborted) {
                await ocr.terminate();
                cancelled();
              }
            }
            const base = page.getViewport({ scale: 1 });
            const scale = Math.min(
              2.2,
              Math.sqrt(3000000 / (base.width * base.height)),
            );
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            try {
              render = page.render({
                canvas,
                canvasContext: canvas.getContext("2d"),
                viewport,
              });
              await render.promise;
              cancelled();
              const result = await ocr.recognize(canvas);
              lines = mergeOCRLines(lines, result.data.text);
              method = "ocr";
            } finally {
              canvas.width = 0;
              canvas.height = 0;
              render = null;
            }
          }
          cancelled();
          total +=
            lines.reduce((n, l) => n + l.text.length, 0) +
            widgets.reduce((n, w) => n + w.name.length + w.value.length, 0);
          if (total > MAX_TEXT) throw processingLimit();
          pages.push({ page: n, lines, widgets, method, warnings });
          page.cleanup();
        }
        return {
          pages,
          source: {
            type: "ddb_pdf",
            filename: filename(file.name),
            sha256,
            page_count: pdf.numPages,
            methods: [
              ...new Set(
                pages.flatMap((p) => [
                  p.method,
                  ...p.lines.map((line) => line.method),
                  ...(p.widgets.length ? ["acroform"] : []),
                ]),
              ),
            ],
            retained: false,
          },
        };
      })(),
    ]);
    finished = true;
    return result;
  } catch (error) {
    if (/password|destroyed/i.test(String(error?.message)) && !signal?.aborted)
      throw Error(
        "The PDF is password-protected or could not be opened. Export an unlocked copy, or use manual entry.",
      );
    if (
      /invalid pdf|invalidpdf|missingpdf|xref|formaterror/i.test(
        String(error?.message),
      )
    )
      throw Error(
        "This PDF is corrupt or unsupported. Export a fresh copy from D&D Beyond, or enter the character manually.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    await cleanup();
    if (!finished) pages.length = 0;
  }
}
