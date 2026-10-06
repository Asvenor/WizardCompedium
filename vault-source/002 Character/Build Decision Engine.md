---
cssclasses: [wizard-tools]
type: build-guide
status: active
rules_version: "2024 core; revised Artificer from Eberron: Forge of the Artificer (2025)"
rules_status: "Optimization analysis"
sources:
  - "https://www.dndbeyond.com/sources/dnd/br-2024/feats"
  - "https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character#Multiclassing"
  - "https://www.dndbeyond.com/sources/dnd/br-2024/character-classes#Cleric"
  - "https://www.dndbeyond.com/classes/2656866-artificer"
  - "https://www.dndbeyond.com/sources/dnd/phb-2024/feats#WarCaster"
  - "https://www.dndbeyond.com/sources/dnd/phb-2024/feats#Resilient"
  - "https://www.dndbeyond.com/sources/dnd/phb-2024/feats#Telekinetic"
verified: false
verification_scope: "Core 2024 rules previously checked; revised Artificer starting and multiclass benefits, level-1 casting and level-2 feature checked against the signed-in final class page; optimization remains conditional"
last_checked: 2026-09-12
---
# Build Decision Engine

**For exact level-up spell picks, open [[Spell Progression Hub]].** It supplies complete no-copy acquisition routes; this page explains the build tradeoffs.

[[Home]] · [[Level Progression Planner]] · [[Worked Wizard Builds]] · [[Prepared Loadouts]] · [[Character]]

This guide covers **Abjurer, Bladesinger, Chronurgy, Conjurer, Diviner, Illusionist, and Necromancer**, each as pure Wizard or with an Artificer, Fighter, or Cleric dip. None is the flagship or default choice. Compare an improvement by the problem it solves and the Wizard milestones it delays; equal presentation does not mean identical benefits.

## Choose the next upgrade

1. **Find the bottleneck.** What actually caused lost turns, failed objectives, broken Concentration, or retreats in the last few sessions?
2. **Check a cheap fix.** Positioning, a different prepared spell, a ritual, a consumable, or an ally's feature may already solve it.
3. **Compare the next level.** Identify the precise Wizard spell level, subclass feature, or feat delayed by a dip.
4. **Check the campaign horizon.** A payoff at level 14 has little value if the campaign ends at 10.
5. **Compare alternatives.** Prefer the option whose benefit solves the bottleneck before the campaign ends. Reassess that preference when the campaign changes.

## If this keeps happening

| Observed problem | First improvement to examine | Evaluation criterion |
|---|---|---|
| You act after enemies have scattered or disabled you | Initiative support, Alert access, safer approach | Does going earlier let control remove enemy actions? |
| Concentration repeatedly breaks to damage | Cover/range, then War Caster or eligible Resilient (CON) | Number and DC of actual concentration saves |
| You survive but enemies pass key saves | Raise INT when it crosses a modifier threshold; vary saves or use terrain | Observed defenses, not presumed monster statistics |
| Slots run out too early | Better sustained control, rituals, Arcane Recovery, useful cantrips | How many slots changed the encounter rather than adding minor damage? |
| Party lacks emergency rescue | Prepare a suitable escape or rescue spell; consider legal Magic Initiate access | Can you reach and extract the ally before they die? |
| You cannot reliably afford your best spells | Acquisition plan and less expensive alternatives | Retained components, consumed components, copying fees, downtime |
| You have many strong spells but slow turns | A smaller active loadout and [[Combat Dashboard]] | Time to pick the first action and reaction priority |
| A build depends on a disputed combo | Confirm the applicable table ruling | Exact source, version, required interpretation, fallback |

## Feat decision table

All feat choices require an actual feature that grants the feat and fulfillment of its prerequisites. A 2024 background's Origin feat choice is not an unrestricted General-feat slot. Ability increases below normally cap at 20; Epic Boons have their own rules.

