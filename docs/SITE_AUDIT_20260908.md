# Website polish and correctness pass — 8 September 2026

Baseline: `490537f4510b74cabd53c44c82b8120161543f09`, branch `codex/content-restoration`. The existing Astro static website was repaired in place. Original documents, synced sources, canonical V2 owners and personal character data were not changed.

## Reader-facing improvements

- The chapter directory now has one chapter per row, clear column headings, improved spacing, a chapter/title/section filter and an explicit no-results state. Chapter 42 was duplicated by the old three-column grouping; all 61 chapters now appear exactly once in each responsive representation.
- On phones, frequently used shortcuts initially collapse so the chapter filter is visible without scrolling through 36 links. The shortcuts remain expandable, and all directory content remains available without JavaScript.
- Tier hues retain their S/A/B/C/D meaning, with softer backgrounds and dark labels. The 147 spells without an authored fixed tier now have an explicit neutral “No fixed tier” badge in the database and a matching filter. Acquisition roles were not converted into invented rankings.
- Search keeps the typed query and selected category if loading fails, offers Retry and a chapter-directory fallback, and uses the current text when loading finishes. A bounded request timeout prevents indefinite loading. Search text is normalized once when the public index loads rather than across every chapter on every keystroke.
- Ctrl+K and Command+K focus the current search field without dropping its query. The mobile menu closes before search focus, Escape closes the menu, and the active mobile navigation item is identified. Search focus is visible, phone typography is less cramped, and reduced-motion preferences are respected.

## Functional and content corrections

- Character imports derive totals from complete class summaries in both form-field and text layouts. Editing classes updates derived totals without replacing an explicitly reported total. Partial, duplicate, unsupported and conflicting class summaries do not unlock automatic progression advice.
- Different multiclass casting statistics remain ambiguous across pages. Spell level, class source, rules generation and ritual conflicts are respected by personal guidance. Recommendations are deduplicated, and snapshot comparisons distinguish an explicit No from an unconfirmed value.
- Readers can exclude a misread spell entry, return to an unsaved review, and cancel replacement of that review. Concurrent import attempts are guarded; missing local character links explain the browser-storage boundary. Snapshot history queries use the existing character index.
- Maintained spell aliases restore missing relationships, including Resilient Sphere. “Globe” is only resolved within the source's named Chapter 14 ladder, not generic prose. Build badge identities are handled consistently; most non-Bladesinger combinations were a latent mapping defect, not currently populated incorrect badges.
- Character import and saved-character access are now discoverable through the tools/search directory.
- Thirty-six metadata fields across seven core spells were completed from retained primary-source claims. Find Familiar's 2024 component requirement and 10 gp consumed cost were corrected. The browser calculator test verifies quantities, retained versus consumed costs, partial totals, user-entered prices and clearing. See [metadata evidence and boundaries](CORE_SPELL_METADATA_20260908.md).

## Content coverage and remaining source work

The migration audit preserves all 61 chapters, 928 migrated blocks, and all 66,069 substantive source tokens across 856 source blocks. No lost chapter passages were found.

The 171 structured spell cards are a separate index, not a complete reproduction of every official spell field. After this pass, 148 schools, 144 durations, 73 casting times and 73 ranges remain unknown. Those gaps are recorded honestly and require further primary-source work. The 147 absent fixed tiers are an editorial/source boundary, not mechanical fields to guess. No full-rule reverification or complete adjudication of every tactic is claimed.

## Validation

- `npm run check`: zero errors, warnings or hints across 76 Astro files.
- `npm test`: 62 tests pass, including parser, rules-safety, calculator, search, source-projection, table and Cloudflare configuration regressions.
- Production build: 274 generated HTML pages; 171 unique spell records validated.
- Built-link validation: 11,601 links/assets and 1,234 anchors pass.
- Content migration, source fidelity and character-contract checks pass.
- Browser suite: 21 scenarios covering all generated pages, desktop/phone navigation, directory filtering, search failure/recovery, component totals, real fixture PDF extraction, local OCR, manual correction, snapshot history, concurrent-tab protection, privacy and keyboard access.
- Automated accessibility and page-overflow checks cover 12 representative routes at both 390 px and 1,440 px. No detected WCAG A/AA violations, page-wide horizontal overflow or uncaught browser exceptions in those checks. This is not a claim of exhaustive accessibility conformance.
- The Cloudflare runtime preview verifies security headers, caching, trailing-slash redirects, branded 404 responses and byte-identical PDF/OCR assets. See [Cloudflare audit](CLOUDFLARE_AUDIT.md).

The `cloudflare:web-perf` skill's specialized performance trace was paused because Chrome DevTools MCP was unavailable. No Lighthouse score, Core Web Vitals result or quantified speed improvement is claimed. Browser functionality, layout and code-level work continued independently.

## Publication boundary

Cloudflare's production and preview build-command corrections are already saved and independently re-read. No new deployment was triggered. Website changes, new security headers, persistent static-hosting configuration and validation-only GitHub workflow are local and tested, but not committed, pushed or published in this pass. Release requires those repository changes to reach the deployment branch and a successful Cloudflare build, followed by live verification.

The local Cloudflare preview is available at `http://127.0.0.1:9797/` while its development process remains running. Localhost and the public site have separate local character storage.
