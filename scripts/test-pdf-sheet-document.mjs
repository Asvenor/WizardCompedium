import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFSignature,
  degrees,
  StandardFonts,
  PDFHexString,
  rgb,
} from "pdf-lib";
import {
  openPdfSheet,
  safeFilename,
  MAX_BYTES,
  applyFieldEdits,
} from "../src/features/pdf-sheet/document.mjs";

const file = (bytes, name = "fictional-sheet.pdf") =>
  new File([bytes], name, { type: "application/pdf" });

test("canvas preserves printed art and read-only fields without duplicate editable appearances", async () => {
  const { createCanvas } = await import("@napi-rs/canvas");
  const doc = await PDFDocument.create(),
    page = doc.addPage([300, 300]),
    form = doc.getForm();
  page.drawRectangle({
    x: 40,
    y: 200,
    width: 100,
    height: 30,
    color: rgb(0, 1, 0),
  });
  const editable = form.createTextField("Editable");
  editable.setText("EDITABLE");
  editable.addToPage(page, {
    x: 40,
    y: 200,
    width: 100,
    height: 30,
    backgroundColor: rgb(1, 0, 0),
    textColor: rgb(0, 0, 1),
  });
  const readonly = form.createDropdown("ReadOnlyChoice");
  readonly.addOptions(["Kept"]);
  readonly.select("Kept");
  readonly.enableReadOnly();
  readonly.addToPage(page, {
    x: 40,
    y: 140,
    width: 100,
    height: 30,
    backgroundColor: rgb(0, 0, 1),
  });
  const button = form.createCheckBox("EditableButton");
  button.addToPage(page, {
    x: 180,
    y: 200,
    width: 25,
    height: 25,
    backgroundColor: rgb(1, 0, 0),
  });
  button.check();
  const session = await openPdfSheet(file(await doc.save()));
  try {
    const field = session.fields.find((f) => f.name === "Editable");
    assert.equal(field.background, "rgb(255, 0, 0)");
    assert.equal(field.textColor, "rgb(0, 0, 255)");
    const canvas = createCanvas(300, 300);
    await session.renderPage(1, canvas);
    const pixel = (x, y) => [
      ...canvas.getContext("2d").getImageData(x, y, 1, 1).data,
    ];
    assert.deepEqual(
      pixel(45, 74),
      [0, 255, 0, 255],
      "editable widget must not cover the original printed art",
    );
    assert.deepEqual(
      pixel(45, 134),
      [0, 0, 255, 255],
      "read-only choice appearance must remain visible",
    );
    assert.deepEqual(
      pixel(183, 78),
      [255, 255, 255, 255],
      "editable buttons must not be painted behind the controls",
    );
    const output = await PDFDocument.load(
      await (await session.exportPdf()).arrayBuffer(),
    );
    assert.equal(
      output.getForm().getTextField("Editable").getText(),
      "EDITABLE",
    );
    assert.equal(
      output.getPages()[0].node.Annots().size(),
      3,
      "display filtering must never remove exported form widgets",
    );
  } finally {
    await session.destroy();
  }
});

