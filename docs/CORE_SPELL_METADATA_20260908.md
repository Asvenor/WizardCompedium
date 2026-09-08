# Core spell metadata completion — 8 September 2026

Seven existing website spell cards now expose previously verified 2024 metadata held in the read-only V2 registry. This is a narrow projection, not a new full-rule verification. The original verification date remains **5 September 2026**.

## Fields completed

| Spell | School | Duration | Components |
| --- | --- | --- | --- |
| Shield | Abjuration | Until the start of your next turn | V, S |
| Web | Conjuration | Up to 1 hour | V, S, M |
| Misty Step | Conjuration | Instantaneous | V |
| Counterspell | Abjuration | Instantaneous | S |
| Fireball | Evocation | Instantaneous | V, S, M |
| Detect Magic | Divination | Up to 10 minutes, with concentration | V, S |
| Find Familiar | Conjuration | Instantaneous | V, S, M |

Changed 36 existing metadata fields: seven schools, seven durations, twenty previously unknown component flags, Find Familiar's missing 10 gp cost, and its material description. All other existing spell metadata and all migration locators remain unchanged. Source-review notices identify the precise projected fields and their historical verification date.

Find Familiar's old website description mixed charcoal, herbs and a fireproof vessel into a card labeled 2024. It was corrected to the verified 2024 burning-incense requirement, worth at least 10 gp and consumed. The original DOCX, migrated chapter wording and V2 records were not altered. This fixes the card and its component-calculator entry without blending versions.

## Evidence and validation

The [projection manifest](../src/data/core-spell-metadata-projection.json) records every changed field, its previous value, owner pointer, claim ID, verification date, owner-value hash and source-revision hashes. All mapped claims are `verified_primary`; Web's separately conditional resolution procedure was not copied.

Owner lifecycle and field verification remain separate: Shield, Web and Misty Step have approved V2 owners; Counterspell, Fireball, Detect Magic and Find Familiar remain in the V2 review lifecycle. Their individually verified metadata claims support this limited projection, not a claim that those entire modules or their tactical analyses have received final approval.

The official [SRD 5.2.1 PDF](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf) was confirmed reachable as that exact edition on 8 September. The retained local PDF's SHA-256 matches the original verification record. This availability and integrity check does not claim a new comprehensive reading of all spell rules or subsequent errata.

Regression tests compare website output with the manifest. When the V2 registry is present, they additionally verify owner values, claims, source-revision locks and the cached reference hash. In standalone website checkouts, the source-registry test is explicitly skipped; the output and scope checks still run.

SRD attribution and its CC-BY-4.0 license are retained in the project README.

## Boundaries and remaining gaps

- Wall of Force has no corresponding approved V2 owner; its missing school/duration were not invented.
- Web and Fireball's material flags are known, but this pass does not add an ordinary-material row to the priced-component calculator or guess a price or consumption field. Their specific material descriptions remain absent from the cards.
- Other unfilled schools, durations, casting details, range, source-dependent mechanics and unranked tiers still require source-backed work. Acquisition categories are not universal letter tiers.
- No character records, original documents, research intake files or canonical V2 owners were changed. No publication is performed by this projection.