| Candidate | Eligibility / relevant rule | Prefer when | Opportunity cost |
|---|---|---|---|
| **Ability Score Improvement** | General feat; level 4+; +2 to one score or +1 to two; repeatable | Two points produce the most useful ability-modifier change | Gives no separate tactical feature; at INT 17, +2 reaches 19 and the same +4 modifier as an INT +1 feat |
| **War Caster** | General feat; level 4+, Spellcasting or Pact Magic; choose INT/WIS/CHA +1 | INT is odd and maintaining Concentration is central; also helps eligible somatic casting with occupied hands | Does not add CON saving-throw proficiency; reactive casting uses your Reaction and has a specific trigger and targeting restriction |
| **Resilient (CON)** | General feat; level 4+; choose an ability in which you lack saving-throw proficiency; +1 to that same ability | You lack CON save proficiency and want scaling protection against all CON saves | No INT increase; an even CON becomes odd without changing its modifier immediately; cannot choose an already-proficient save |
| **Resilient (WIS)** | Same eligibility; only if you lack WIS save proficiency | A non-Wizard starting class left a dangerous WIS-save gap | A character who started Wizard normally already has WIS save proficiency and cannot select WIS for this feat |
| **Telekinetic** | General feat; level 4+; INT/WIS/CHA +1; limited directional shove and improved Mage Hand | An odd INT and frequent useful ally/enemy repositioning make the Bonus Action valuable | It competes with Misty Step, commands, and other Bonus Actions; shove is only 5 feet toward/away, not arbitrary placement |
| **Alert** | Origin feat; add PB to Initiative and an eligible willing-ally swap | Early encounter control is consistently decisive | Later feat slots spent on Alert forgo the ability increase and rider of many General feats |
| **Magic Initiate** | Origin feat; choose Cleric, Druid, or Wizard list; follow its exact spell choices | A specific missing spell or cantrip patches a real party gap without a class dip | Does not grant full access to that class's spell list or turn every spell into a Wizard-book spell |