test("hidden widgets stay hidden and password fields remain read-only without removing their data", async () => {
  const doc = await PDFDocument.create(),
    page = doc.addPage([300, 300]),
    form = doc.getForm();
  const hidden = form.createTextField("HiddenMetadata");
  hidden.setText("Fictional hidden metadata");
  hidden.addToPage(page, {
    x: 40,
    y: 200,
    width: 200,
    height: 20,
    hidden: true,
  });
  const password = form.createTextField("PasswordExample");
  password.setText("Fictional password");
  password.enablePassword();
  password.addToPage(page, { x: 40, y: 140, width: 200, height: 20 });
  const session = await openPdfSheet(file(await doc.save()));
  try {
    assert.equal(
      session.fields.some((f) => f.name === "HiddenMetadata"),
      false,
    );
    const descriptor = session.fields.find((f) => f.name === "PasswordExample");
    assert.equal(descriptor.readOnly, true);
    assert.throws(
      () => session.updateField(descriptor.id, "Changed"),
      /read-only/,
    );
    const reopened = await PDFDocument.load(
      await (await session.exportPdf()).arrayBuffer(),
    );
    assert.equal(
      reopened.getForm().getTextField("HiddenMetadata").getText(),
      "Fictional hidden metadata",
    );
    assert.equal(
      reopened.getForm().getTextField("PasswordExample").getText(),
      "Fictional password",
    );
  } finally {
    await session.destroy();
  }
});
async function fixture() {
  const doc = await PDFDocument.create(),
    page = doc.addPage([612, 792]),
    second = doc.addPage([612, 792]),
    form = doc.getForm();
  const text = form.createTextField("CharacterName");
  text.setText("Fictional Wizard");
  text.addToPage(page, { x: 40, y: 700, width: 200, height: 30 });
  text.addToPage(second, { x: 40, y: 700, width: 200, height: 30 });
  const choice = form.createDropdown("Choice");
  choice.addOptions(["One", "Two"]);
  choice.select("One");
  choice.addToPage(page, { x: 40, y: 640, width: 100, height: 25 });
  const check = form.createCheckBox("Prepared");
  check.addToPage(page, { x: 40, y: 590, width: 20, height: 20 });
  const radio = form.createRadioGroup("Mode");
  radio.addOptionToPage("A", page, { x: 40, y: 540, width: 20, height: 20 });
  radio.addOptionToPage("B", page, { x: 80, y: 540, width: 20, height: 20 });
  radio.select("A");
  return doc.save();
}

test("normal forms update all widgets and survive export/reopen without flattening", async () => {
  const bytes = await fixture(),
    original = new Uint8Array(bytes),
    session = await openPdfSheet(file(bytes));
  try {
    const f = (name) => session.fields.find((field) => field.name === name);
    session.updateField(f("CharacterName").id, "Élodie Test");
    assert.ok(
      session.fields
        .filter((f) => f.name === "CharacterName")
        .every((f) => f.value === "Élodie Test"),
    );
    session.updateField(f("Choice").id, "Two");
    session.updateField(f("Prepared").id, true);
    const radio = session.fields.find(
      (f) => f.name === "Mode" && f.exportValue !== f.value,
    );
    session.updateField(radio.id, radio.exportValue);
    const exported = await session.exportPdf();
    assert.ok(exported instanceof Blob);
    assert.deepEqual(bytes, original);
    const doc = await PDFDocument.load(await exported.arrayBuffer()),
      form = doc.getForm();
    assert.equal(form.getTextField("CharacterName").getText(), "Élodie Test");
    assert.equal(form.getDropdown("Choice").getSelected()[0], "Two");
    assert.equal(form.getCheckBox("Prepared").isChecked(), true);
    assert.equal(form.getRadioGroup("Mode").getSelected(), "B");
    for (const field of form.getFields())
      for (const widget of field.acroField.getWidgets())
        assert.ok(widget.getAppearances()?.normal);
    const reopened = await openPdfSheet(file(await exported.arrayBuffer()));
    try {
      assert.equal(
        reopened.fields.find((f) => f.name === "CharacterName").value,
        "Élodie Test",
      );
      reopened.updateField(
        reopened.fields.find((f) => f.name === "CharacterName").id,
        "Second edit",
      );
      reopened.updateField(
        reopened.fields.find((f) => f.name === "Choice").id,
        "",
      );
      const cleared = await PDFDocument.load(
        await (await reopened.exportPdf()).arrayBuffer(),
      );
      assert.deepEqual(
        cleared.getForm().getDropdown("Choice").getSelected(),
        [],
      );
    } finally {
      await reopened.destroy();
    }
  } finally {
    await session.destroy();
  }
});

