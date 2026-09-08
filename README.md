# Wizard Compendium

An Astro reference site with fast play tools over the complete 61-chapter Compendium. There is no app login, server database, cloud synchronization, or AI service. Saved PDF sheets and character data use local browser storage.

## Edit your PDF character sheet

Open the **PDF sheet editor** (`/play/import/`) from Play. Work on the PDF itself: update fillable fields directly, or place editable text over a printed or scanned sheet. There is no automatic character extraction, OCR, rules interpretation, or import into Play Mode.

Use **Save** to keep the sheet and edits in this browser, then reopen it from the saved-sheet library next session. **Export** downloads an edited PDF; it does not overwrite your original file. Keep an exported copy as a backup. Covering printed text is a visual correction, not secure redaction: the original content can remain recoverable in the PDF.

Existing Character Lab snapshots remain separate and unchanged. Editing a PDF does not change previously saved stats, spellbook ownership, preparation, or personalized advice. The old automatic-import implementation is retained as dormant code; it is no longer an active upload workflow.

See [PDF sheet editing and privacy](docs/PDF_SHEET_EDITOR.md). Use a separate browser profile on shared devices; local storage is not an account vault. [The previous import report](docs/CHARACTER_IMPORT.md) documents the historical feature, not the current editor.

## Run locally

Open a terminal in this website folder. Use a recent Node.js release (Node 22.18+ or Node 24 supports the test scripts).

```sh
npm install
npm run dev
```

Open the address printed by Astro. This version of Astro may run the development server in the background. To check or stop it:

```sh
npx astro dev status
npx astro dev stop
```

To make the production site:

```sh
npm run build
```

The output is in `dist/`. This is generated; edit `src/`, not `dist/`.

## Where things live

| What you want to change | File or folder |
| --- | --- |
| A chapter | `src/content/chapters/` |
| A spell | `src/content/spells/`, in its level folder |
| Homepage / task shortcuts | `src/pages/index.astro` |
| Main and mobile navigation | `src/components/layout/BaseLayout.astro` |
| Chapter layout / table behavior | `src/components/layout/DocsLayout.astro` |
| Colors, spacing, responsive and print styles | `src/styles/global.css` |
| Quick-reference routes and tool search directory | `src/data/quick-tools.ts` |
| Play decision cards | `src/data/play-mode.ts` and `src/pages/play/index.astro` |
| Save, concentration, components and expected damage | `src/pages/tools/index.astro`, `src/features/calculators/` |
| Profile and session data | `src/features/my-wizard/` |
| Editable PDF sheet entry point | `src/pages/play/import.astro` |
| PDF rendering, editing, local saves and editor styling | `src/features/pdf-sheet/`, `src/styles/pdf-sheet.css` |
| Historical Character Lab snapshots and guidance | `src/features/character-lab/` |
| Learning questions and review | `src/pages/learn/index.astro`, `src/features/learning/practice.ts` |
| Spell filters | `src/features/spells/filters.ts` |
| Search documents / search interface | `src/pages/search-index.json.ts` / `src/pages/search/index.astro` |
| Build cards / comparison | `src/lib/builds.ts`, `src/pages/builds/` |

Files under the parent project's `sources/` are read-only reference material. Do not edit or move synced files.

## Edit or add a spell

1. Find the JSON record in `src/content/spells/`.
2. Edit only facts supported by the Compendium or the selected source entry.
3. To add one, copy a nearby JSON record into the correct level folder, give it a unique URL-safe `id`, and review every field.
4. Unknown values remain `null`; never use zero to mean an unknown price.
5. Run the checks below.

The database, detail page, comparison selectors and search update automatically. `components.items` supports separate consumed and retained materials; see Clone. The schema in `src/content.config.ts` lists allowed tiers, build IDs, source categories and save abilities. `compendium.relatedSpells` is optional and validated against existing IDs.

The current source does not provide complete structured school, duration, range or casting information for every spell. “No listed save” is not a guarantee of no-save resolution or Legendary Resistance bypass. Build relevance is an explicit source tag, not a complete compatibility verdict.

## Edit chapters, builds and source-derived views

Chapter Markdown contains headings, paragraphs and HTML comparison tables. Keep source locator comments. Preserve all substantive content; use headings and callouts instead of layout-only table rows.

Build selector cards read the Chapter 4 spell-priority / best-fit table. Build route-to-chapter mappings live in `src/lib/builds.ts`. To add a new supported route, also update the profile build union, profile form, level-up mapping and validation. Do not add a route without its timing and source guidance.

These views reuse source content at build time:

- Chapter 11 spellbook strategy → acquisition lanes in `src/lib/acquisition.ts`.
- Chapter 13 packages → preparation presets.
- Chapter 14 ladders and comparisons → spell relationships.
- Chapter 27 matrix → item choices.
- Chapter 43 → English/German lookup.
- Chapter tables selected by `quick-tools.ts` → small quick-reference cards.

