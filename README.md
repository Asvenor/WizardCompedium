# Wizard Compendium

An Astro website built from the expanded Obsidian compendium. The current import contains **422 complete notes**, including **208 spell cards, 51 magic-item cards, 20 creature cards, 35 core spell progressions**, and the optional Illusion Adept configuration. All 110 source images and the reference PDF are preserved.

The website provides searchable spell, item, and form catalogues, comparisons, builds, tier lists, linked reference pages, saved references, calculators, and an editable PDF character sheet. The form finder covers all **82 creatures embedded in the vault's galleries**: 20 metadata-checked cards and 62 image-transcribed references. It displays senses, original images, stat-block conditions, and explicit review status. Gallery placement does not grant spell eligibility. Rules, analysis, edition labels, access conditions, and verification limits come from the source notes. Importing a note does not independently verify its rules.

## Run locally

Use Node.js 24 and open a terminal in this website folder:

```sh
npm ci
npm run dev
```

Open the address Astro prints. If the server runs in the background, these commands show its status or stop it:

```sh
npx astro dev status
npx astro dev stop
```

Build the production files with `npm run build`. Output goes to `dist/`; edit source files rather than generated build files.

## Update the Obsidian content

The importer reads the active vault without changing it. Its default source is the owner's existing OneDrive `Wizard Compendium Vault`. For another checkout, supply the full vault path:

```sh
npm run sync:vault -- --source="/absolute/path/to/Wizard Compendium Vault"
npm run validate:content
npm run build
npm run validate:build
```

To check that generated files match the vault without writing anything:

```sh
node scripts/import-vault.mjs --source="/absolute/path/to/Wizard Compendium Vault" --check
```

Make content changes in the Obsidian vault, then import again. `src/content/vault/`, `src/data/vault-index.json`, `src/data/vault-audit.json`, `src/data/form-gallery.json`, `vault-source/`, and `public/vault-assets/` are generated outputs. Local changes to these generated files will be replaced by the next import. The sync command also rebuilds the gallery inventory and forwards a custom source path to the importer.

The separately reviewed `src/data/gallery-stats-*.json` files contain core-stat transcriptions pinned to the original image hashes. Changed images require a fresh visual review; they cannot silently reuse stale statistics. These records are not independently D&D Beyond-verified and never generate spell-eligibility flags. Conditional values (including summoned-creature CR, AC, HP, or variant movement) remain unset and explained in notes.

Every note is imported in full, including templates and additional references. The importer converts wiki links, heading and block references, callouts, and asset embeds into web equivalents. Obsidian catalogue definitions become complete reference tables and finder links; Dataview queries become static tables. It does not execute Obsidian plugins or code.

Source snapshots retain original Markdown and catalogue definitions; asset copies retain original bytes. File hashes, link resolutions, transformations, and source counts are recorded in the audit. Unresolved source references remain recorded rather than silently disappearing.

`vault-source/` and the audit are repository/build inputs, not public web directories. Local absolute vault paths are not included in the website's catalogue or search responses. Only selected reference fields, relative note paths, rendered content, and the intended source assets are exposed by the website.

## Where things live

| Change | File or directory |
| --- | --- |
| Source vault importer | `scripts/import-vault.mjs` |
| Imported reference notes | `src/content/vault/` |
| Full original text snapshots | `vault-source/` |
| Navigation and note relationships | `src/data/vault-index.json`, `src/lib/vault.ts` |
| Collection schema | `src/content.config.ts` |
| Homepage and task shortcuts | `src/pages/index.astro` |
| Reference reader | `src/pages/library/[...slug].astro` |
| Spell, item, and form finders | `src/components/Catalog.astro`, `src/lib/catalog.ts` |
| Embedded creature gallery and reviewed image transcriptions | `scripts/build-form-gallery.mjs`, `src/lib/form-gallery.ts`, `src/lib/form-stats.ts`, `src/data/gallery-stats-*.json` |
| Saving throws, known saves, Concentration, expected damage, component costs | `src/pages/tools/index.astro`, `src/lib/calculators.ts` |
| Build progression matrix | `src/pages/builds/index.astro` |
| Comparison | `src/pages/compare.astro` |
| Search | `src/pages/search.astro`, `src/pages/search-index.json.ts` |
| Saved references | `src/lib/reading-list.ts` |
| Navigation and appearance | `src/components/layout/BaseLayout.astro`, `src/styles/global.css` |
| PDF editor | `src/pages/play/import.astro`, `src/features/pdf-sheet/` |
| Copied images and reference PDF | `public/vault-assets/` |

The previous website remains recoverable outside this checkout at `../revisions/website-overhaul-2026-10-06/pre-overhaul-site.tar.gz`, with its previous source in `../revisions/website-overhaul-2026-10-06/previous-src/`. Historical chapter/DOCX generation scripts are not update commands for this vault-based website.

Files in the parent project's `sources/` are read-only synced references. Do not edit, rename, or move them.

## Saved references and PDF sheets

**Save reference** adds a page to this browser's reading list; activate the same control again to remove it. The list uses `wizard-compendium-reading-list-v2`. It does not overwrite the former character profile or session keys.

The PDF editor at `/play/import/` displays the sheet itself. Edit supported fillable fields directly, or add editable text and a visual cover over printed values. **Save to browser** stores the original and latest edited PDF in the existing `wizard-compendium-pdf-sheets-v1` IndexedDB database. **Export PDF** downloads a new editable copy; **Download original** retrieves the unchanged upload.

Sheets and reading lists stay in this browser profile on this website origin. Localhost and the live site have separate storage, and data does not synchronize between devices. Clearing site data can remove saved copies, so export a backup after a session. A white cover hides printed text visually; it is not secure redaction.

The PDF workflow does not extract character statistics, perform OCR, or update D&D Beyond. Earlier character data remains separate. See [PDF sheet editing and privacy](docs/PDF_SHEET_EDITOR.md).

## Validate changes

```sh
npm run check
npm test
npm run validate:content
npm run build
npm run validate:build
npm run test:audit
```

Content validation checks original source hashes and metadata, stable note identities, complete source-word coverage, rendered note/asset links, and heading/block destinations. Build validation checks the generated website. Browser checks cover the rebuilt interface; they require the configured Chrome browser and use local test storage. PDF coverage can also be run with `npm run test:pdf:browser`.

For the import's evidence and limitations, see [Vault migration](docs/VAULT_MIGRATION.md). Passing local checks does not establish that these changes have been deployed.

## Hosting

The existing repository is [Asvenor/WizardCompedium](https://github.com/Asvenor/WizardCompedium). The existing Cloudflare configuration is in `wrangler.jsonc`; its static asset directory is `dist/`. Preserve the repository and deployment configuration when publishing a verified change, and confirm the deployed website afterwards.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at [D&D Beyond](https://www.dndbeyond.com/srd). The SRD 5.2.1 is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/legalcode). Source notes retain their further attribution and edition labels.
