import { filename } from "./model.mjs";
import { textLines } from "./parser.mjs";
export const MAX_BYTES = 15 * 1024 * 1024;
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
          const text = await page.getTextContent();
          const annotations = await page.getAnnotations({ intent: "display" });
          // Read text widgets only. Never render annotation links, JavaScript, XFA or attachments.
          const widgets = annotations
            .filter(
              (a) =>
                a.subtype === "Widget" &&
                ["Tx", "Ch"].includes(a.fieldType) &&
                typeof a.fieldValue === "string",
            )
            .map((a) => ({
              name: a.fieldName,
              value: a.fieldValue,
              rect: a.rect,
            }));
          let lines = textLines(text.items),
            method = "text";
          if (
            lines.reduce((n, l) => n + l.text.length, 0) < 100 &&
            widgets.reduce((n, w) => n + w.value.length, 0) < 80
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
              const result = await ocr.recognize(canvas);
              lines = result.data.text.split("\n").map((text) => ({ text }));
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
          if (total > 200000)
            throw Error(
              "The extracted text exceeds the safe processing limit. Use a character-only export.",
            );
          pages.push({ page: n, lines, widgets, method });
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