Changing table order or the named Chapter 11 headings requires reviewing the corresponding helper. Source-derived quick cards show one entity per card; they do not create a separate tactical ruleset.

## Add a tool or reference page

For a simple source-table reference, add an entry to `quickTools` with its unique route ID, title, chapter number and table indexes. Table indexes start at zero. It becomes `/quick/your-id/` automatically.

For a new interactive tool:

1. Add an Astro page in `src/pages/`.
2. Put reusable browser logic in a small module under `src/features/`.
3. Use labeled native controls, readable results, source links and unknown-value handling.
4. Add its link to `toolDirectory` in `src/data/quick-tools.ts` so global search finds it.
5. Link it from the appropriate hub. Do not add every tool to the top navbar.
6. Add regression tests for its calculations or state.

No React or full-page hydration is needed.

## Local data and privacy

The manual planners use two versioned keys:

- `wizard-compendium-profile-v1`: name, route, levels, optional stats, owned and prepared lists.
- `wizard-compendium-session-v1`: concentration, wanted/copy/skip statuses, pins, checklists, reserves, gear/projects, campaign notes and practice history.

The PDF editor saves sheets separately in the `wizard-compendium-pdf-sheets-v1` IndexedDB database. Earlier Character Lab snapshots also remain in their existing IndexedDB storage. These are distinct from the manual planner keys and from each other; changing a PDF does not silently update a character snapshot.

All data stays in this browser on this website origin. Localhost and the live site have separate data. It does not synchronize between browsers or devices. Clearing browser data removes it. Storage failures show an error; static reference content remains usable.

Most planners have an explicit **Save locally** button. Spellbook statuses save immediately. **Reset Wizard** clears the profile only. **My quick reference → Local data controls** resets both keys and practice history. Neither action changes the Compendium.

Current slots and attunement are manual plans. Recovery, feature uses, availability, acquisition legality, inventory and gold are not automatically calculated or spent. Blank counts and prices remain unknown.

## Print and keyboard use

Use the browser's normal Print command on a quick reference. Expand the details you want included before printing. Navigation and action buttons are omitted. In the PDF sheet editor, use **Export** for an edited, reusable PDF instead of printing the web page.

Tab moves between controls, Enter/Space activates buttons and disclosures, and the skip link moves to the main content. Chapter content, spell records and reference cards are generated as HTML and remain available without JavaScript. Interactive tools require JavaScript.

## Test before publishing

The September 2026 research integration adds 16 access-checked Wizard spell records to the preserved 155-record migration baseline (171 total). Its dispositions, source limits and rejected claims are recorded in [the integration audit](docs/RESEARCH_INTEGRATION_20260907.md); the machine-readable inventory is `src/data/research-integration-20260907.json`. Keep the original migration counts unchanged and track later additions separately.

Optional `source.review` metadata records access, review date, verification scope and primary references. `compendium.tactics` supplies practical guidance and search text; `compendium.research` retains supplied video attribution without treating it as independently checked rules or creator quotations. Paid details not inspected must retain their verification warnings.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

```sh
npm run check
npm test
npm run validate:content
npm run audit:fidelity
npm run build
npm run validate:build
```

The build checks duplicate spell IDs and related references, then Astro validates field values. Link validation checks static pages, assets and anchors. The content audit checks all migrated source blocks.

Also test the production output in a browser: search (including tools and German terms), combined spell filters, compare, level-up, mission presets, calculators, learning and the local notebook. Test with no profile, a saved profile, and reset. Check phone, tablet and desktop widths. Do not use a real saved profile for destructive reset tests.

PDF editor browser coverage lives in `tests/browser/pdf-sheet.spec.mjs`. It checks direct form edits, text overlays, local save/reopen, edited export, original preservation, input errors, privacy, and mobile accessibility. Historical extraction browser suites are preserved in `tests/legacy-browser/` and excluded from active browser-test collection; the old model/parser unit checks remain useful for protecting existing Character Lab data. See the [editor verification checklist](docs/PDF_SHEET_EDITOR.md#verification).

## Save and publish

The existing repository is [Asvenor/WizardCompedium](https://github.com/Asvenor/WizardCompedium). Production is connected to its `main` branch on Cloudflare.

```sh
git status
git diff
git add <the-files-you-reviewed>
git commit -m "Describe the finished change"
git push origin HEAD
```

Merge the tested branch into `main` in GitHub to publish. If intentionally publishing the tested current branch directly, `git push origin HEAD:main` must be a normal fast-forward push; never force it. Check the Cloudflare build if the live site does not update.

Do not alter the existing hosting configuration or create a new repository for routine changes.

Live site: [Wizard Compendium](https://wizardcompedium.edward-nyarko.workers.dev/).