test("DDB orphan widgets repair into editable fields with matching values and appearances", async () => {
  const source = await readFile(
    new URL(
      "../tests/fixtures/character-import/ddb-widgets.pdf",
      import.meta.url,
    ),
  );
  const session = await openPdfSheet(file(source));
  try {
    assert.ok(session.warnings.some((w) => w.includes("Recovered")));
    const hp = session.fields.find((f) => f.name === "MaxHP");
    assert.ok(hp);
    session.updateField(hp.id, "47");
    const secondName = session.fields.find((f) => f.name === "CharacterName2");
    assert.ok(secondName);
    session.updateField(secondName.id, "Rowan, session update");
    const exported = await session.exportPdf(),
      doc = await PDFDocument.load(await exported.arrayBuffer());
    assert.equal(doc.getForm().getTextField("MaxHP").getText(), "47");
    assert.equal(
      doc.getForm().getTextField("CharacterName2").getText(),
      "Rowan, session update",
    );
    assert.ok(
      doc
        .getForm()
        .getTextField("MaxHP")
        .acroField.getWidgets()[0]
        .getAppearances()?.normal,
    );
    const reopened = await openPdfSheet(file(await exported.arrayBuffer()));
    try {
      const edited = reopened.fields.find((f) => f.name === "MaxHP");
      assert.equal(edited.value, "47");
      reopened.updateField(edited.id, "48");
      const again = await PDFDocument.load(
        await (await reopened.exportPdf()).arrayBuffer(),
      );
      assert.equal(again.getForm().getTextField("MaxHP").getText(), "48");
    } finally {
      await reopened.destroy();
    }
  } finally {
    await session.destroy();
  }
});

test("added text remains a normal editable field and supports crop/rotation coordinates", async () => {
  const doc = await PDFDocument.create(),
    page = doc.addPage([612, 792]);
  page.setCropBox(30, 40, 550, 700);
  page.setRotation(degrees(90));
  const session = await openPdfSheet(file(await doc.save()));
  try {
    const p = session.pages[0],
      display = [80, 90, 250, 140],
      pdfRect = p.toPdfRect(display);
    assert.deepEqual(p.toDisplayRect(pdfRect), display);
    const id = session.addText({
      page: 1,
      x: pdfRect[0],
      y: pdfRect[1],
      width: pdfRect[2] - pdfRect[0],
      height: pdfRect[3] - pdfRect[1],
      text: "Editable addition",
      cover: true,
      fontSize: 12,
    });
    session.updateText(id, { text: "Edited addition" });
    const exported = await session.exportPdf(),
      output = await PDFDocument.load(await exported.arrayBuffer());
    const field = output.getForm().getTextField(`WizardSheetText_${id}`);
    assert.equal(field.getText(), "Edited addition");
    assert.ok(field.acroField.getWidgets()[0].getAppearances()?.normal);
    assert.deepEqual(field.acroField.getWidgets()[0].getRectangle(), {
      x: pdfRect[0],
      y: pdfRect[1],
      width: pdfRect[2] - pdfRect[0],
      height: pdfRect[3] - pdfRect[1],
    });
    const reopened = await openPdfSheet(file(await exported.arrayBuffer()));
    try {
      const added = reopened.fields.find(
        (f) => f.name === `WizardSheetText_${id}`,
      );
      assert.deepEqual(reopened.pages[0].toDisplayRect(added.rect), display);
      reopened.updateField(added.id, "Third edit");
      assert.ok(await reopened.exportPdf());
    } finally {
      await reopened.destroy();
    }
    session.removeText(id);
    assert.equal(session.additions.length, 0);
  } finally {
    await session.destroy();
  }
});

test("PDF type, size, cancellation, unsupported text and out-of-page additions fail safely", async () => {
  await assert.rejects(openPdfSheet(file("Not a PDF")), /not a PDF/);
  await assert.rejects(
    openPdfSheet(file(new Uint8Array(MAX_BYTES + 1))),
    /15 MB/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    openPdfSheet(file(await fixture()), { signal: controller.signal }),
    /cancelled/,
  );
  const session = await openPdfSheet(file(await fixture()));
  try {
    assert.throws(
      () => session.updateField(session.fields[0].id, "Wizard 🧙"),
      /Latin-script/,
    );
    assert.throws(
      () =>
        session.addText({
          page: 1,
          x: -1,
          y: 10,
          width: 40,
          height: 20,
          text: "Outside",
        }),
      /inside the page/,
    );
    assert.equal(session.fields[0].value, "Fictional Wizard");
  } finally {
    await session.destroy();
  }
  assert.equal(safeFilename("../test.pdf"), ".._test-edited.pdf");
});

