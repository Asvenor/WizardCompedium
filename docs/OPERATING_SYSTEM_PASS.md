# Wizard workflow pass

## Audit / decisions

- Preserve Astro, 61 chapters, 155 canonical spells, existing build/progression logic and Cloudflare Git deployment.
- Reuse source tables at build time for short task references; do not copy or invent rules.
- Optional versioned browser notebook is separate from the existing profile. Nothing personal enters URLs or a backend.
- Unknown spell data is not a no-save guarantee. Schools and durations are absent throughout; 73 entries lack indexed casting time/range. Filters must expose unknowns conservatively.
- Search needs tools/builds/German categories and shareable filters. Static pages must remain useful without scripts.
- Manual resource, gear and campaign planning is preferable to unsupported automatic optimization.

## Work phases

1. Audit existing architecture/content/responsive design.
2. Shared state, schema, search and link validation.
3. Task homepage and play references.
4. Spell filters/details.
5. Source-linked relationships/comparison/replacement ladders.
6. Profile dashboard.
7. Level-up guidance.
8. Preparation coverage.
9. Acquisition/components/security.
10. Probability/initiative/resources.
11. Builds, gear, campaign, mission checklists.
12. Learning practice.
13. Tables, responsive and print layouts.
14. Accessibility, correctness and production checks.
15. Owner documentation, final audit, commit and push.

## Acceptance evidence

Validated 2026-09-06 before publication:

- Astro check: 73 files, zero errors or warnings.
- 11 regression tests pass (probability, components, profile/notebook validation, source table preservation and spell-name matching).
- Production build: 257 static pages.
- Link checker: 10,852 links/assets and 1,154 anchors, including generated search result destinations.
- Search: 155 spells, 61 chapters, 7 builds, 26 tools, 56 German terms, 1 reference.
- Source audit: all 928 migrated blocks remain; 66,069 / 66,069 substantive source tokens represented. Chapter 60's conservation warning moved out of a layout row; its text is unchanged.
- Sleet Storm's control/terrain tags are supported by its existing summary and Chapter 14 ladder; no mechanics or tier was invented.
- Browser workflows verified on the actual static output: no profile, saved profile, reload, concentration replacement warning, combined spell filters, 2–4 comparison, mission save/reload, level-up, six-defense odds, expected damage, component totals, planned-list import, attunement duplicate warning, GP and reserve persistence, learning reveal/grade, pins and full local-data reset.
- Ten major routes checked at 390, 768 and 1280 pixels: no page-wide horizontal overflow. Wide comparison tables scroll inside their region; readable comparison notes remain outside them.
- Keyboard skip link focuses main content with a visible outline. Native mobile menu works. No browser errors observed.
- Static chapter/spell/reference HTML and no-script fallback inspected. No full browser-level JavaScript-disabled session was available through the test interface.
- No runtime dependencies, authentication, backend, AI service, repository or hosting configuration added.

## Conservative boundaries

- Missing school/duration/casting/range and exact mechanics remain unknown; this pass does not invent complete spell rules.
- Source acquisition lanes cover spells explicitly named in Chapter 11, not every possible spell.
- Build comparisons use source fit, emphasis, tradeoffs and timing. No fabricated difficulty/power scores or universal item rankings.
- Reaction profile matches still require source permission, legal triggers, prepared access and available resources. Stored lists alone do not imply configured character levels.
- Slots, Arcane Recovery, initiative feature stacking, three crafting projects, attunement and GP are manual planning aids—not automatic legal validation or expenditure.
- Campaign switches record assumptions and link to conditional guidance; rankings do not change automatically.
- Print uses CSS and currently expanded quick-reference content; no replacement PDF. Recently viewed was optional and deliberately omitted in favor of explicit pins.

## Product review

New optimizers can choose a route and follow a source-backed plan; experienced users can filter, compare and jump into deep references. At-table tasks live in Play, while between-session work lives in My Wizard and the planners. The original Compendium remains the complete reference underneath. New code is formatted and source-table dependencies are documented in README.
