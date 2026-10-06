---
title: Summon Damage Benchmarks
slug: tactics/summon-damage-benchmarks
section: tactics
sectionLabel: Combat & tactics
type: reference
summary: These static benchmarks compare the revised Conjurer and Necromancer at the same character level and with the same spell-slot budget. They turn the build guide's all-hit examples into accuracy-adjusted expectations.…
sourcePath: 007 Tactics/Summon Damage Benchmarks.md
updatedAt: 2026-09-20T13:53:09.826Z
metadata: {}
---

[Arcana Unleashed Builds](/library/character/arcana-unleashed-builds/) · [Arcana Unleashed Combinations](/library/tactics/arcana-unleashed-combinations/) · [Concentration Strategy](/library/tactics/concentration-strategy/) · [Spell Finder](/library/home/spell-finder/)

These static benchmarks compare the revised Conjurer and Necromancer at **the same character level and with the same spell-slot budget**. They turn the build guide's all-hit examples into accuracy-adjusted expectations. They are optimization models, not promises about an encounter or a claim that damage is the Wizard's only job.

## Packages and resource assumptions

Use the pure-Wizard builds in [Arcana Unleashed Builds](/library/character/arcana-unleashed-builds/), with **INT 20**, no magic-item attack bonus, and the required materials available. Both packages empower an existing familiar as a **Flyer**; the Necromancer's familiar has the Undead creature type. The familiar uses its own Initiative. The separately summoned spirit or spirits act immediately after the Wizard.

| Wizard level | Shared slot expenditure | Conjurer package | Necromancer package |
|---:|---|---|---|
| 8 | Two level-4 slots | Battle Familiar 4 + one Fuming Summon Fey 4 | Battle Familiar 4 + one Skeletal Summon Undead 4 |
| 14 | One level-4 and one level-6 slot | Battle Familiar 4 + **two** Fuming Fey from Summon Fey 6 and Splintered Summons | Battle Familiar 4 + one Skeletal Summon Undead 6 |

At 8, this spends both ordinary level-4 slots. At 14, it spends the single level-6 slot and one level-4 slot. The Conjurer also spends its available **once-per-Long-Rest Splintered Summons use**; no restoration slot is included. The Necromancer has no corresponding subclass-use charge for Withering Strike. This is equal slot expenditure, not identical feature expenditure. No army, other pre-existing summon, or additional support spell is added to either side.

The familiar's empowerment is non-Concentration; the spirit spell takes Concentration. The Necromancer holds its spellbook and keeps both Undead within **60 feet** for the +5 Necrotic damage on each attack hit. All required spells are legally acquired and prepared in the build guide. At level 14, the same preparation choices remain legal; the larger preparation limit allows additional defenses, which are not assigned free damage here.

Required reusable components include a **25+ GP diamond** for Battle Familiar and a **300+ GP gilded flower/skull** for the selected spirit. Creating the underlying familiar requires Find Familiar's consumed **10+ GP incense** and its **one-hour casting time**, or **one hour ten minutes as a ritual**. That ordinary familiar already exists in both setup scenarios below; neither scenario pretends its creation happens during a combat turn.

