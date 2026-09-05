# Final validation report

Validated against the full OneDrive copy of `Ultimate_Wizard_Compendium_FINAL_v1.14_DDB_Verified_Corrected.docx`.

## Source-to-site coverage

| Check | Source | Website | Result |
| --- | ---: | ---: | --- |
| Numbered chapters | 61 | 61 | Pass |
| Parts | 8 | 8 | Pass |
| Changelog | 1 | 1 | Pass |
| Direct paragraphs | 631 | Migrated through source-locator coverage | Pass |
| Top-level tables | 375 | Migrated cellwise, with nested-table handling | Pass |
| Nested tables | 193 | Migrated cellwise | Pass |
| Semantic content blocks | 928 | 928 | Pass |
| Source images | 1 | 1, in Chapter 20 | Pass |
| Canonical Compendium spell records | 155 | 155 | Pass |

Structural title and part-label blocks are represented by page metadata and navigation rather than duplicated in the chapter body. Every other semantic source block is traced to generated content by its stable source locator.

## Product verification

- 226 static HTML pages generated successfully.
- 217 content pages indexed by Pagefind.
- 4,938 generated internal links and asset references resolved successfully.
- A token-level fidelity audit found all 66,005 substantive source tokens represented in the migrated chapter files.
- Astro content schemas and type checks completed with zero errors, warnings, or hints.
- Search was exercised with `Wall of Force`; the spell page was the first result and linked chapter passages were returned.
- Spell filtering was exercised on the spell hub and returned the expected single record.
- Chapter navigation, wide-table overflow, responsive navigation, the Chapter 20 area-geometry image, and the source-warning presentation were visually inspected.
- All 61 chapters and the changelog are Markdown-first; spell records are structured JSON grouped by level.

## Editorial integrity

- Original content was preserved rather than shortened.
- No spell rules text was invented to fill fields that the Compendium did not restate. Those records display a source-check notice instead.
- Optimization tiers, build identities, acquisition roles, concentration, ritual, Dunamancy, and prepared-baseline semantics remain separate metadata systems.
- The German conversion chapter is preserved as a normal searchable content page.
