# Character PDF import — implementation report

Implemented locally on 2026-09-08. Open **Play → Import D&D Beyond Character**. No push or deployment was performed.

## Workflow and coverage

Upload → Review → Confirm → personalized Play Mode. Drag/drop and a labelled, keyboard-accessible picker accept one PDF. Only the character name is required. Every supported field and each spell classification is editable. Review preserves the original observations and exposes extraction confidence, page/label evidence, conflicting readings, missing data, arithmetic warnings and DM/homebrew notes. Saving requires explicit acknowledgement; this means player-confirmed, not independently rules-verified.

Fields cover identity, class-level summary, total level, subclass/species/background, alignment/size/movement; six scores/modifiers, PB, AC, current/max/temp HP, hit dice, initiative, saves, eighteen skills, proficiencies/passives; feats and features; attacks, weapons, armor/shields, equipment, tools, languages/currency; casting ability/DC/attack, nine slot-level records, cantrips/spells; notes/custom entries and rules/homebrew/legacy confirmations. Complex inventory, feature, attack and slot-total/remaining data stays editable text, not guessed quantities. Unknowns remain null.

Each spell has independent nullable book, prepared, granted/always-prepared, other-class/feature-known and owned-scroll flags, plus level, class source and explicit ritual evidence. PDF presence is provenance, not proof of ownership. An ambiguous bullet/checkbox never establishes preparation. Complete-book and complete-preparation confirmations are separate. Recommendations never change these facts.

## Extraction, security and privacy

