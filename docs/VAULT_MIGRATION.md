# Obsidian website migration — 6 October 2026

The rebuild imports the active OneDrive Wizard Compendium Vault as read-only source material. It replaces the previous chapter website's structure with a complete, linked reference library and dedicated spell, item, and form finders.

## Source inventory

| Material | Count |
| --- | ---: |
| Markdown notes | 422 |
| Spell cards | 208 |
| Magic-item cards | 51 |
| Creature cards | 20 |
| Core spell progression routes | 35 |
| Optional Illusion Adept progression | 1 |
| PNG images | 110 |
| Reference PDF | 1 |
| Obsidian catalogue definitions | 2 |

Templates remain in the library but are excluded from the spell, item, and form catalogues. The source folder contains 212 spell-section notes; this includes reference notes as well as the 208 individual spell cards. A template's `type: spell` or `type: creature` does not turn it into a playable rules record.

## Preserved content

Every note body is imported without a paragraph or length limit. All original YAML fields, tables, source attribution, rules versions, RAW/analysis distinctions, caveats, and verification scope remain available. Spell access fields are additionally derived from each source card's literal Access row where present; unavailable details are not invented.

Wiki note links become stable `/library/{slug}/` URLs. Heading links use the rendered Markdown anchors; block references use explicit `block-{id}` anchors. Callouts retain their titles and content. The reader supplies the note title, so the first source H1 is removed from its body and subsequent H1 sections become H2 sections.

The two `.base` catalogues become complete reference tables with searchable finder links. All seven Dataview queries become static creature tables with their source filters and sort order applied. Neither Obsidian plugins nor source code are executed.

Image files and the PDF retain their exact original bytes. Rendered PNG images have intrinsic dimensions, lazy loading, and asynchronous decoding. Original Markdown and catalogue definitions are copied into `vault-source/`; they are not exposed as public files. The import audit records the source version, file hashes, transformations, and unresolved references.

## Migration checks

`node scripts/import-vault.mjs --check` confirms deterministic outputs for the imported source. `node scripts/validate-vault.mjs` validates snapshots and renders every imported note through Astro's Markdown processor.

The completed migration checks report:

- 535 original source files accounted for, with matching snapshot or asset hashes.
- 422 complete note pages, with no duplicate note slugs or rendered anchors.
- 7,833 rendered note references, 128 asset references, and 571 heading/block references resolved.
- Zero unresolved or ambiguous source file references and zero unresolved heading/block targets.
- 204,481 of 204,481 source body words retained under the defined conversion comparison.
- The original vault unchanged during import.

Source-word coverage compares text within each original note. It excludes the first H1 supplied by the reader, executable-plugin query text replaced by tables, image-link filenames represented by preserved assets, and structural callout markers. It checks preservation, not independent rules accuracy, and is supplemented by metadata, hash, and rendered-link validation.

These results describe content migration and local verification. They do not establish publication or a fresh review of every D&D source. Existing source claims of checked metadata, scoped verification, inherited references, or DM-dependent interpretation keep their original limits.

## Updating later

```sh
npm run sync:vault -- --source="/absolute/path/to/Wizard Compendium Vault"
npm run validate:content
npm run check
npm test
npm run build
npm run validate:build
```

Edit the vault first; generated note files and snapshots are rebuilt by the importer. Keep the original vault backed up separately. Review import warnings and website output before publishing.

The previous website was retained in `../revisions/website-overhaul-2026-10-06/pre-overhaul-site.tar.gz` and `../revisions/website-overhaul-2026-10-06/previous-src/`. No source-vault file was edited to complete the rebuild.
