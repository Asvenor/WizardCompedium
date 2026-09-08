import { openPdfSheet } from "./document.mjs";
import {
  listSheets,
  readSheet,
  saveSheet,
  deleteSheet,
  sanitizeSheetName,
} from "./storage.mjs";

const $ = (id) => document.getElementById(id);
const el = (tag, text = "", attrs = {}) => {
  const node = document.createElement(tag);
  node.textContent = text;
  for (const [key, value] of Object.entries(attrs))
    node.setAttribute(key, String(value));
  return node;
};
let session = null,
  original = null,
  saved = null,
  pageNumber = 1,
  scale = 1;
let busy = false,
  controller = null,
  renderController = null,
  renderVersion = 0;
let editVersion = 0,
  savedVersion = 0,
  mode = null,
  selected = null;
const additions = new Map();
const page = () => session?.pages[pageNumber - 1];
// Browsers cannot confirm whether the user completed or cancelled a download.
const unsaved = () => editVersion > savedVersion;
const message = (text) => {
  $("sheet-status").textContent = text;
};
function error(e) {
  $("sheet-error").textContent = e?.message || String(e);
  $("sheet-error").hidden = false;
  $("sheet-error").focus();
}
function clearError() {
  $("sheet-error").hidden = true;
}
function lock(on, opening = false) {
  busy = on;
  $("pdf-file").disabled = on;
  $("pdf-editor").inert = on;
  $("saved-sheets").inert = on;
  $("pdf-sheet").setAttribute("aria-busy", String(on));
  $("sheet-loading").hidden = !on;
  $("sheet-cancel").hidden = !opening;
}
function updateSaveState() {
  $("sheet-save-state").textContent = saved
    ? `Local revision ${saved.revision}${editVersion > savedVersion ? " · changes not saved locally" : " · saved in this browser"}`
    : "Not saved in this browser";
}
function changed() {
  editVersion++;
  updateSaveState();
}
function mayReplace() {
  return (
    !unsaved() ||
    window.confirm(
      "Your latest edits are not saved in this browser. Make sure you kept an exported PDF before closing. Close this sheet? Your original and previously saved PDF are unchanged.",
    )
  );
}
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = el("a", "", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const fileName = (suffix = "") =>
  `${sanitizeSheetName($("sheet-title").value)}${suffix}.pdf`;
function positioned(node, rect) {
  const [left, top, right, bottom] = page().toDisplayRect(rect);
  Object.assign(node.style, {
    left: `${left * scale}px`,
    top: `${top * scale}px`,
    width: `${(right - left) * scale}px`,
    height: `${(bottom - top) * scale}px`,
  });
}
function setFieldValue(input, field) {
  if (field.type === "checkbox") input.checked = field.value === true;
  else if (field.type === "radio")
    input.checked = field.value === field.exportValue;
  else if (input.multiple)
    for (const option of input.options)
      option.selected = (
        Array.isArray(field.value) ? field.value : [field.value]
      ).includes(option.value);
  else input.value = field.value ?? "";
}
function syncFields() {
  for (const field of page().fields) {
    const input = [...$("pdf-fields").children].find(
      (node) => node.dataset.widgetId === field.id,
    );
    if (input && input !== document.activeElement) setFieldValue(input, field);
  }
}
function drawFields() {
  $("pdf-fields").replaceChildren();
  for (const field of page().fields) {
    if (field.readOnly || field.type === "unsupported") continue;
    let input;
    if (field.type === "choice") {
      input = el("select");
      input.multiple = Boolean(field.multiSelect);
      if (!input.multiple) input.append(el("option", "", { value: "" }));
      for (const option of field.options ?? [])
        input.append(el("option", option.label, { value: option.value }));
    } else {
      input = el(field.multiline ? "textarea" : "input");
      if (!field.multiline)
        input.type = ["checkbox", "radio"].includes(field.type)
          ? field.type
          : "text";
      if (field.type === "radio") input.name = `pdf-radio-${field.name}`;
      if (field.maxLength > 0)
        input.maxLength = Math.min(field.maxLength, 12000);
      else if (field.type === "text") input.maxLength = 12000;
    }
    input.className = "pdf-form-field";
    input.dataset.widgetId = field.id;
    input.dataset.fieldName = field.name;
    const label = field.name.startsWith("WizardSheetText_")
      ? `Added text ${page().fields.indexOf(field) + 1}`
      : field.label || field.name || "PDF field";
    input.setAttribute("aria-label", label);
    input.title = label;
    input.style.background = field.background || "transparent";
    input.style.color = field.textColor || "#10182a";
    input.style.textAlign = field.textAlign || "left";
    positioned(input, field.rect);
    input.style.fontSize = `${Math.max(6, Math.min(24, field.fontSize || Math.min(12, (field.rect[3] - field.rect[1]) * 0.65))) * scale}px`;
    setFieldValue(input, field);
    const update = () => {
      if (busy) return;
      try {
        let value = input.value;
        if (field.type === "checkbox") value = input.checked;
        else if (field.type === "radio") {
          if (!input.checked) return;
          value = field.exportValue;
        } else if (input.multiple)
          value = [...input.selectedOptions].map((option) => option.value);
        session.updateField(field.id, value);
        changed();
        syncFields();
        clearError();
      } catch (e) {
        setFieldValue(input, field);
        error(e);
      }
    };
    input.addEventListener(
      ["choice", "checkbox", "radio"].includes(field.type) ? "change" : "input",
      update,
    );
    $("pdf-fields").append(input);
  }
}
function drawAdditions() {
  $("pdf-additions").replaceChildren();
  for (const [id, item] of additions) {
    if (item.page !== pageNumber) continue;
    const node = el("button", item.text || "Type your text…", {
      type: "button",
      "data-overlay-id": id,
      "aria-label": `Edit added text: ${item.text || "empty text box"}`,
    });
    node.className = `sheet-added-text${item.cover ? " has-cover" : ""}${selected === id ? " is-selected" : ""}`;
    positioned(node, [
      item.x,
      item.y,
      item.x + item.width,
      item.y + item.height,
    ]);
    node.style.fontSize = `${item.fontSize * scale}px`;
    node.addEventListener("click", () => selectText(id));
    $("pdf-additions").append(node);
  }
}
async function renderPage() {
  if (!session) return;
  const version = ++renderVersion,
    current = session,
    number = pageNumber;
  renderController?.abort();
  renderController = new AbortController();
  $("sheet-viewport").setAttribute("aria-busy", "true");
  $("pdf-fields").inert = true;
  $("pdf-additions").inert = true;
  for (const input of $("pdf-fields").children) input.disabled = true;
  const fit =
    Math.max(
      180,
      $("sheet-viewport").clientWidth - (innerWidth <= 800 ? 16 : 34),
    ) / page().width;
  const requested =
    $("zoom-select").value === "fit" ? fit : Number($("zoom-select").value);
  try {
    const canvas = document.createElement("canvas");
    const result = await current.renderPage(number, canvas, {
      scale: requested,
      signal: renderController.signal,
    });
    if (version !== renderVersion || current !== session) return;
    scale = result.scale;
    const target = $("pdf-canvas");
    target.width = canvas.width;
    target.height = canvas.height;
    target.style.width = `${result.width}px`;
    target.style.height = `${result.height}px`;
    target.getContext("2d").drawImage(canvas, 0, 0);
    canvas.width = canvas.height = 0;
    Object.assign($("pdf-page").style, {
      width: `${result.width}px`,
      height: `${result.height}px`,
    });
    target.setAttribute(
      "aria-label",
      `Character sheet PDF page ${number} of ${session.pages.length}`,
    );
    $("page-select").value = String(number);
    $("page-prev").disabled = number === 1;
    $("page-next").disabled = number === session.pages.length;
    drawFields();
    drawAdditions();
  } catch (e) {
    if (version === renderVersion && !renderController.signal.aborted) error(e);
  } finally {
    if (version === renderVersion) {
      $("sheet-viewport").setAttribute("aria-busy", "false");
      $("pdf-fields").inert = false;
      $("pdf-additions").inert = false;
      for (const input of $("pdf-fields").children) input.disabled = false;
    }
  }
}
function setMode(next) {
  mode = next;
  $("text-placement").hidden = !mode;
  $("text-add").setAttribute("aria-pressed", String(mode === "add"));
  $("text-replace").setAttribute("aria-pressed", String(mode === "cover"));
  $("sheet-tool-help").textContent = mode
    ? "Click where your text should start, or focus the page and press Enter. You can adjust the box position and size afterwards. Press Escape to cancel."
    : "Click a highlighted field to change its value. Page controls and all fields also work with a keyboard.";
  if (mode) $("text-placement").focus({ preventScroll: true });
}
function selectText(id) {
  selected = id;
  const item = additions.get(id);
  $("text-properties").hidden = !item;
  if (!item) {
    drawAdditions();
    return;
  }
  const [left, top, right, bottom] = page().toDisplayRect([
    item.x,
    item.y,
    item.x + item.width,
    item.y + item.height,
  ]);
  for (const [key, value] of Object.entries({
    value: item.text,
    size: item.fontSize,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }))
    $("text-" + key).value = String(value);
  $("text-cover").checked = item.cover;
  drawAdditions();
  $("text-value").focus();
}
function placeText(left, top) {
  if (!mode || busy) return;
  try {
    const p = page(),
      width = Math.min(150, p.width - 12),
      height = 30;
    left = Math.max(0, Math.min(left, p.width - width));
    top = Math.max(0, Math.min(top, p.height - height));
    const [x1, y1, x2, y2] = p.toPdfRect([
      left,
      top,
      left + width,
      top + height,
    ]);
    const item = {
      page: pageNumber,
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
      text: "",
      fontSize: 12,
      cover: mode === "cover",
    };
    const id = session.addText(item);
    additions.set(id, item);
    changed();
    setMode(null);
    selectText(id);
  } catch (e) {
    error(e);
  }
}
function updateText() {
  if (!selected || busy) return;
  const item = additions.get(selected),
    p = page();
  try {
    const values = ["x", "y", "width", "height", "size"].map((key) =>
      Number($("text-" + key).value),
    );
    if (values.some((n) => !Number.isFinite(n)))
      throw Error("Use a number for text size and position.");
    let [left, top, width, height, fontSize] = values;
    width = Math.max(12, Math.min(p.width, width));
    height = Math.max(12, Math.min(p.height, height));
    left = Math.max(0, Math.min(p.width - width, left));
    top = Math.max(0, Math.min(p.height - height, top));
    const [x1, y1, x2, y2] = p.toPdfRect([
      left,
      top,
      left + width,
      top + height,
    ]);
    const next = {
      ...item,
      text: $("text-value").value,
      fontSize: Math.max(6, Math.min(48, fontSize)),
      cover: $("text-cover").checked,
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
    };
    session.updateText(selected, next);
    additions.set(selected, next);
    changed();
    drawAdditions();
    clearError();
  } catch (e) {
    selectText(selected);
    error(e);
  }
}
async function openFile(file, record = null, alreadyLocked = false) {
  if (!alreadyLocked && (busy || !mayReplace())) return;
  clearError();
  if (!alreadyLocked) {
    lock(true, true);
    controller = new AbortController();
  }
  let candidate,
    opened = false;
  try {
    candidate = await openPdfSheet(file, {
      signal: controller.signal,
      onProgress: message,
    });
    const checkCanvas = document.createElement("canvas");
    await candidate.renderPage(1, checkCanvas, {
      scale: 0.5,
      signal: controller.signal,
    });
    checkCanvas.width = checkCanvas.height = 0;
    if (controller.signal.aborted) throw Error("PDF opening cancelled.");
    renderController?.abort();
    renderVersion++;
    const priorSession = session;
    // Commit only after preflight; cleanup does not block or race the commit.
    session = candidate;
    candidate = null;
    void priorSession?.destroy().catch(() => {});
    original = record?.original ?? file;
    saved = record;
    editVersion = savedVersion = 0;
    pageNumber = 1;
    additions.clear();
    selected = null;
    setMode(null);
    $("text-properties").hidden = true;
    $("sheet-title").value = sanitizeSheetName(
      record?.name || file.name.replace(/\.pdf$/i, ""),
    );
    $("editor-title").textContent = "Your editable sheet";
    $("page-select").replaceChildren(
      ...session.pages.map((p) =>
        el("option", `${p.number} / ${session.pages.length}`, {
          value: p.number,
        }),
      ),
    );
    $("zoom-select").value = "fit";
    const count = session.pages.reduce(
      (n, p) =>
        n +
        p.fields.filter((f) => !f.readOnly && f.type !== "unsupported").length,
      0,
    );
    $("sheet-info").textContent =
      `${session.pages.length} page${session.pages.length === 1 ? "" : "s"} · ${count} editable fields${count ? "" : " · use Add text or Cover & replace text"}`;
    $("sheet-upload").hidden = true;
    $("pdf-editor").hidden = false;
    updateSaveState();
    await renderPage();
    opened = true;
    message(
      session.warnings?.length
        ? session.warnings.join(" ")
        : "PDF ready. Edit your sheet, then export the updated PDF.",
    );
  } catch (e) {
    await candidate?.destroy();
    error(e);
    message(
      "Your previous saved PDF and original are unchanged. Try another PDF.",
    );
  } finally {
    lock(false);
    controller = null;
    $("pdf-file").value = "";
    if (opened) $("editor-title").focus({ preventScroll: true });
  }
}
let libraryVersion = 0;
async function refreshLibrary() {
  const version = ++libraryVersion;
  try {
    const records = await listSheets();
    if (version !== libraryVersion) return;
    $("saved-sheets").replaceChildren();
    if (!records.length)
      $("saved-sheets").append(
        el(
          "p",
          "No PDFs saved here yet. Open a PDF and choose Save to browser to continue later.",
        ),
      );
    for (const record of records) {
      const row = el("div", "", { class: "sheet-saved-row" }),
        label = el("div"),
        actions = el("div", "", { class: "sheet-actions" });
      label.append(
        el("h3", record.name),
        el(
          "p",
          `Revision ${record.revision} · ${new Date(record.updatedAt).toLocaleString()}`,
          { class: "sheet-note" },
        ),
      );
      const open = el("button", "Open", {
        type: "button",
        class: "button",
        "aria-label": `Open ${record.name}`,
      });
      open.addEventListener("click", async () => {
        if (busy || !mayReplace()) return;
        lock(true, true);
        controller = new AbortController();
        clearError();
        try {
          const current = await readSheet(record.id);
          if (controller.signal.aborted) throw Error("PDF opening cancelled.");
          if (!current)
            throw Error(
              "This local sheet was removed. Refresh the saved sheets list.",
            );
          await openFile(
            new File([current.document], `${current.name}.pdf`, {
              type: "application/pdf",
            }),
            current,
            true,
          );
          await refreshLibrary();
        } catch (e) {
          lock(false);
          controller = null;
          error(e);
          await refreshLibrary();
        }
      });
      const remove = el("button", "Delete local copy", {
        type: "button",
        class: "button",
        "aria-label": `Delete local copy of ${record.name}`,
      });
      remove.addEventListener("click", async () => {
        if (
          busy ||
          !window.confirm(
            `Delete the saved PDF and original for “${record.name}” from this browser? Download a backup first. This cannot be undone.`,
          )
        )
          return;
        lock(true);
        try {
          await deleteSheet(record.id, record.revision);
          if (saved?.id === record.id) {
            saved = null;
            savedVersion = -1;
            updateSaveState();
          }
          await refreshLibrary();
          message(
            "Local PDF copy and its stored original deleted. Downloaded files and character snapshots were not changed.",
          );
        } catch (e) {
          error(e);
          await refreshLibrary();
        } finally {
          lock(false);
        }
      });
      actions.append(open, remove);
      row.append(label, actions);
      $("saved-sheets").append(row);
    }
  } catch (e) {
    if (version !== libraryVersion) return;
    $("saved-sheets").replaceChildren(
      el(
        "p",
        "Local storage is unavailable. You can still open, edit and export a PDF.",
      ),
    );
  }
}
async function exportOrSave(toBrowser) {
  if (!session || busy) return;
  clearError();
  lock(true);
  controller = new AbortController();
  try {
    const blob = await session.exportPdf({
      signal: controller.signal,
      onProgress: message,
    });
    if (toBrowser) {
      saved = await saveSheet({
        id: saved?.id,
        expectedRevision: saved?.revision,
        name: $("sheet-title").value,
        original,
        document: blob,
      });
      savedVersion = editVersion;
      $("sheet-title").value = saved.name;
      await refreshLibrary();
      message(
        "Saved in this browser. Reopen it from the list below next session. Export a PDF for a portable backup.",
      );
    } else {
      download(blob, fileName("-updated"));
      message(
        "Updated PDF exported. Reopen that file here to keep editing next session. Your original is unchanged.",
      );
    }
    updateSaveState();
  } catch (e) {
    error(e);
    message("Your edits are still open. Nothing was overwritten.");
  } finally {
    lock(false);
    controller = null;
  }
}
function chooseFiles(files) {
  if (files.length !== 1) {
    error("Choose one PDF at a time.");
    return;
  }
  openFile(files[0]);
}
$("pdf-file").addEventListener("change", (e) => {
  if (e.target.files.length) chooseFiles(e.target.files);
});
for (const type of ["dragenter", "dragover"])
  $("sheet-drop").addEventListener(type, (e) => {
    e.preventDefault();
    if (!busy) $("sheet-drop").classList.add("is-dragging");
  });
for (const type of ["dragleave", "drop"])
  $("sheet-drop").addEventListener(type, (e) => {
    e.preventDefault();
    $("sheet-drop").classList.remove("is-dragging");
    if (type === "drop" && !busy) chooseFiles(e.dataTransfer.files);
  });
$("sheet-cancel").addEventListener("click", () => controller?.abort());
$("sheet-save").addEventListener("click", () => exportOrSave(true));
$("sheet-export").addEventListener("click", () => exportOrSave(false));
$("sheet-original").addEventListener("click", () => {
  if (original && !busy) download(original, fileName("-original"));
});
$("sheet-title").addEventListener("input", changed);
$("sheet-close").addEventListener("click", async () => {
  if (busy || !mayReplace()) return;
  lock(true);
  renderController?.abort();
  renderVersion++;
  const priorSession = session;
  session = null;
  try {
    await priorSession?.destroy();
  } catch {
    /* Already closed/cancelled. */
  }
  original = null;
  saved = null;
  editVersion = savedVersion = 0;
  additions.clear();
  selected = null;
  $("pdf-canvas").width = $("pdf-canvas").height = 0;
  $("pdf-fields").replaceChildren();
  $("pdf-additions").replaceChildren();
  $("pdf-editor").hidden = true;
  $("sheet-upload").hidden = false;
  lock(false);
  $("pdf-file").focus();
  clearError();
  message("Open a PDF or reopen a saved local sheet.");
});
function changePage(number) {
  if (busy || !session) return;
  pageNumber = Math.max(1, Math.min(session.pages.length, number));
  setMode(null);
  selected = null;
  $("text-properties").hidden = true;
  renderPage();
}
$("page-select").addEventListener("change", (e) =>
  changePage(Number(e.target.value)),
);
$("page-prev").addEventListener("click", () => changePage(pageNumber - 1));
$("page-next").addEventListener("click", () => changePage(pageNumber + 1));
$("zoom-select").addEventListener("change", () => renderPage());
$("text-add").addEventListener("click", () =>
  setMode(mode === "add" ? null : "add"),
);
$("text-replace").addEventListener("click", () =>
  setMode(mode === "cover" ? null : "cover"),
);
$("text-placement").addEventListener("click", (e) => {
  const rect = $("pdf-page").getBoundingClientRect();
  placeText((e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
});
$("text-placement").addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    setMode(null);
    $("text-add").focus();
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    placeText(30, 30);
  }
});
for (const id of [
  "text-value",
  "text-size",
  "text-x",
  "text-y",
  "text-width",
  "text-height",
  "text-cover",
])
  $(id).addEventListener(id === "text-cover" ? "change" : "input", updateText);
$("text-remove").addEventListener("click", () => {
  if (!selected || busy) return;
  session.removeText(selected);
  additions.delete(selected);
  selected = null;
  $("text-properties").hidden = true;
  changed();
  drawAdditions();
  $("text-add").focus();
});
window.addEventListener("beforeunload", (e) => {
  if (unsaved()) {
    e.preventDefault();
  }
});
window.addEventListener("pagehide", (e) => {
  if (!e.persisted) {
    controller?.abort();
    renderController?.abort();
    session?.destroy();
  }
});
let resizeTimer,
  previousWidth = 0;
new ResizeObserver(([entry]) => {
  const width = Math.round(entry.contentRect.width);
  if (width === previousWidth) return;
  previousWidth = width;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (session && $("zoom-select").value === "fit") renderPage();
  }, 120);
}).observe($("sheet-viewport"));
refreshLibrary();
