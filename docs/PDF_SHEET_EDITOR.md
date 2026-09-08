# PDF sheet editor

The editor at `/play/import/` keeps the character sheet as a PDF. It replaces the automatic extraction-and-import screen. Opening a file does not read character statistics into a model, run OCR, create a Character Lab snapshot, or change the Compendium.

## Everyday workflow

1. Open a PDF from Play's sheet editor.
2. Change an existing fillable field directly. For printed or scanned areas, add a text box at the desired position.
3. Give the sheet a recognizable title and choose **Save** to keep it in this browser.
4. Next session, open the same website in the same browser profile and reopen the sheet from the saved-sheet library.
5. Choose **Export** to download an edited PDF for another viewer, another device, or a backup. Review the exported pages before relying on them at the table.

Uploading or typing is not a substitute for **Save**. An export is a separate downloaded file, not a silent overwrite of the source file on disk. Keep the original download and export a backup when the edits matter.

## Two kinds of editing

### Fillable PDF fields

Existing supported form fields are edited as PDF fields. The editor uses their original PDF field names; it does not reinterpret a field as a Wizard statistic or infer rules from its contents. Form values remain editable in the exported PDF.

Some D&D Beyond PDFs have visible form widgets without a complete form-field tree. Recoverable widgets are handled by the PDF editor; ambiguous or unsupported controls should not be silently turned into a guessed character value. Always review both the visible result and the exported file.

### Text on a printed or scanned sheet

For an area without a fillable field, add a text box or use the printed-text cover mode, then adjust the text, font size, position, and dimensions. These additions remain editable locally and are exported as editable PDF fields.

The cover mode places a visual cover over the printed area and adds replacement text. It does **not** delete the underlying text or pixels. Original content may still be searchable, copyable, or recoverable by inspecting the PDF. Do not use it to remove passwords, personal details, or other sensitive information before sharing. Use a dedicated secure-redaction workflow for that purpose.

This is not a word processor: it does not reflow the original page or rewrite a printed paragraph in its original typesetting. A scanned page remains an image beneath the editable additions; no OCR is performed.

## Save, reopen, export, and the original

- **Save** keeps the editable sheet in local browser storage for another session.
- The saved-sheet library reopens the locally saved document and edits.
- **Export** downloads a new edited PDF. The exported fields can be edited again in a compatible PDF viewer or reopened in this editor.
- The original PDF is preserved separately from the edits and remains available through the original-file download control.
- Closing an editor view is not the same as saving it. Resolve any unsaved-change warning before closing or opening another sheet.

The app cannot overwrite an arbitrary file on your computer. Its downloads are copies, and your browser determines the download location and whether to ask before replacing a same-named downloaded file.

**Delete local copy** removes that saved sheet and its stored original from this browser after confirmation. It does not remove downloaded files or Character Lab snapshots. This local deletion cannot be undone; download a backup first.

## Supported limits

Files are limited to 15 MB, 20 pages, and 2,500 form fields. The editor supports up to 200 added text boxes per open editing session. Text edits currently support Latin-script text and common punctuation; unsupported characters or form appearances produce an error rather than silently disappearing.

Password-protected files and dynamic XFA forms are not supported. Signature fields are read-only, and exporting a PDF with signatures is blocked so an edit cannot silently invalidate its signature. Use a suitable unlocked, unsigned PDF for editing. Unsupported field types are not converted into guessed text fields.

## Privacy and existing character data

PDF work is local to this website origin and browser profile. There is no account vault, cloud synchronization, D&D Beyond login, external OCR, or AI service in this workflow. The editor loads PDF rendering/editing resources, but does not send the sheet to a server for interpretation.

Localhost, the live site, a different browser, and a different browser profile have separate saved data. Clearing site data or losing access to the profile can remove saved sheets. Anyone who can use the same browser profile can potentially open its local sheets. Use a separate profile on shared computers and keep your own exported backups.

Existing Character Lab snapshots and their history remain in their established storage. They are not converted into PDFs, deleted, or overwritten by this editor. An edited HP number or spell name on the PDF does not update previously saved Character Lab facts or personalized Play suggestions. No new extraction route is provided.

The previous parser, schemas, calculations, and import unit tests are retained to preserve the old system and its saved records. `docs/CHARACTER_IMPORT.md` and `tests/legacy-browser/` are historical documentation and browser coverage; their old upload/review instructions do not describe the active editor.

## Implementation boundaries

- `src/pages/play/import.astro`, `src/features/pdf-sheet/editor.mjs`, and `src/styles/pdf-sheet.css` provide the PDF-first interface.
- `src/features/pdf-sheet/document.mjs` handles rendering, editable fields, supported widget recovery, added text, and PDF export. It does not invoke the historical character parser or OCR pipeline.
- `src/features/pdf-sheet/storage.mjs` stores sheet metadata, the original PDF, and the latest edited PDF in `wizard-compendium-pdf-sheets-v1`. Saving uses a revision check to avoid silently replacing a newer save from another tab.
- `scripts/test-pdf-sheet-document.mjs` and `scripts/test-pdf-sheet-storage.mjs` cover document and persistence behavior. The browser suite covers the connected interface.

The canonical Compendium, V2 rule owners, and historical Character Lab snapshots are not PDF-editor output targets.

## Verification

The active editor browser suites are `tests/browser/pdf-sheet.spec.mjs` and `tests/browser/pdf-sheet-lifecycle.spec.mjs`. Use only their fictional fixtures, never a player's saved sheet, for editing, export, reset, or persistence tests.

The acceptance checks cover:

- Direct changes to a real fillable field, retained after local save/reopen and PDF export/reopen.
- Recoverable orphan widgets in the D&D Beyond-style fixture.
- Editable text additions and visible printed-text covers, including the non-redaction warning.
- Preserved original bytes and unchanged historical character storage.
- Explicit save behavior, refreshed library state, and isolation between browser profiles.
- No automatic extraction/OCR or external document-processing requests.
- Invalid or protected PDF handling without overwriting a saved document.
- Keyboard controls, mobile layout, accessible labels/status/errors, and page screenshots.

PDF export checks must inspect the logical form values and page widgets, including appearance streams, as well as render the resulting pages. A successful download or correct-looking screenshot alone does not prove that a PDF field's saved value is correct. Likewise, a correct field value alone does not prove that its text is visible or unclipped.

The standard project checks and the dormant Character Lab unit tests remain applicable. Browser tests run against a built `dist/`; rebuild after implementation changes before testing. A passing local test or build is not evidence of deployment.

### Local verification — 2026-09-08

- Astro diagnostics: zero errors, warnings, or hints.
- Unit tests: 90 passed, including 11 document-engine tests.
- Browser persistence tests: 7 passed, including quota rollback and cross-tab revision protection.
- Full browser suite: 19 passed, including 10 PDF-editor/lifecycle cases and the existing site navigation, accessibility, search, and calculator checks.
- Production build: 274 pages; 11,603 links/assets and 1,234 anchors validated.
- Content migration and source fidelity checks passed; 31 locked Character Lab projections and standalone generation remained valid.
- Exported logical field values, inherited widget values, normal appearance streams, and rendered pages were checked. Reopened exports retained editable fields and original-file downloads matched the original bytes.

These results describe the local implementation and build. Publishing requires a successful Cloudflare production build from the matching GitHub commit, followed by an edit/export/reopen check on the live site; local results alone do not establish deployment.
