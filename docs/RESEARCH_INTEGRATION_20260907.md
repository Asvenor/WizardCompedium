# Wizard-filtered research integration — 7 September 2026

Integrated into the existing Wizard Compendium website, not the original DOCX or a regenerated V2 release. This is a scoped research integration, not a claim that every rule in the whole compendium has been reverified.

## Coverage and access

| Research inventory | Disposition |
| --- | --- |
| 87 spell records | 16 new Wizard-list cards; 14 existing cards expanded; 54 existing cards retained; 3 handled through explicit special access |
| Summon Beast | Illusionist's Phantasmal Creatures at Wizard 6; no ordinary Wizard card |
| Giant Insect | Wish menu, normally Wizard 17; no ordinary Wizard card |
| Revivify | Wish menu, normally Wizard 17; no ordinary Wizard card |
| 18 combo records | Each mapped to a supported, conditional or disputed treatment |
| 21 grouped Wish research rows | Split/deduplicated into 23 named targets; added Giant Insect, Revivify and current Find Steed for 26 separate rows |
| Familiar ranking | Existing Chapter 24 is broader; preserved rather than replacing it with the shorter research ranking |
| Fighter/Diviner progression | Chapter 9 explains legal allocation and separate Savant choices; Chapter 10 remains the single ordinary level-up roadmap |
| Concentration guide | Chapter 45 adds conditional encounter choices; existing matrix retained |

The machine-readable [inventory](../src/data/research-integration-20260907.json) records each of the 87 spell and 18 combo dispositions. "Existing-retained" means no duplicate entry was necessary; it is not certification of every research sentence.

### Sixteen added Wizard-list cards

- [Tasha's Hideous Laughter](../src/content/spells/level-1/tashas-hideous-laughter.json)
- [Chromatic Orb](../src/content/spells/level-1/chromatic-orb.json)
- [Darkvision](../src/content/spells/level-2/darkvision.json)
- [Borrowed Knowledge](../src/content/spells/level-2/borrowed-knowledge.json)
- [Mind Spike](../src/content/spells/level-2/mind-spike.json)
- [Major Image](../src/content/spells/level-3/major-image.json)
- [Tiny Servant](../src/content/spells/level-3/tiny-servant.json)
- [Tongues](../src/content/spells/level-3/tongues.json)
- [Summon Fey](../src/content/spells/level-3/summon-fey.json)
- [Wall of Fire](../src/content/spells/level-4/wall-of-fire.json)
- [Summon Greater Demon](../src/content/spells/level-4/summon-greater-demon.json)
- [Mordenkainen's Faithful Hound](../src/content/spells/level-4/mordenkainens-faithful-hound.json)
- [Circle of Power](../src/content/spells/level-5/circle-of-power.json)
- [Danse Macabre](../src/content/spells/level-5/danse-macabre.json)
- [Mordenkainen's Sword](../src/content/spells/level-7/mordenkainens-sword.json)
- [Weird](../src/content/spells/level-9/weird.json)

Each has a tier, practical guidance, review scope and source links. Tiers are Compendium editorial assessments, not invented verbatim Pack Tactics grades. Existing tiers and route ratings are retained.

### Updated chapters

- Chapter 6: Illusionist access, normal Summon Fey versus feature-specific Summon Beast, component and slotless-scaling caveats.
- Chapter 9: Fighter-start gate, fixed preparation count, two normal spells per Wizard level, separate Divination Savant examples and mastery timing.
- Chapter 11: 160 ownership rows (144 preserved plus 16 additions), conditional acquisition priorities and access boundaries.
- Chapter 22: worked two-caster containment, 21 core Wish targets, five conditional expanded leads, and disputed subclass/storage interactions.
- Chapter 30: 2024 rest-casting timing and continuing costs/durations.
- Chapter 37: Contact Other Plane question search, Locate Object with Phantom Steed, Rope Trick shelter and language/skill gaps.
- Chapter 45: concentration alternatives, allied access and action/concentration tradeoffs.

## Verification boundary

Primary references include [the official Wizard list](https://www.dndbeyond.com/spells/class/8-wizard), named D&D Beyond spell entries, [SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2.1/SRD_CC_v5.2.1.pdf), [official errata](https://www.dndbeyond.com/sources/dnd/sae/players-handbook), and licensed Roll20 entries. New spell cards retain their individual reference URLs.

The full paid mechanics of Borrowed Knowledge, Tiny Servant, Summon Greater Demon and Danse Macabre were not independently available. Their Wizard-list access and displayed metadata were checked; their detailed use remains explicitly source-gated. Summon Fey's spell text, component and command timing were checked, but the special slotless Illusionist stat-block calculation was not rederived.

Temple of the Gods, Find Greater Steed, Create Homunculus, Dark Star and Druid Grove remain visibly conditional Wish leads with the exact details requiring a source check. They are not published as guaranteed tactical packages.

Supplied video timestamps preserve provenance only. The package reports local speech-to-text evidence; this pass did not newly inspect full transcripts or independently validate exact creator quotations. Generic editorial advice is not falsely attributed as a quote.

## Research claims corrected or not adopted

- Foresight and True Resurrection are not ordinary Wish duplication targets.
- No automatic eighth-level Aid, flying Find Steed or maximum-duration Planar Binding assumed from base duplication.
- Contact Other Plane and Phantom Steed take eleven minutes when cast as rituals.
- A long Planar Binding cast requires concentration; a separate summon holder does not by itself solve the one-hour duration boundary.
- Phantom Steed's normal controlled-mount Dash and Disengage are alternatives, not a combined 200-foot disengaging move.
- A non-cantrip interrupts a 2024 Long Rest and adds time on resumption; no instant spent-slot recovery.
- Heroes' Feast still needs its consumption period, and Clone still needs 120-day maturation.
- Illusory Reality requires an Illusion cast with a slot; no Minor Illusion cantrip cage or imposed conditions.
- The research's slotless Summon Fey zero-attack claim is not settled here.
- Compelled willingness, portable glyph batteries and action-speed stored huts remain disputed.
- Prepared count uses the 2024 class table; research wishlists are not extra free level-up spells.

## Validation

- 16 automated tests pass, including Wizard access dispositions, tier presence, 26 distinct Wish rows, source warnings, search text, and 600 gp retained total for Chromatic Orb + Summon Fey + Mordenkainen's Sword.
- Astro checks: no errors, warnings or hints.
- Production build: 273 pages; Pagefind indexes 233 compendium/spell pages.
- Internal link, asset and anchor validation passes.
- Content validation: 61 chapters plus changelog, 171 spell records, 928 migrated blocks.
- Source fidelity: all 856 substantive source blocks represented; 66,069/66,069 source tokens, 100% coverage; no failures.
- All supplied research-package checksums pass; original documents, intake files and V2 canonical records were not changed.
- Browser-rendered content inspected for Summon Fey and the Chapter 22 Wish menu: access, cost, practical-use sections, tables, source disclosures and chapter anchors appear. This was a targeted content check, not a full responsive regression audit.

## Delivery state

Local working tree on the existing content-restoration branch. No commit, push, merge or Cloudflare deployment was performed. The original migration count remains 155; the validator now accounts separately for the 16 named research additions. Full V2 generation/migration remains a separate undertaking.

SRD attribution is included in the README and Chapter 22. Original sources and prior audit reports are preserved.
