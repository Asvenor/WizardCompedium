import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_TEXT,
  readableWidgets,
  readPageContent,
  mergeOCRLines,
} from "../src/features/character-lab/pdf.mjs";
import {
  parsePages,
  textLines,
} from "../src/features/character-lab/parser.mjs";
import { value } from "../src/features/character-lab/model.mjs";

const item = (str, y = 700) => ({
  str,
  width: str.length * 5,
  transform: [1, 0, 0, 1, 30, y],
});

test("choice widget selections are retained without interpreting buttons or embedded actions", () => {
  const widgets = readableWidgets([
    {
      subtype: "Widget",
      fieldType: "Ch",
      fieldName: "Languages",
      fieldValue: ["Common", "Elvish"],
    },
    {
      subtype: "Widget",
      fieldType: "Tx",
      fieldName: "CurrentHP",
      fieldValue: "",
    },
    {
      subtype: "Widget",
      fieldType: "Tx",
      fieldName: "Notes",
      fieldValue: "Safe\u202etext",
    },
    {
      subtype: "Widget",
      fieldType: "Btn",
      fieldName: "Prepared",
      fieldValue: "Yes",
    },
    {
      subtype: "Link",
      fieldType: "Tx",
      fieldName: "Notes",
      fieldValue: "javascript:alert(1)",
    },
    { subtype: "Widget", fieldType: "Tx", fieldValue: "Unnamed" },
  ]);
  assert.equal(widgets.length, 3);
  assert.equal(widgets[0].value, "Common\nElvish");
  assert.equal(widgets[1].value, "");
  assert.equal(widgets[2].value, "Safetext");
});

test("text-extraction failure requests OCR while retaining usable page widgets", async () => {
  const result = await readPageContent(
    {
      getTextContent: async () => {
        throw Error("Unusable text encoding");
      },
      getAnnotations: async () => [
        {
          subtype: "Widget",
          fieldType: "Tx",
          fieldName: "AC",
          fieldValue: "17",
        },
      ],
    },
    2,
  );
  assert.equal(result.textFailed, true);
  assert.equal(result.widgets[0].value, "17");
  assert.match(result.warnings[0], /Page 2.*Local OCR/);
});

test("a broken annotation tree does not discard selectable character text", async () => {
  const result = await readPageContent(
    {
      getTextContent: async () => ({
        items: [item("Character name: Pipeline Fixture")],
      }),
      getAnnotations: async () => {
        throw Error("Malformed annotation");
      },
    },
    1,
  );
  assert.equal(result.textFailed, false);
  assert.equal(result.widgets.length, 0);
  const d = parsePages([{ ...result, page: 1, method: "text" }]);
  assert.equal(value(d, "identity.name"), "Pipeline Fixture");
  assert.match(d.warnings.join(" "), /form fields could not be read/);
});

test("OCR retains original selectable evidence with separate extraction confidence", () => {
  const embedded = [
    { text: "Character name: Pipeline Fixture", method: "text" },
  ];
  const lines = mergeOCRLines(
    embedded,
    "Character name: Pipeline Fixture\nArmor Class: 16",
  );
  assert.equal(lines.length, 2);
  const d = parsePages([{ page: 1, method: "ocr", lines }]);
  assert.equal(value(d, "identity.name"), "Pipeline Fixture");
  assert.equal(d.facts["identity.name"].source.method, "text");
  assert.ok(d.facts["identity.name"].confidence > 0.85);
  assert.equal(d.facts["defenses.ac"].source.method, "ocr");
  assert.equal(d.facts["defenses.ac"].confidence, 0.55);
  assert.deepEqual(new Set(d.source.methods), new Set(["text", "ocr"]));
});

test("OCR fallback cannot take a previous value from the separate embedded text block", () => {
  const lines = mergeOCRLines([{ text: "19", method: "text" }], "Armor Class");
  const d = parsePages([{ page: 1, method: "ocr", lines }]);
  assert.equal(value(d, "defenses.ac"), null);
});

test("decoded content and geometry counts are bounded before grouping or OCR merging", async () => {
  const page = {
    getTextContent: async () => ({ items: [item("x".repeat(MAX_TEXT + 1))] }),
    getAnnotations: async () => [],
  };
  await assert.rejects(readPageContent(page, 1), /safe processing limit/);
  page.getTextContent = async () => ({
    items: Array.from({ length: 10001 }, () => item("x")),
  });
  await assert.rejects(readPageContent(page, 1), /safe processing limit/);
  assert.throws(
    () => mergeOCRLines([], "x".repeat(MAX_TEXT + 1)),
    /safe processing limit/,
  );
  assert.throws(
    () =>
      readableWidgets([
        {
          subtype: "Widget",
          fieldType: "Tx",
          fieldName: "Notes",
          fieldValue: "x".repeat(MAX_TEXT + 1),
        },
      ]),
    /safe processing limit/,
  );
});

test("malformed PDF geometry cannot crash text grouping", () => {
  assert.deepEqual(
    textLines([
      null,
      {},
      { str: "Unsupported" },
      { str: "Bad", transform: [1, 0, 0, 1, NaN, 2] },
    ]),
    [],
  );
  assert.equal(textLines([item("Readable")])[0].text, "Readable");
});

test("conflicting scalar readings remain unknown with both page sources, even after repetition", () => {
  const d = parsePages([
    {
      page: 1,
      method: "text",
      lines: [],
      widgets: [{ name: "MaxHP", value: "40" }],
    },
    {
      page: 2,
      method: "text",
      lines: ["Maximum Hit Points: 42"],
      widgets: [{ name: "MaxHP", value: "42" }],
    },
    { page: 3, method: "text", lines: ["Maximum Hit Points: 40"] },
  ]);
  assert.equal(value(d, "defenses.hp_max"), null);
  assert.deepEqual(
    d.facts["defenses.hp_max"].alternatives.map((a) => [a.value, a.page]),
    [
      [40, 1],
      [42, 2],
    ],
  );
});

test("explicit negative homebrew confirmations are not contradicted by keyword detection", () => {
  const d = parsePages([
    {
      page: 1,
      method: "text",
      lines: ["Homebrew present: No", "Notes: No homebrew is used."],
    },
  ]);
  assert.equal(value(d, "rules.homebrew"), false);
  assert.equal(d.facts["rules.homebrew"].alternatives.length, 0);
});