test("signature documents remain read-only and export is blocked", async () => {
  const doc = await PDFDocument.create(),
    page = doc.addPage([612, 792]);
  const signature = doc.context.obj({
    Type: "Annot",
    Subtype: "Widget",
    FT: "Sig",
    T: "Signature",
    Rect: [40, 600, 240, 640],
  });
  const ref = doc.context.register(signature);
  page.node.addAnnot(ref);
  doc.catalog.set(PDFName.of("AcroForm"), doc.context.obj({ Fields: [ref] }));
  const session = await openPdfSheet(file(await doc.save()));
  try {
    assert.ok(session.fields.every((f) => f.readOnly));
    await assert.rejects(session.exportPdf(), /signature/i);
  } finally {
    await session.destroy();
  }
});

test("page limits and password protection are enforced before editing", async () => {
  const doc = await PDFDocument.create();
  for (let n = 0; n < 21; n++) doc.addPage([100, 100]);
  await assert.rejects(openPdfSheet(file(await doc.save())), /20 pages/);
  const locked = await readFile(
    new URL("../tests/fixtures/character-import/password.pdf", import.meta.url),
  );
  await assert.rejects(openPdfSheet(file(locked)), /Password-protected/);
});

test("export disconnects document and field actions without changing source bytes", async () => {
  const doc = await PDFDocument.load(await fixture());
  const action = doc.context.obj({
    S: "JavaScript",
    JS: "app.alert('fictional test')",
  });
  doc.catalog.set(PDFName.of("OpenAction"), doc.context.register(action));
  doc
    .getForm()
    .getTextField("CharacterName")
    .acroField.dict.set(PDFName.of("AA"), doc.context.obj({ K: action }));
  const bytes = await doc.save(),
    session = await openPdfSheet(file(bytes));
  try {
    const exported = await PDFDocument.load(
      await (await session.exportPdf()).arrayBuffer(),
    );
    assert.equal(exported.catalog.has(PDFName.of("OpenAction")), false);
    assert.equal(
      exported
        .getForm()
        .getTextField("CharacterName")
        .acroField.dict.has(PDFName.of("AA")),
      false,
    );
    const untouched = await PDFDocument.load(bytes);
    assert.equal(untouched.catalog.has(PDFName.of("OpenAction")), true);
  } finally {
    await session.destroy();
  }
});

test("the edit journal repairs omitted native saves and removes stale widget values", async () => {
  const doc = await PDFDocument.load(await fixture()),
    form = doc.getForm();
  const field = form.getTextField("CharacterName");
  for (const widget of field.acroField.getWidgets())
    widget.dict.set(
      PDFName.of("V"),
      PDFHexString.fromText("Stale widget copy"),
    );
  applyFieldEdits(
    doc,
    [
      {
        name: "CharacterName",
        type: "text",
        value: "Journal survives page changes",
      },
    ],
    await doc.embedFont(StandardFonts.Helvetica),
  );
  const output = await PDFDocument.load(
    await doc.save({ updateFieldAppearances: false }),
  );
  const edited = output.getForm().getTextField("CharacterName");
  assert.equal(edited.getText(), "Journal survives page changes");
  for (const widget of edited.acroField.getWidgets()) {
    assert.equal(widget.dict.has(PDFName.of("V")), false);
    assert.ok(widget.getAppearances()?.normal);
  }
});

test("choice replay keeps export values separate from their visible labels", async () => {
  const doc = await PDFDocument.load(await fixture()),
    form = doc.getForm();
  form.getDropdown("Choice").acroField.dict.set(
    PDFName.of("Opt"),
    doc.context.obj([
      [PDFHexString.fromText("one_key"), PDFHexString.fromText("One")],
      [PDFHexString.fromText("two_key"), PDFHexString.fromText("Two")],
    ]),
  );
  applyFieldEdits(
    doc,
    [
      {
        name: "Choice",
        type: "choice",
        value: "two_key",
        options: [
          { label: "One", value: "one_key" },
          { label: "Two", value: "two_key" },
        ],
      },
    ],
    await doc.embedFont(StandardFonts.Helvetica),
  );
  const output = await PDFDocument.load(
    await doc.save({ updateFieldAppearances: false }),
  );
  assert.deepEqual(output.getForm().getDropdown("Choice").getSelected(), [
    "two_key",
  ]);
  assert.deepEqual(output.getForm().getDropdown("Choice").getOptions(), [
    "One",
    "Two",
  ]);
  assert.ok(
    output
      .getForm()
      .getDropdown("Choice")
      .acroField.getWidgets()[0]
      .getAppearances()?.normal,
  );
});
