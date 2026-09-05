# Ultimate Wizard Compendium website

This is the complete static website migration of `Ultimate_Wizard_Compendium_FINAL_v1.14_DDB_Verified_Corrected.docx`.

## Where things live

- `src/content/chapters/` — one readable Markdown file per chapter, plus the changelog.
- `src/content/spells/` — one canonical JSON record per spell, grouped by level.
- `src/pages/` — the landing page, content hubs, spell database, search, and generated detail routes.
- `src/components/` — the small reusable presentation layer.
- `src/styles/global.css` — all global design tokens, including tier and build colors.
- `src/data/` — generated navigation, Problem Navigator, and migration coverage data.
- `scripts/migrate-compendium.mjs` — repeatable DOCX-extract-to-site migration.
- `scripts/validate-migration.mjs` — content coverage and link checks.
- `docs/MIGRATION_AUDIT.md` — the complete 61-chapter source inventory.

## Common edits

### Change a chapter paragraph

Open the matching file in `src/content/chapters/`. Chapter numbers are at the start of every filename.

### Change a spell rating or summary

Open that spell's JSON file in `src/content/spells/`. The spell hub and detail page both read from this record.

### Add a spell

Copy a nearby JSON record in the correct level folder, give it a unique `id`, and edit its fields. It will appear automatically in the spell database and receive its own page.

### Change a tier or build color

Edit the `--tier-*` or `--build-*` variables near the top of `src/styles/global.css`.

### Add a chapter

Copy one Markdown file in `src/content/chapters/`, update its frontmatter, and add it to `src/data/chapters.json`. The generic chapter route handles rendering.

### Add a future tool

Create an isolated feature under `src/components/features/` and expose it through a page in `src/pages/tools/`. The content collections do not need to change.

## Local development

```sh
npm run dev
```

## Validation and production build

```sh
npm run check
npm run validate:content
npm run build
```

The production build runs Pagefind after Astro, so full-site search is generated into `dist/pagefind/`.

## Regenerating the migration

The migration script reads the verified OneDrive extraction in `Wizard_Compendium_V2/01_Audit/extracted/`. Running it replaces only the generated chapter and spell content folders in this website.

```sh
npm run generate:content
```

The original DOCX and all existing audit files remain unchanged.