[PDF.js](https://mozilla.github.io/pdf.js/examples/) reads selectable text and text/choice form widgets first. Common English aliases, value-above-label geometry and basic spell table columns are supported. When a page has insufficient selectable/form text, [Tesseract runs with local worker/core/language paths](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md). Workers, WASM, fonts, CMaps and English language data are served by the application. No third-party extraction requests or character uploads occur; browser tests verify the request boundary. No D&D Beyond credentials are requested.

Limits: 15 MB, 20 pages, 200,000 extracted characters, 250 spell entries, 120 seconds and approximately three million rendered OCR pixels per page. File bytes must start with `%PDF-`; the extension/MIME are not trusted. Control/bidirectional override characters and unsafe filename characters are removed. Strings are bounded and rendered with DOM text/value APIs, never as character-supplied HTML. PDF evaluation/XFA are disabled; attachments, launch actions and annotation links are not executed. Workers, document handles and canvases are released after success, cancellation or error. OCR language caching is disabled. No temporary PDF/OCR files are written on a server; memory reclamation is managed by the browser.

Invalid/corrupt/locked PDFs, cancellation and timeouts leave manual entry available. Low-quality scans, handwriting, translated exports, unusual encodings and deeply customized or very dense layouts are not guaranteed automatic extraction. Original page text is available during review. OCR remains low confidence. Passwords are not collected: re-export unlocked or enter manually. Fixtures are synthetic, not a certification of every historical D&D Beyond exporter.

## Shared model and storage

V2's existing `schemas/character.schema.json` accepts historical 1.0 records and the new 1.1 immutable snapshot contract in `schemas/character_snapshot.schema.json`. The original Kael record remains unchanged. The website's `src/features/character-lab/generated/` files are hash-locked projections of that contract and existing canonical/analysis owners, not new editable rules owners. The manifest excludes private Character Lab records and protected sources. A standalone GitHub checkout uses committed projections; it does not need the sibling V2 workspace.

IndexedDB `wizard-compendium-character-lab-v1` contains character identity/latest pointers, append-only snapshots, an active-view setting and optional retained PDFs. Each snapshot has stable random character ID, unique snapshot ID, revision, import timestamp, source filename/hash/method, field provenance/confidence/review status, original observations, corrections/exclusions, unknowns, scope restrictions and previous snapshot reference. Sheet observation time stays unknown rather than being invented from import time. 2024 can reference `ruleset.core2024.v1`; 2014/mixed/unknown selections retain a null profile reference and explicit generation fact.

Original PDF retention defaults **off**. Otherwise only structured facts/observations and necessary provenance persist. Raw page text is discarded after saving/navigation. History, semantic diffs, JSON export, optional PDF download and confirmed character deletion are available in Play. Re-import into the selected character always appends. Duplicate hashes require explicit corrected-revision confirmation. Atomic transactions reject stale concurrent-tab saves. Unknowns in a newer sheet are not silently filled from an older one. JSON export is an audit/backup export, not a restore/sync interface.

Privacy is per same-origin **browser profile**, not an account-encrypted vault. People sharing a profile can access that profile's local characters; the upload UI warns about this. Separate profiles are isolated. Clearing site data can remove all history. No cloud/account/cross-device sync exists. The earlier manual My Wizard planner is not silently rewritten; imported facts drive the personalized Play panel. Account-specific server storage would be a separate product/security decision.

## Personalized Play

The selected snapshot supplies current overview and confirmed-access spells. Automated current-casting guidance requires a supported 2024 variant, a confirmed Wizard class source and known learning ceiling. Other-class/feature exceptions, unknown sources, homebrew and mixed/2014 variants remain visible as observations but do not acquire invented 2024 legality.

Cards cover opening control and existing decision-rule conditions, concentration, reactions, defense/emergency mobility, indexed target defenses and confirmed book rituals. Separate future cards cover possible/confirmed book gaps, copying candidates from owned scrolls, preparation candidates, conditional next-Wizard-level acquisition and equipment/crafting reference priorities. Existing website spell owners and V2 class/rule/decision/build owners supply references and summaries. Slots, components, enemy defenses, current concentration and campaign permissions are not assumed. No spells, purchases, preparations or class levels are automatically applied.

## Changed files

- `src/pages/play/import.astro`, `src/pages/play/index.astro`, `src/components/PersonalPlay.astro`, `CharacterCatalog.astro`, `src/styles/character-lab.css`: import UI and Play integration.
- `src/features/character-lab/{model,parser,pdf,storage,personalize,import-ui,play-ui,dom}.mjs` and `generated/`: shared contract, parser, local processing, review, immutable saves, history and reference-driven views.
- `scripts/prepare-character-import.mjs`: owner projections and same-origin assets; standalone projection verification when V2 is absent.
- `scripts/test-character-import.mjs`, `tests/browser/character-import.spec.mjs`, `playwright.config.mjs`, `scripts/serve-import-tests.mjs`: unit and real-browser checks.
- `scripts/create-character-fixtures.py`, `tests/fixtures/character-import/`: fictional text, image-only, AcroForm, multiclass, missing-page, homebrew/2014, updated, password/corrupt/invalid fixtures. ReportLab and Pillow are needed only to regenerate these already-present fixtures. The PDF skill guided form/scan handling and rendered-fixture inspection.
- V2 `schemas/character.schema.json`, `schemas/character_snapshot.schema.json`, `tests/test_character_import.py`: backward-compatible Character Lab integration.
- `package.json`, lockfile, `.gitignore`, `tsconfig.json`, README: build/test integration and documentation. Astro generated types remain first; vendor OCR files are excluded from source checking.

## Verification and remaining boundaries

All 38 website unit/regression tests, 9 browser scenarios and 3 new V2 contract tests pass (V2 contract tests were run during initial implementation). Astro checks have zero errors/warnings/hints; production build, content/link validation, 100% source-token fidelity and owner-projection validation pass. Browser coverage includes actual OCR, correction provenance, unknowns, duplicate/re-upload/history, retained PDF opt-in, separate-profile privacy, keyboard and script-text safety, mobile overflow, axe accessibility, cancellation/timeouts, concurrent writes and local deletion. Desktop/mobile screens and representative PDF renders were inspected visually.

### Reader correction — 2026-09-08

A user-provided six-page DDB export revealed missing widget aliases, unrelated printed headings being treated as values, and empty case-variant continuation fields masking populated spell sources. Its document root has no AcroForm field tree, so extracting page widgets directly is essential. The player's PDF was inspected locally only; neither it nor its personal data was added to the repository or test fixtures. Existing saved snapshots were not changed.

`ddb-forms.mjs` now reads all form observations before text fallback. It maps current DDB HP/save/passive aliases, repeated identity fields, multi-column and multi-page feature/feat/species blocks, explicit Wizard subclass selections, proficiencies/languages/tools, item quantities/weights, attack rows, currency, actions and personal notes. Recognized blank widgets stay unknown. Footer/table headings and cross-column text cannot fill empty form boxes. Review exposes the original widget values as well as page text.

Spell names, class/feature sources, level headers, explicit ritual markers and always-prepared evidence are extracted by indexed row and geometry. Empty duplicate template names no longer overwrite populated fields. Same-name spells from different classes remain separate. Equal multiclass casting values collapse to a common value; differing values remain unselected with a warning and full notes. Class levels can produce an explicitly **derived** total. Slot headers supply totals, not inferred remaining slots. A positive `P` in a named preparation widget is reviewable evidence; hollow `O`/blank markers, spellbook ownership, completeness and campaign rules generation are not guessed.

The actual export now yields all 52 spell names with their levels and class/feature sources, and 70 populated supported non-spell fields, without false conflicts. Blank/unsupported fields remain unknown. Six new unit tests and a real-browser orphan-widget PDF scenario cover these regressions using wholly fictional `ddb-widgets.json` / `ddb-widgets.pdf`, generated by `scripts/create-ddb-widget-fixture.py`. Browser regression tests can run independently of an open player preview with `CHARACTER_IMPORT_PORT=4332 npm run test:import:browser`.

To apply the corrected reader to a saved character, choose **Import a newer sheet**, upload the same PDF, review the new readings and explicitly confirm a corrected revision. This appends a snapshot rather than changing the old one. Reader changes are local only; no push or deployment was performed.

V2's new contract tests pass. Canonical registry validation passes for 1,203 records / 842 claims. The full historical suite still reports unrelated baseline issues: the OneDrive v1.14 DOCX hash differs from the old preservation manifest (its modification time predates this task), and `tooling/generators/pilot.py` does not handle the existing `long_cast` action type. Phase 1–3 validation reports the same source hash mismatch. The document, preservation manifests and historical generator were not altered to hide these failures. No protected `sources/` file was changed.

Commands: `npm ci`, `npm run build`, `npm test`, `npm run check`, `npm run validate:content`, `npm run validate:build`, `npm run audit:fidelity`, `npm run validate:import`, `npm run test:import:browser` (installed Chrome). `node scripts/prepare-character-import.mjs --check --standalone` checks the repository-only path. V2 tests need a current Python runtime with the project's dependencies.
