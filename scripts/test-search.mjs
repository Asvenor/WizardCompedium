import { test } from "node:test";
import assert from "node:assert/strict";
import {
  indexDocuments,
  normalizeQuery,
  searchDocuments,
} from "../src/features/search/index.mjs";

const documents = [
  {
    title: "Shield",
    description: "Reaction defense",
    content: "Protect yourself against attacks.",
    kind: "Spell",
  },
  {
    title: "Shield tactics",
    description: "A shield reaction",
    content: "Armor and defense.",
    kind: "Chapter",
  },
  {
    title: "Emergency protocol",
    description: "Defense checklist",
    content: "Cast Shield as a reaction.",
    kind: "Chapter",
  },
  {
    title: "Überblick",
    description: "Zauber für den Magier",
    content: "",
    kind: "German Conversion",
  },
];
const index = indexDocuments(documents);

test("search normalizes case, accents and punctuation", () => {
  assert.equal(normalizeQuery("  ÜBERBLICK—für: S+  "), "uberblick fur s+");
  assert.equal(
    searchDocuments(index, "uberblick fur")[0].document.title,
    "Überblick",
  );
});
test("search puts exact spell names before chapter mentions", () => {
  assert.deepEqual(
    searchDocuments(index, "shield").map((result) => result.document.title),
    ["Shield", "Shield tactics", "Emergency protocol"],
  );
});
test("search requires all terms and respects the selected category", () => {
  assert.deepEqual(
    searchDocuments(index, "shield reaction", "Chapter").map(
      (result) => result.document.title,
    ),
    ["Shield tactics", "Emergency protocol"],
  );
  assert.equal(searchDocuments(index, "shield imaginary").length, 0);
  assert.equal(searchDocuments(index, "shield", "Tool").length, 0);
});
test("empty queries and missing optional text are safe", () => {
  assert.deepEqual(searchDocuments(index, " -- "), []);
  assert.equal(
    searchDocuments(
      indexDocuments([{ title: "Shield", kind: "Spell" }]),
      "shield",
    ).length,
    1,
  );
});
test("repeated queries retain the index and source data", () => {
  const before = JSON.stringify({ index, documents });
  searchDocuments(index, "shield");
  searchDocuments(index, "reaction", "Spell");
  assert.equal(JSON.stringify({ index, documents }), before);
});
