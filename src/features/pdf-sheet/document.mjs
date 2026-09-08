import {
  PDFDocument,
  PDFDict,
  PDFArray,
  PDFName,
  PDFHexString,
  PDFTextField,
  PDFDropdown,
  PDFOptionList,
  PDFCheckBox,
  PDFRadioGroup,
  PDFSignature,
  StandardFonts,
  rgb,
} from "pdf-lib";

export const MAX_BYTES = 15 * 1024 * 1024;
const MAX_PAGES = 20,
  MAX_FIELDS = 2500,
  MAX_PIXELS = 8000000;
const clean = (v, limit = 12000) =>
  String(v ?? "")
    .normalize("NFKC")
    .replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,
      "",
    )
    .slice(0, limit);
export const safeFilename = (name) =>
  (clean(name, 180)
    .replace(/[\\/:<>"|?*]/g, "_")
    .replace(/\.pdf$/i, "")
    .trim() || "character-sheet") + "-edited.pdf";
const rect = (r) => [
  Math.min(r[0], r[2]),
  Math.min(r[1], r[3]),
  Math.max(r[0], r[2]),
  Math.max(r[1], r[3]),
];
const name = (key) => PDFName.of(key);
const cssColor = (value) =>
  value?.length === 3 ? `rgb(${Array.from(value).join(", ")})` : null;
const dict = (doc, ref) => doc.context.lookup(ref, PDFDict);
const readName = (d) => d.lookup(name("T"))?.decodeText?.() ?? "";
const checkSignal = (signal) => {
  if (signal?.aborted)
    throw Error("PDF operation cancelled. Your original file is unchanged.");
};

// Annotation storage is a rendering cache, not the authoritative edit journal.
// Replay validated user changes into the canonical fields before export, then
// rebuild appearances and remove stale per-widget copies of inherited values.
export function applyFieldEdits(doc, edits, font) {
  const form = doc.getForm();
  for (const edit of edits) {
    const field = form.getField(edit.name),
      acro = field.acroField;
    if (edit.type === "text") {
      field.setText(edit.value);
      field.defaultUpdateAppearances(font);
    } else if (edit.type === "choice") {
      const values =
        edit.value === ""
          ? []
          : Array.isArray(edit.value)
            ? edit.value
            : [edit.value];
      const displays = values.map(
        (v) => edit.options.find((o) => o.value === v)?.label ?? v,
      );
      // pdf-lib's appearance provider uses display labels; the PDF value must
      // still be the export value when /Opt contains label/value pairs.
      acro.dict.delete(name("I"));
      acro.dict.set(
        name("V"),
        doc.context.obj(displays.map((v) => PDFHexString.fromText(v))),
      );
      field.defaultUpdateAppearances(font);
      if (!values.length) acro.dict.delete(name("V"));
      else
        acro.dict.set(
          name("V"),
          values.length === 1
            ? PDFHexString.fromText(values[0])
            : doc.context.obj(values.map((v) => PDFHexString.fromText(v))),
        );
      if (values.length > 1)
        acro.dict.set(
          name("I"),
          doc.context.obj(
            values
              .map((v) => edit.options.findIndex((o) => o.value === v))
              .sort((a, b) => a - b),
          ),
        );
    } else if (edit.type === "checkbox" || edit.type === "radio") {
      const selected =
        edit.type === "checkbox"
          ? edit.value
            ? edit.exportValue
            : "Off"
          : edit.value;
      acro.dict.set(name("V"), name(selected));
      for (const widget of acro.getWidgets())
        widget.setAppearanceState(
          widget.getOnValue()?.toString() === name(selected).toString()
            ? name(selected)
            : name("Off"),
        );
    }
    for (const widget of acro.getWidgets()) {
      if (widget.dict !== acro.dict) {
        widget.dict.delete(name("V"));
        widget.dict.delete(name("I"));
      }
    }
  }
}

async function bounded(
  work,
  { signal, timeout = 120000, cancel = () => {} } = {},
) {
  checkSignal(signal);
  let timer, abort;
  const interruption = new Promise((_, reject) => {
    abort = () => {
      cancel();
      reject(
        Error("PDF operation cancelled. Your original file is unchanged."),
      );
    };
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => {
      cancel();
      reject(Error("PDF processing timed out. Try a smaller sheet."));
    }, timeout);
  });
  try {
    return await Promise.race([work(), interruption]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

async function pdfEngine() {
  if (typeof window === "undefined")
    return import("pdfjs-dist/legacy/build/pdf.mjs");
  const engine = await import("pdfjs-dist");
  engine.GlobalWorkerOptions.workerSrc = (
    await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ).default;
  return engine;
}

function stripActions(doc) {
  doc.catalog.delete(name("OpenAction"));
  const names = doc.catalog.lookupMaybe(name("Names"), PDFDict);
  names?.delete(name("JavaScript"));
  names?.delete(name("EmbeddedFiles"));
  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFDict)) continue;
    object.delete(name("AA"));
    const subtype = object.lookup(name("Subtype"))?.toString();
    if (subtype === "/Widget" || subtype === "/Link") object.delete(name("A"));
  }
}

// Repair only page widgets genuinely absent from the canonical field tree.
// Independent duplicate roots get unique names instead of becoming one field.
async function prepareDocument(bytes) {
  const doc = await PDFDocument.load(bytes, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  if (doc.getPageCount() > MAX_PAGES)
    throw Error("Use a PDF with no more than 20 pages.");
  const warnings = [],
    seen = new Set(),
    roots = new Set(),
    rootNames = new Set();
  let formDict = doc.catalog.lookupMaybe(name("AcroForm"), PDFDict);
  if (formDict?.has(name("XFA")))
    throw Error(
      "XFA-only/dynamic forms are not supported. Export a standard PDF first.",
    );
  if (!formDict) {
    formDict = doc.context.obj({ Fields: [] });
    doc.catalog.set(name("AcroForm"), doc.context.register(formDict));
  }
  let fields = formDict.lookupMaybe(name("Fields"), PDFArray);
  if (!fields) {
    fields = doc.context.obj([]);
    formDict.set(name("Fields"), fields);
  }
  const visit = (ref, parents = new Set()) => {
    if (parents.has(String(ref)) || parents.size > 64)
      throw Error("This PDF has a malformed form hierarchy.");
    if (seen.has(String(ref))) return;
    seen.add(String(ref));
    if (seen.size > MAX_FIELDS * 3)
      throw Error("This PDF has too many form objects.");
    const d = dict(doc, ref),
      children = d.lookupMaybe(name("Kids"), PDFArray);
    const next = new Set([...parents, String(ref)]);
    for (let i = 0; i < (children?.size() ?? 0); i++)
      visit(children.get(i), next);
  };
  for (let i = 0; i < fields.size(); i++) {
    const ref = fields.get(i);
    roots.add(String(ref));
    rootNames.add(readName(dict(doc, ref)));
    visit(ref);
  }
  let repaired = 0;
  for (const page of doc.getPages()) {
    const annotations = page.node.Annots();
    if ((annotations?.size() ?? 0) > MAX_FIELDS)
      throw Error("This PDF has too many fields on one page.");
    for (let i = 0; i < (annotations?.size() ?? 0); i++) {
      let ref = annotations.get(i),
        d = dict(doc, ref);
      if (
        d.lookup(name("Subtype"))?.toString() !== "/Widget" ||
        seen.has(String(ref))
      )
        continue;
      const chain = new Set();
      while (d.has(name("Parent"))) {
        if (chain.has(String(ref)) || chain.size > 64)
          throw Error("This PDF has a malformed widget hierarchy.");
        chain.add(String(ref));
        ref = d.get(name("Parent"));
        d = dict(doc, ref);
      }
      if (roots.has(String(ref))) continue;
      const original = readName(d) || "UnnamedField";
      let unique = original;
      if (rootNames.has(unique))
        unique = `${original}__sheet_${String(ref).replace(/\W/g, "_")}`;
      d.set(name("T"), PDFHexString.fromText(unique));
      if (!d.has(name("TU")))
        d.set(name("TU"), PDFHexString.fromText(original));
      rootNames.add(unique);
      fields.push(ref);
      roots.add(String(ref));
      visit(ref);
      repaired++;
    }
  }
  const form = doc.getForm(),
    all = form.getFields();
  if (all.length > MAX_FIELDS)
    throw Error("This PDF exceeds the 2,500-field limit.");
  const hasSignatures = all.some((f) => f instanceof PDFSignature);
  if (hasSignatures)
    warnings.push(
      "Signature fields are read-only. Exporting this document is blocked to avoid invalidating signatures.",
    );
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const field of all) {
    if (field instanceof PDFSignature) continue;
    // Some orphan exports contain literal line breaks but omit the multiline
    // flag. Preserve their displayed line structure when rebuilding appearances.
    if (
      field.needsAppearancesUpdate() &&
      field instanceof PDFTextField &&
      /[\r\n]/.test(field.getText() ?? "") &&
      !field.isMultiline()
    )
      field.enableMultiline();
    if (field.needsAppearancesUpdate()) {
      try {
        field.defaultUpdateAppearances(font);
      } catch {
        throw Error(
          "A form field needs an unsupported font/appearance. Use a standard Latin-script export or a PDF editor with its original fonts.",
        );
      }
    }
  }
  if (repaired)
    warnings.push(
      `Recovered ${repaired} editable form field roots from page widgets. Independent duplicate names were kept separate.`,
    );
  stripActions(doc);
  const normalized = await doc.save({
    updateFieldAppearances: false,
    useObjectStreams: false,
  });
  if (normalized.length > MAX_BYTES)
    throw Error("The editable PDF exceeds 15 MB after preparing its forms.");
  // A separate, local display copy omits editable widget appearances only.
  // Keep the canonical document intact for native values and export. Disabling
  // all annotations loses signatures/read-only fields; ENABLE_FORMS still paints
  // buttons and can omit read-only choices in PDF.js 6.
  const editableWidgets = new Set();
  if (!hasSignatures)
    for (const field of all) {
      if (
        ![
          PDFTextField,
          PDFDropdown,
          PDFOptionList,
          PDFCheckBox,
          PDFRadioGroup,
        ].some((type) => field instanceof type)
      )
        continue;
      for (const widget of field.acroField.getWidgets()) {
        const localFlags = widget.dict.lookup(name("Ff"))?.asNumber?.(),
          flags = Number.isInteger(localFlags)
            ? localFlags
            : field.acroField.getFlags();
        // A child widget can override inherited field flags. Password fields
        // stay read-only here rather than exposing their value in a text input.
        if (!(flags & (1 | 8192))) editableWidgets.add(widget.dict);
      }
    }
  for (const page of doc.getPages()) {
    const annotations = page.node.Annots();
    if (!annotations) continue;
    const kept = [];
    for (let i = 0; i < annotations.size(); i++) {
      const ref = annotations.get(i);
      if (!editableWidgets.has(dict(doc, ref))) kept.push(ref);
    }
    page.node.set(name("Annots"), doc.context.obj(kept));
  }
  const displayBytes = await doc.save({
    updateFieldAppearances: false,
    useObjectStreams: false,
  });
  if (displayBytes.length > MAX_BYTES)
    throw Error("The PDF display copy exceeds 15 MB.");
  return { bytes: normalized, displayBytes, warnings, hasSignatures, font };
}

export async function openPdfSheet(
  file,
  { signal, onProgress = () => {}, timeout = 120000 } = {},
) {
  if (
    !file ||
    !Number.isFinite(file.size) ||
    file.size < 5 ||
    file.size > MAX_BYTES
  )
    throw Error("Choose a non-empty PDF up to 15 MB.");
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...header) !== "%PDF-")
    throw Error("This file is not a PDF. Renaming a file does not convert it.");
  let task,
    displayTask,
    dead = false;
  const cancel = () => {
    dead = true;
    if (task) void task.destroy().catch(() => {});
    if (displayTask) void displayTask.destroy().catch(() => {});
  };
  return bounded(
    async () => {
      try {
        onProgress("Preparing editable PDF fields on this device…");
        const prepared = await prepareDocument(
          new Uint8Array(await file.arrayBuffer()),
        );
        checkSignal(signal);
        if (dead) throw Error("PDF opening cancelled.");
        const engine = await pdfEngine();
        const engineOptions = {
          isEvalSupported: false,
          enableXfa: false,
          stopAtErrors: true,
          verbosity: 0,
          useSystemFonts: false,
          cMapUrl: "/character-import/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/character-import/standard_fonts/",
          wasmUrl: "/character-import/wasm/",
          maxImageSize: 16000000,
          canvasMaxAreaInBytes: 32000000,
          isOffscreenCanvasSupported: false,
        };
        task = engine.getDocument({ data: prepared.bytes, ...engineOptions });
        task.onPassword = () => {
          void task.destroy().catch(() => {});
        };
        let displayPdf;
        const pdf = await task.promise,
          pages = [],
          allFields = [],
          additions = [],
          renders = new Set(),
          edits = new Map();
        const alive = () => {
          if (dead)
            throw Error("This PDF session is closed. Reopen your file.");
        };
        for (let number = 1; number <= pdf.numPages; number++) {
          checkSignal(signal);
          alive();
          onProgress(`Reading page ${number} of ${pdf.numPages}…`);
          const page = await pdf.getPage(number),
            viewport = page.getViewport({ scale: 1 });
          if (
            ![viewport.width, viewport.height].every(
              (n) => Number.isFinite(n) && n > 0 && n <= 20000,
            )
          )
            throw Error("This PDF has unsupported page dimensions.");
          const fields = (await page.getAnnotations({ intent: "display" }))
            .filter((a) => a.subtype === "Widget" && !a.hidden)
            .map((a) => {
              const type =
                a.fieldType === "Tx"
                  ? "text"
                  : a.fieldType === "Ch"
                    ? "choice"
                    : a.checkBox
                      ? "checkbox"
                      : a.radioButton
                        ? "radio"
                        : "unsupported";
              const exportValue = a.buttonValue ?? a.exportValue ?? "Yes";
              return {
                id: a.id,
                name: a.fieldName,
                label: a.alternativeText || a.fieldName,
                page: number,
                type,
                rect: rect(a.rect),
                value:
                  type === "checkbox"
                    ? a.fieldValue === exportValue
                    : type === "radio"
                      ? (a.fieldValue ?? "Off")
                      : a.multiSelect
                        ? (a.fieldValue ?? [])
                        : Array.isArray(a.fieldValue)
                          ? (a.fieldValue[0] ?? "")
                          : (a.fieldValue ?? ""),
                options: (a.options ?? []).map((o) => ({
                  label: o.displayValue,
                  value: o.exportValue,
                })),
                readOnly:
                  prepared.hasSignatures ||
                  a.readOnly ||
                  a.password ||
                  type === "unsupported",
                multiline: Boolean(a.multiLine),
                multiSelect: Boolean(a.multiSelect),
                maxLength: a.maxLen ?? 12000,
                exportValue,
                fontSize: a.defaultAppearanceData?.fontSize || 12,
                background: cssColor(a.backgroundColor),
                textColor:
                  cssColor(a.defaultAppearanceData?.fontColor) ??
                  "rgb(0, 0, 0)",
                textAlign:
                  ["left", "center", "right"][a.textAlignment] ?? "left",
              };
            });
          allFields.push(...fields);
          if (allFields.length > MAX_FIELDS)
            throw Error("This PDF exceeds the 2,500-field limit.");
          pages.push({
            number,
            width: viewport.width,
            height: viewport.height,
            rotation: page.rotate,
            fields,
            toDisplayRect: (r) =>
              rect([
                ...viewport.convertToViewportPoint(r[0], r[1]),
                ...viewport.convertToViewportPoint(r[2], r[3]),
              ]),
            toPdfRect: (r) =>
              rect([
                ...viewport.convertToPdfPoint(r[0], r[1]),
                ...viewport.convertToPdfPoint(r[2], r[3]),
              ]),
            _page: page,
          });
        }
        const latin = (text) => {
          try {
            prepared.font.encodeText(text.replace(/[\r\n\t]/g, " "));
          } catch {
            throw Error(
              "This editor currently supports Latin-script text and common punctuation. Use a supported character instead; nothing was changed.",
            );
          }
        };
        const validateText = (text, limit = 12000) => {
          if (String(text ?? "").length > limit)
            throw Error(`Keep this field to ${limit} characters or fewer.`);
          const result = clean(text, limit);
          latin(result);
          return result;
        };
        const getPage = (n) => {
          const p = pages[n - 1];
          if (!p) throw Error("Page not found.");
          return p;
        };
        const validateAddition = (addition) => {
          const p = getPage(addition.page),
            numbers = [
              addition.x,
              addition.y,
              addition.width,
              addition.height,
              addition.fontSize ?? 12,
            ];
          if (
            !numbers.every(Number.isFinite) ||
            addition.width < 4 ||
            addition.height < 4 ||
            addition.fontSize < 4 ||
            addition.fontSize > 72
          )
            throw Error("Choose a valid text box and font size (4–72 pt).");
          const display = p.toDisplayRect([
            addition.x,
            addition.y,
            addition.x + addition.width,
            addition.y + addition.height,
          ]);
          if (
            display[0] < -0.1 ||
            display[1] < -0.1 ||
            display[2] > p.width + 0.1 ||
            display[3] > p.height + 0.1
          )
            throw Error("Keep the text box inside the page.");
          return {
            ...addition,
            text: validateText(addition.text),
            cover: Boolean(addition.cover),
            fontSize: addition.fontSize ?? 12,
          };
        };
        return {
          pages,
          fields: allFields,
          warnings: prepared.warnings,
          filename: safeFilename(file.name),
          get additions() {
            return additions.map((a) => ({ ...a }));
          },
          async renderPage(
            number,
            canvas,
            { scale = 1, signal: renderSignal } = {},
          ) {
            alive();
            if (!Number.isFinite(scale) || scale <= 0)
              throw Error("Choose a valid positive zoom level.");
            const p = getPage(number);
            const actualScale = Math.min(
              Math.max(0.1, scale),
              Math.sqrt(MAX_PIXELS / (p.width * p.height)),
            );
            const viewport = p._page.getViewport({ scale: actualScale });
            canvas.width = Math.max(1, Math.floor(viewport.width));
            canvas.height = Math.max(1, Math.floor(viewport.height));
            const renderedScale = canvas.width / p.width;
            if (!displayTask)
              displayTask = engine.getDocument({
                data: prepared.displayBytes,
                ...engineOptions,
              });
            displayPdf ??= await bounded(() => displayTask.promise, {
              signal: renderSignal,
              timeout,
            });
            const displayPage = await bounded(
              () => displayPdf.getPage(number),
              {
                signal: renderSignal,
                timeout,
              },
            );
            alive();
            checkSignal(renderSignal);
            const render = displayPage.render({
              canvas,
              canvasContext: canvas.getContext("2d"),
              viewport: p._page.getViewport({ scale: renderedScale }),
              annotationMode: engine.AnnotationMode.ENABLE,
            });
            renders.add(render);
            try {
              await bounded(() => render.promise, {
                signal: renderSignal,
                timeout,
                cancel: () => render.cancel(),
              });
            } finally {
              renders.delete(render);
            }
            return {
              width: canvas.width,
              height: canvas.height,
              scale: renderedScale,
            };
          },
          updateField(id, next) {
            alive();
            const field = allFields.find((f) => f.id === id);
            if (!field || field.readOnly)
              throw Error("This field is read-only or unsupported.");
            let value;
            if (field.type === "checkbox") {
              if (typeof next !== "boolean")
                throw Error("Choose checked or unchecked.");
              value = next;
            } else if (field.type === "radio") {
              value =
                next === true
                  ? field.exportValue
                  : next === false
                    ? "Off"
                    : String(next);
              if (
                value !== "Off" &&
                !allFields.some(
                  (f) => f.name === field.name && f.exportValue === value,
                )
              )
                throw Error("Choose an available radio option.");
            } else if (field.type === "choice") {
              const values =
                next === "" || next === null
                  ? []
                  : Array.isArray(next)
                    ? next
                    : [next];
              if (
                (!field.multiSelect && values.length > 1) ||
                values.some((v) => !field.options.some((o) => o.value === v))
              )
                throw Error("Choose an available field option.");
              value = field.multiSelect ? [...values] : (values[0] ?? "");
              for (const v of values)
                latin(field.options.find((o) => o.value === v)?.label ?? v);
            } else
              value = validateText(
                next,
                Math.min(field.maxLength || 12000, 12000),
              );
            for (const peer of allFields.filter(
              (f) => f.name === field.name && f.type === field.type,
            )) {
              peer.value =
                field.type === "checkbox"
                  ? value && peer.exportValue === field.exportValue
                  : value;
              pdf.annotationStorage.setValue(peer.id, {
                value:
                  field.type === "radio"
                    ? peer.exportValue === value
                    : field.type === "choice" && peer.value === ""
                      ? []
                      : peer.value,
              });
            }
            edits.set(field.name, { ...field, value: structuredClone(value) });
          },
          addText(options) {
            alive();
            if (prepared.hasSignatures)
              throw Error("Signed PDFs cannot be edited here.");
            if (additions.length >= 200)
              throw Error("Use no more than 200 added text boxes.");
            const addition = validateAddition({
              fontSize: 12,
              cover: false,
              ...options,
              id: crypto.randomUUID().replaceAll("-", "_"),
            });
            additions.push(addition);
            return addition.id;
          },
          updateText(id, patch) {
            alive();
            const i = additions.findIndex((a) => a.id === id);
            if (i < 0) throw Error("Text box not found.");
            additions[i] = validateAddition({ ...additions[i], ...patch, id });
          },
          removeText(id) {
            alive();
            const i = additions.findIndex((a) => a.id === id);
            if (i >= 0) additions.splice(i, 1);
          },
          async exportPdf({
            signal: exportSignal,
            onProgress: progress = () => {},
          } = {}) {
            alive();
            if (prepared.hasSignatures)
              throw Error(
                "Export is disabled for signature PDFs because changes would invalidate the signature. Keep the original file.",
              );
            return bounded(
              async () => {
                progress("Saving editable form values…");
                const saved = await pdf.saveDocument();
                checkSignal(exportSignal);
                alive();
                const doc = await PDFDocument.load(saved, {
                    updateMetadata: false,
                  }),
                  form = doc.getForm();
                const font = await doc.embedFont(StandardFonts.Helvetica);
                applyFieldEdits(doc, edits.values(), font);
                // PDF.js may treat an empty choice appearance as a no-op. Explicitly
                // clear V/I and rebuild its blank appearance so the old selection
                // cannot survive a successful-looking export.
                for (const descriptor of allFields) {
                  if (
                    descriptor.type !== "choice" ||
                    (descriptor.value !== "" &&
                      !(
                        Array.isArray(descriptor.value) &&
                        !descriptor.value.length
                      ))
                  )
                    continue;
                  const choice = form.getFieldMaybe(descriptor.name);
                  if (choice?.clear) {
                    choice.clear();
                    choice.defaultUpdateAppearances(font);
                  }
                }
                for (const addition of additions) {
                  checkSignal(exportSignal);
                  alive();
                  const p = doc.getPage(addition.page - 1),
                    field = form.createTextField(
                      `WizardSheetText_${addition.id}`,
                    );
                  field.enableMultiline();
                  field.setText(addition.text);
                  field.addToPage(p, {
                    x: addition.x,
                    y: addition.y,
                    width: addition.width,
                    height: addition.height,
                    borderWidth: 0,
                    borderColor: undefined,
                    backgroundColor: addition.cover ? rgb(1, 1, 1) : undefined,
                    textColor: rgb(0, 0, 0),
                    font,
                  });
                  field.setFontSize(addition.fontSize);
                  field.acroField
                    .getWidgets()[0]
                    .getOrCreateAppearanceCharacteristics()
                    .setRotation(getPage(addition.page).rotation);
                  field.updateAppearances(font);
                }
                stripActions(doc);
                const output = await doc.save({
                  updateFieldAppearances: false,
                });
                if (output.length > MAX_BYTES)
                  throw Error(
                    "The edited PDF exceeds 15 MB. Remove some additions before exporting.",
                  );
                checkSignal(exportSignal);
                progress("Editable PDF ready.");
                return new Blob([output], { type: "application/pdf" });
              },
              { signal: exportSignal, timeout },
            );
          },
          async destroy() {
            if (dead) return;
            dead = true;
            for (const render of renders) render.cancel();
            additions.length = 0;
            edits.clear();
            await Promise.all([task.destroy(), displayTask?.destroy()]);
          },
        };
      } catch (e) {
        cancel();
        if (/encrypt|password/i.test(e.message))
          throw Error(
            "Password-protected PDFs are not supported. Export an unlocked copy first.",
          );
        throw e;
      }
    },
    { signal, timeout, cancel },
  );
}