Rules sources: [2024 Player's Handbook feats](https://www.dndbeyond.com/sources/dnd/phb-2024/feats), including ASI, Alert, Magic Initiate, War Caster, Resilient, and Telekinetic. The preference and opportunity-cost columns are analysis.

### War Caster versus Resilient

Compare your actual CON modifier and total-character PB. For a normal save without automatic-success features, chance to pass is the fraction of d20 results that reach the DC; with Advantage it is **1 − (failure chance)²**. A natural 1 is not automatically a failed ordinary saving throw.

For example, at character level 4 with CON 15 and no save proficiency: War Caster leaves a +2 CON save but gives Advantage, making a DC 10 concentration save succeed **87.75%** of the time. Resilient (CON) raises CON to 16 and adds PB +2, giving +5 and **80%** success on the same save. Resilient also helps every other CON save and increases HP through the modifier change; War Caster may raise an odd INT and has other benefits. Recalculate at the actual level and damage DC—neither feat wins in every build.

Use [[Concentration Strategy]] for the broader protection plan. Advantage from multiple sources does not stack into extra dice, and proficiency cannot be added twice merely by gaining it from two sources.

### When Arcana Unleashed is allowed

Use [[Arcana Unleashed Builds]] for concrete routes and level breakpoints; use [[Arcana Unleashed Combinations]] to distinguish dependable tactics from ruling-sensitive exploits.

Check the actual expanded options before committing to a generic feat progression:

- **Necromancer:** evaluate legal Undead access, book-in-hand requirements, companion handling, and renewal costs before committing spell acquisitions to an army. A compact spirit/familiar package and a larger army solve different problems.
- **Conjurer:** its level-10 feature protects Concentration on Conjuration spells from damage. A concentration feat can still help other schools or earlier levels, but its long-term marginal value changes.
- **School Adepts:** compare INT-raising Illusion/Enchantment/Abjuration/Conjuration options against War Caster and Telekinetic for the spellbook's actual school mix. Their spell preparation and component rules are not interchangeable with ordinary Wizard learning.
- **Origin package:** Arcane Infiltrator, Arcane Omens, Portal Jumper, and Familiar Friend can solve different defense/mobility/companion problems. Compare the background's ability increases as well as the feat.
- **Level 19+:** compare The Iron Mind and Magic School Mastery before treating an older Epic Boon ranking as a universal winner. The former protects the main Concentration plan; the latter can add an at-will low-level spell and otherwise unavailable higher-level access.

Exact limits and sources: [[Subclasses#Arcana Unleashed choices]], [[Feats(Epic Boon) Tier List#Arcana Unleashed — General feats]], [[Feats(Epic Boon) Tier List#Arcana Unleashed Epic Boons]], and [[Background Tier List#Arcana Unleashed backgrounds]].

## Pure Wizard versus a dip

| Option | What it can solve | Price and eligibility checkpoint |
|---|---|---|
| Stay Wizard | Earliest Wizard spell tiers, class features, and Wizard feat milestones | Solve defense with placement, spells, feats, items, and party support |
| Start Fighter, then Wizard | Initial CON saves and armor; martial package | Multiclass into Wizard requires INT 13; Fighter requires STR or DEX 13. Wizard spells/features are delayed by each Fighter level |
| Dip Fighter after starting Wizard | Armor training granted by Fighter's multiclass entry | Does **not** retroactively grant Fighter's starting saving throws or automatically grant the full starting armor package |
| Cleric 1 / Wizard — 2024 Cleric | Light/medium armor and shields, four level-1 Cleric preparations, Divine Order; full slot contribution | WIS 13 and INT 13; no subclass at Cleric 1, no CON saves, and Wizard spell access/features still arrive one character level later |
| Start Artificer 1, then Wizard — revised 2025 class | CON/INT saves, light/medium armor and shields, tools, two prepared level-1 INT-based Artificer spells, two chosen cantrips plus Mending; one level contributes one caster level to slots | INT 13; delays Wizard spells/features one level and exchanges Wizard-start WIS saves for CON saves; tool-in-hand casting requirements still apply; Replicate Magic Item starts at Artificer 2 |
| Dip Artificer after starting Wizard — revised 2025 class | Light/medium armor and shields, Tinker's Tools proficiency, one skill from the Artificer list, and INT-based support casting | No retroactive CON-save proficiency or full starting tool package; same Wizard-level delay; two Artificer preparations rather than Cleric 1's four |
| Fighter 2 / Wizard | Action Surge for a qualifying extra action and other Fighter features | Two delayed Wizard levels; 2024 Action Surge cannot supply a Magic action |

Sources: [2024 multiclassing](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character#Multiclassing), [2024 Fighter](https://www.dndbeyond.com/classes/2190879-fighter), and [revised 2025 Artificer](https://www.dndbeyond.com/classes/2656866-artificer). See the worked slot examples in [[Level Progression Planner#Multiclass distinction]].

## Static ability and feat frameworks

These are **legal, static reference examples**, not preferred variants or character sheets. The six non-Bladesinger subclasses use the caster foundation; Bladesinger uses the unarmored foundation. The same class structures are available to all seven. Exact spell acquisitions for every combination are in [[Spell Progression Hub]].

### Legal point buy and origins

All arrays use **27-point buy**. The stated Criminal background adds +2 INT and +1 CON to the caster foundation, or +2 INT and +1 DEX to the Bladesinger foundation. It supplies Alert. Human can supply a different legal Origin feat, such as Tough; no extra General feat is assumed.

| Subclass family and structure | Point buy: STR / DEX / CON / INT / WIS / CHA | After background | Starting saves and ability cost |
|---|---|---|---|
| Abjurer / Chronurgy / Conjurer / Diviner / Illusionist / Necromancer — pure Wizard | 8 / 14 / 15 / 15 / 10 / 8 | **8 / 14 / 16 / 17 / 10 / 8** | Start Wizard: INT/WIS saves; no native CON proficiency |
| Same six — Artificer 1 start | 8 / 14 / 15 / 15 / 10 / 8 | **8 / 14 / 16 / 17 / 10 / 8** | Start revised Artificer: CON/INT saves; one delayed Wizard level |
| Same six — Fighter 1 or 2 start | 8 / 14 / 15 / 15 / 10 / 8 | **8 / 14 / 16 / 17 / 10 / 8** | Start Fighter: STR/CON saves; DEX 14 meets Fighter entry; one or two delayed Wizard levels |
| Same six — Wizard-first Cleric 1 | 8 / 14 / 13 / 15 / 13 / 9 | **8 / 14 / 14 / 17 / 13 / 9** | Start Wizard: INT/WIS saves; WIS 13 is paid for with lower CON |
| Bladesinger — pure Wizard | 8 / 15 / 14 / 15 / 10 / 8 | **8 / 16 / 14 / 17 / 10 / 8** | Start Wizard: INT/WIS saves; DEX supports unarmored AC |
| Bladesinger — Artificer 1 start | 8 / 15 / 14 / 15 / 10 / 8 | **8 / 16 / 14 / 17 / 10 / 8** | Start revised Artificer: CON/INT saves; armor cannot be worn during Bladesong |
| Bladesinger — Fighter 1 or 2 start | 8 / 15 / 14 / 15 / 10 / 8 | **8 / 16 / 14 / 17 / 10 / 8** | Start Fighter: STR/CON saves; armor/Shield training does not improve active Bladesong |
| Bladesinger — Wizard-first Cleric 1 | 8 / 15 / 12 / 15 / 13 / 8 | **8 / 16 / 12 / 17 / 13 / 8** | Start Wizard: INT/WIS saves; WIS 13 and DEX 16 leave CON 12. This is a real survival/Concentration cost. |

For Cleric examples, take the dip after Wizard 5 as in [[Multiclass Spell Timing]]; a different timing is legal but needs its own spell-access calendar. Artificer/Fighter examples start in that class for CON saves. Taking either after Wizard does **not** give those starting saves. All meet the required INT 13 and the stated dip's ability prerequisite.

### Shared legal feat schedule

All levels here are **Wizard levels**. The entries are one costed defensive sequence for comparison; they are not an extra layer of feats added to a route's different schedule. Illusion Adept is an optional replacement configuration, described in [[Arcana Unleashed Builds]], not a compulsory choice for Illusionist.

| Wizard milestone | Wizard-first pure caster | Artificer/Fighter-start caster | Wizard-first Cleric caster | Pure Bladesinger | Artificer/Fighter-start Bladesinger | Wizard-first Cleric Bladesinger |
|---:|---|---|---|---|---|---|
| 4 | War Caster: INT 18 | War Caster: INT 18 | War Caster: INT 18 | War Caster: INT 18 | War Caster: INT 18 | War Caster: INT 18 |
| 8 | ASI: INT 20 | ASI: INT 20 | ASI: INT 20 | ASI: INT 20 | ASI: INT 20 | ASI: INT 20 |
| 12 | Resilient (CON): CON 17 | Resilient (WIS): WIS 11 | Resilient (CON): CON 15 | Resilient (CON): CON 15 | Resilient (WIS): WIS 11 | Resilient (CON): CON 13 |
| 16 | Mage Slayer: DEX 15 | Mage Slayer: DEX 15 | ASI: CON 16 / WIS 14 | ASI: CON 16 / DEX 17 | Mage Slayer: DEX 17 | ASI: CON 14 / DEX 17 |
| 19, if reached | Boon of Dimensional Travel: DEX 16 | Boon of Dimensional Travel: DEX 16 | Boon of Dimensional Travel: INT 21 | Boon of Dimensional Travel: DEX 18 | Boon of Dimensional Travel: DEX 18 | Boon of Dimensional Travel: DEX 18 |

**Resilient is not repeat proficiency.** The Wizard-first columns gain CON proficiency at 12; the Artificer/Fighter-start columns already have it and choose WIS instead. Mage Slayer is used for mental-save protection, not an assumption of melee attacks. INT 21 has the same +5 modifier as 20. The ability points in these examples are attached to their actual feats; substituting a feat requires recalculating the resulting scores.

Later defense choices are **situational**. Resilient helps general saves, while Conjurer's level-10 protection applies only to damage breaking Conjuration Concentration. Bladesong's bonus requires the mode to be active. Mage Slayer, an ASI, The Iron Mind, or another eligible boon should be compared against the threats actually faced rather than assigned a universal rank.

### Feat calendar and capstone cost

| Structure | Wizard 4 / 8 / 12 / 16 at character level | Highest Wizard level at character 20 | Wizard 19 feat and Epic Boon eligibility |
|---|---|---:|---|
| Pure Wizard | 4 / 8 / 12 / 16 | 20 | Wizard 19 at character 19; eligible for a level-19 Epic Boon |
| Artificer 1 start | 5 / 9 / 13 / 17 | 19 | Wizard 19 at character 20; eligible, but no Wizard 20 Signature Spells |
| Fighter 1 start | 5 / 9 / 13 / 17 | 19 | Wizard 19 at character 20; eligible, but no Wizard 20 Signature Spells |
| Wizard 5 → Cleric 1 | 4 / 9 / 13 / 17 | 19 | Wizard 19 at character 20; eligible, but no Wizard 20 Signature Spells |
| Fighter 1 → Wizard 5 → Fighter 2 | 5 / 10 / 14 / 18 | 18 | No Wizard 19 feat within character levels 1–20; no Epic Boon from a nonexistent milestone |

An Epic Boon's level-19 prerequisite uses **character level**, but a feat still needs a class feature granting it. Fighter 2 / Wizard 18 cannot simply add the Wizard 19 feat at character 19. All structures reach Spell Mastery only when they reach Wizard 18; only pure Wizard reaches Signature Spells within the level-20 limit.

### Is Cleric 1 still optimal in 2024

**Verdict: still a strong situational dip, not an automatic best Wizard build.** For an existing Wizard needing armor plus divine support, it remains attractive. If defense is already adequate, staying Wizard preserves the strongest reason to play the class: reaching the next spell tier immediately. This is optimization analysis, not a rule ranking.

What the 2024 Cleric actually gives at one level:

- Light/medium armor and shields, including when multiclassing in after Wizard.
- Divine Order: **Protector** adds heavy armor and martial weapons; **Thaumaturge** instead adds a Cleric cantrip and a WIS-based Arcana/Religion bonus. Heavy-armor training does not waive an armor's Strength-related speed penalty.
- Four prepared level-1 Cleric spells and three Cleric cantrips before Thaumaturge. Preparation count is fixed, not Cleric level plus WIS modifier. Guidance, Bless, and Healing Word are examples of useful support, subject to their actual casting requirements.
- Full contribution to the multiclass slot table, but **no domain at Cleric 1** and no Channel Divinity until Cleric 2. Do not import old Peace/Order/Twilight level-1 subclass packages into the 2024 class; older subclasses need the campaign's compatibility rules and the revised subclass entry point.

The costs matter. WIS 13 competes with INT, CON, and DEX in point buy; Cleric spells use WIS. Bless requires Concentration and therefore competes with Web or another Wizard control spell. A slot-cast Healing Word still observes the 2024 one-slot-per-turn limit; it cannot accompany an ordinary slot-cast Fireball on the same turn. Armor also does not remove component or occupied-hand restrictions.

The revised Artificer uses INT and supplies **two** level-1 preparations at Artificer 1, compared with Cleric 1's **four**. Starting Artificer adds CON-save proficiency; entering it later instead adds the multiclass skill and tool benefits without changing starting saves. Artificer Spellcasting requires Thieves' Tools, Tinker's Tools, or another kind of Artisan's Tools with which the caster has proficiency as a focus **in hand**, adding a Material component to every spell cast through that feature. A shield therefore does not make the other hand's tool/focus requirements disappear. Do not assume that a Cleric support spell is on the Artificer list; an Alchemist subclass spell is not automatically available to Artificer 1.

| Situation | Candidates and comparison |
|---|---|
| New INT-focused character; revised Artificer permitted; medium armor is enough | Compare Artificer 1's INT casting and starting CON saves with Cleric 1's four divine preparations and Divine Order, and with pure Wizard's earlier spell tiers. Artificer has only two preparations, held-tool requirements, and no starting WIS saves. |
| Already a Wizard; WIS 13 is affordable; party needs divine support | Cleric 1 is a strong candidate. Protector can grant heavy armor even though Cleric was not the first class. |
| Already a Wizard; WIS 13 is expensive; medium armor and an additional skill would help | Revised Artificer 1 is a strong candidate without another ability requirement beyond INT 13. It does not add CON-save proficiency, heavy armor, or Cleric spell access. |
| Only Healing Word/Guidance is missing; armor is not needed | Compare legal Magic Initiate (Cleric) access before delaying Wizard progression. It does not grant armor or four Cleric preparations. |
| Safe backline, good party protection, or next Wizard tier is pivotal | Stay Wizard. At character level 5, Wizard 5 has level-3 spells; either one-level spellcasting dip plus Wizard 4 has only level-2 Wizard spells. |
| Considering Cleric 2–3 merely for extra defensive features | Recalculate the two- or three-level Wizard delay. Do not call that the same inexpensive one-level dip. |

With no urgent survival problem, consider reaching Wizard 5 or another important Wizard milestone before dipping. A campaign with frequent lethal attacks may justify earlier armor; an adventure ending at level 5 may strongly favor having level-3 Wizard spells. Neither choice is universally optimal. War Caster can also raise INT, so compare that feat's combined offensive/Concentration payoff rather than assuming every Wizard needs a CON-save starting class.

Rules: [2024 Cleric](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes#Cleric), [revised Artificer](https://www.dndbeyond.com/classes/2656866-artificer), [multiclass preparation and slots](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character#Multiclassing), [spellcasting and slot limits](https://www.dndbeyond.com/sources/dnd/br-2024/spells), [Magic Initiate](https://www.dndbeyond.com/sources/dnd/br-2024/feats#MagicInitiate). Artificer's level-1 package and the legacy distinction are in [[Level Progression Planner#Artificer / Wizard]].

## Party-sensitive priorities

| Party situation | Increase priority of | Reconsider |
|---|---|---|
| Strong melee damage, weak control | Target separation, restrained enemies, safe ally access | Blocking allies behind your own wall or using inaccessible control zones |
| Several controllers | Complementary saves, non-Concentration follow-up, damage that finishes enemies | Everyone preparing the same Concentration answer |
| Few characters | Scouting, emergency extraction, broad utility and survival | Plans requiring three simultaneous specialist roles |
| Very short adventuring days | High-impact opening resources | Buying recovery capacity you rarely use |
| Long attrition days | Rituals, efficient control, spare defensive slots, Arcane Recovery | Repeated marginal upcasts and redundant buffs |
| Scarce spell access | Reliable level-up picks that cannot easily be bought | Assuming an unavailable spell can be acquired |
| Plentiful libraries and downtime | Expand rituals and situational answers; keep a backup book | Spending a precious level-up choice on an easy low-cost copy when another choice is unavailable |

Compare candidates by the problem solved, required source or ruling, immediate cost, delayed benefits, and whether the payoff arrives before the campaign ends. A stronger eventual feature can still be the weaker choice for the levels actually played.

Next: [[Prepared Loadouts]] for situational spell selection; [[Wizard Operations Roadmap]] for gold and downtime; [[Rules Desk]] for disputed interactions.