Sources: [Battle Familiar - Spell](/library/spells/spell-cards/battle-familiar-spell/), [Summon Fey - Spell](/library/spells/spell-cards/summon-fey-spell/), [Summon Undead - Spell](/library/spells/spell-cards/summon-undead-spell/); [Conjurer and Necromancer](https://www.dndbeyond.com/sources/dnd/au/chapter-1-character-options); [Wizard slot progression](https://www.dndbeyond.com/sources/dnd/phb-2024/character-classes-continued#Wizard).

## Accuracy and critical-hit assumptions

- Spell attack bonus is **+8 at Wizard 8** and **+10 at Wizard 14**: INT +5 plus the appropriate Proficiency Bonus.
- Targets have the displayed AC, enough remaining HP for the modeled attacks, no relevant Resistance/Immunity, and no cover. All creatures can reach a legal target; the Skeletal spirit is not forced into ranged-attack Disadvantage by an adjacent enemy.
- Each Fuming Fey uses its own Bonus Action teleport before attacking, granting Advantage on **its first attack only**. Subsequent attacks, and all familiar/Skeletal attacks, use ordinary rolls. There is no assumed Help, flanking, surprise bonus, other Advantage, or Disadvantage.
- A natural 1 misses and a natural 20 critically hits. Ordinary critical chance is **5%**; with Advantage it is **9.75%**. Critical hits double the rolled damage dice, **not** the flat spell-level or Withering Strike bonuses.
- All modeled creatures remain active and can take their turns; Concentration and familiar empowerment last throughout. Death, dispelling, lost positioning, broken Concentration, failed commands, or depleted Temporary HP reduce actual output. These are conditional damage expectations, not a simulation of survivability.
- Wizard damage, opportunity attacks, familiar Help, enemy reactions, healing, control value, overkill, and damage prevented are excluded. A free Wizard action is not silently converted into a successful damaging spell.

For one attack, let `p` be the hit probability **including** critical hits, `c` the critical probability, `D` the mean of the normal damage dice, and `F` the flat damage bonus:

`Expected damage = p × (D + F) + c × D`

For an ordinary roll, `p = clamp((21 + attack bonus − AC) / 20, 0.05, 0.95)`. With Advantage, use `1 − (1 − p)²`; the critical probability becomes `1 − 0.95²`. All totals below were calculated before rounding.

Attack/critical rules: [2024 Playing the Game](https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game#AttackRolls) and [Critical Hit](https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#CriticalHit). The probabilities are calculated from those dice rules, not supplied by the books.

## Familiar empowered before combat

Spend the level-4 Battle Familiar slot before combat, with enough of its one-hour duration remaining. In **round 1**, spend the Wizard's Action and the other listed slot to summon the spirit; it acts immediately afterward. The already empowered familiar gets its own turn in each of the three rounds, whether its Initiative is before or after the Wizard. Rounds 2–3 do not require another summoning Action. The Wizard's remaining actions are excluded rather than treated as free damage.

| Wizard level | Enemy AC | Conjurer: expected damage per full package turn | Necromancer: expected damage per full package turn | Conjurer: three-round total | Necromancer: three-round total |
|---:|---:|---:|---:|---:|---:|
| 8 | 16 | 37.82 | 44.50 | 113.45 | 133.50 |
| 8 | 18 | 33.00 | 37.80 | 98.99 | 113.40 |
| 8 | 20 | 27.90 | 31.10 | 83.69 | 93.30 |
| 14 | 16 | 98.47 | 68.70 | 295.40 | 206.10 |
| 14 | 18 | 87.85 | 59.70 | 263.54 | 179.10 |
| 14 | 20 | 76.59 | 50.70 | 229.76 | 152.10 |

**Arithmetic examples against AC 18:** at Wizard 8 the Necromancer has a 55% ordinary hit chance. Each familiar attack averages `0.55 × 16.5 + 0.05 × 4.5 = 9.30`; each Skeletal attack averages `0.55 × 17 + 0.05 × 5 = 9.60`. Two of each total **37.80**, rather than the **67** all-hit, non-critical illustration.

At Wizard 14 the Conjurer has a 65% ordinary hit chance and an 87.75% Fuming-first-attack hit chance. Each Fey averages **36.2225** across one advantaged and two ordinary attacks. Both Fey total **72.445**; the two familiar attacks add **15.40**, giving **87.845**. This is the accuracy-adjusted counterpart to **96** all-hit damage from the two Fey alone or **119** with the familiar, not an extra damage bonus added on top of them.

## Both combat spells still need casting

For a second, explicitly different setup, only the ordinary familiar exists when combat begins. Against **AC 18**, cast the **spirit in round 1**, then empower the familiar with **Battle Familiar in round 2**. Each uses a separate Wizard Action and slot on a separate turn. The spirit receives three attacking turns; the familiar's combat attacks depend on whether its round-2 turn happened before its upgrade.

| Wizard level / route | Three rounds if familiar acts **before** Wizard | Three rounds if familiar acts **after** Wizard |
|---|---:|---:|
| 8 Conjurer | 72.79 | 85.89 |
| 8 Necromancer | 76.20 | 94.80 |
| 14 Conjurer | 232.74 | 248.14 |
| 14 Necromancer | 135.30 | 157.20 |

Before-Wizard familiar: only its round-3 turn supplies empowered attacks, so the total is `3 × spirit output + 1 × familiar output`. After-Wizard familiar: it attacks in rounds 2 and 3, giving `3 × spirit output + 2 × familiar output`. No new favorable Initiative roll, retroactive round-2 attack, or automatic Initiative swap is assumed. The Human's Alert option could change the chosen order, but would exchange another creature's place; it is not counted as a free extra turn. The familiar must also be within Battle Familiar's casting range when empowered.

Casting Battle Familiar first instead gives only **two spirit turns** over this window. That order may still be necessary for positioning or the encounter plan; it is not secretly included in the stronger numbers. If the familiar also needs to be created, neither of these quick setups applies.

## What the comparison actually supports

- **Level 8:** with these equal slots and target assumptions, the Necromancer's flat damage to both Undead beats the one-Fey Conjurer package. Conjurer durability and mobility can still matter more than this damage difference.
- **Level 14:** the Conjurer's additional spirit creates the larger damage result, but relies on its late subclass feature and spends that limited use. It does not justify claiming the same output at earlier levels.
- **Setup matters:** pre-casting saves an in-combat Action; it does not refund the slot, remove the duration limit, or guarantee advance warning. A short fight can end before a two-spell package recovers its setup cost.
- **The assumptions can reverse priorities:** Necrotic Immunity severely undermines the Skeletal/Withering package; unreachable melee targets undermine Fey and familiar attacks. If neither Fey can obtain Fuming Advantage, the level-14 Conjurer package against AC 18 falls to **79.90 per full package turn / 239.70 over three rounds**, even before other losses. Control, terrain, and survival belong in the final spell choice.

Use this page to compare an available plan with its costs—not to add a guaranteed damage figure to every encounter. For companion forms, command rules, and alternatives, return to [Summoning](/library/creatures/summoning/) and [Arcana Unleashed Builds](/library/character/arcana-unleashed-builds/).
