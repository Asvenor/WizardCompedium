# Historical automatic-import browser tests

These three suites are preserved unchanged from the former PDF extraction, review, and Character Lab snapshot workflow. That upload workflow has been removed at the user's request. `/play/import/` now opens a PDF sheet editor, with no automatic character extraction or OCR.

The active Playwright configuration collects only `tests/browser/`, so these historical assertions are intentionally not run against the replacement screen. The PDF editor's replacement coverage is `tests/browser/pdf-sheet.spec.mjs`.

The old Character Lab model/parser unit suites are still active and its previously saved snapshots remain untouched. This archive does not provide an active extraction route and is not an instruction to restore one.
