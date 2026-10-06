---
cssclasses: [wizard-tools]
type: combat-dashboard
status: active
rules_version: "2024 / SRD 5.2.1"
rules_status: "RAW summary with optimization guidance"
sources:
  - "https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf"
verified: true
last_checked: 2026-09-12
---
# Combat Dashboard

[[Home]] · [[Prepared Loadouts]] · [[Problem Navigator]] · [[Rules Desk]]

## Before initiative

**Objective → biggest threat → available cover → escape route → opening spell.**

| Factor | Tactical evaluation |
|---|---|
| Win condition | Defeat / delay / rescue / escape / protect an objective |
| Priority target | Which enemy contributes the most dangerous actions or blocks the objective? |
| Observed defenses | Keep guesses separate from confirmed information |
| Opening spell and fallback | Compare the highest-impact legal opener with an answer to its likely counter |
| Concentration | Prefer an effect worth protecting over several competing effects that cannot coexist |
| Reaction priority | Identify the most consequential plausible trigger before the next turn |
| Escape route | Check destination, transport capacity, components, and ally coordination |

Spell options assume legal access, eligible preparation, required components, and available resources. References here are options, not an automatically prepared spell list or permission to cast a spell.

## First action

| What would change this fight most? | Candidate | Main check before casting |
|---|---|---|
| Stop several ground enemies reaching the party | [[Web - Spell\|Web]] | Anchoring, placement, allies, escape options |
| Remove actions from a charm-susceptible group | [[Hypnotic Pattern - Spell\|Hypnotic Pattern]] | Charm immunity, sight, friendly fire, enemies waking allies |
| Debuff selected enemies mixed with allies | [[Slow - Spell\|Slow]] | WIS saves and repeated saves |
| Disrupt a caster or ranged formation | [[Sleet Storm - Spell\|Sleet Storm]] | Allies lose sight too; enemies may leave the area |
| Split a boss from support | [[Wall of Force - Spell\|Wall of Force]] | Geometry, size, teleportation and other bypasses |
| Remove an immediate fragile enemy cluster | [[Fireball - Spell\|Fireball]] | Damage must remove actions; friendly fire and resistance |
| Extract a vulnerable ally | [[Dimension Door - Spell\|Dimension Door]] | Willing companion within 5 feet, destination, range |
| Temporarily remove a dangerous high-level target | [[Maze - Spell\|Maze]] | Range, visibility, Concentration, escape check |
| The enemy's defenses are unknown | Terrain, ally support, safe scouting, or lower-cost probing | Don't spend the highest slot on an untested immunity guess |

More detail: [[Initiative & First-Turn Strategy]] · [[Spell Tactics]] · [[Legendary Resistance & Bosses]].

## Protect a winning Concentration spell

1. Keep it if it is already preventing the enemy's best actions.
2. Move behind useful cover or out of threat range when the map allows it.
3. Add non-Concentration value: damage, an eligible item, Dodge, movement, or a rescue.
4. Replace it only when the new objective is worth losing the old effect.

**Damage save:** Constitution, DC **max(10, half the damage rounded down)**, capped at **30** under the 2024 rule. Check each separate damage event as applicable. Becoming Incapacitated or dying normally ends Concentration; so does starting another effect requiring it. [[Concentration#Specific feature exceptions|Specific features can protect particular failure routes]], but do not provide a second Concentration effect. Beginning a spell with a casting time of 1 minute or longer also requires Concentration during casting, even if its eventual duration is not Concentration.

Use [[Concentration Strategy]] · [[Concentration]] · [[Cover & Obscurement]].

## Action and Bonus Action

| Resource | Useful question |
|---|---|
| Action | Can I change the outcome with a spell, Dodge, Disengage, Dash, Help, an item, or a necessary objective interaction? |
| Bonus Action | Do I have a feature or spell that actually grants one? Compare teleporting, a minion command, Telekinetic, and other available options |
| Movement | Where can I finish without exposing Concentration or trapping an ally? |
| Concentration | What existing effect ends if I start this new one? |
| Spell-slot casting allowance | Have I already expended a spell slot to cast a spell on **this turn**? |

In 2024 you can expend only **one spell slot to cast a spell per turn**. A slot-funded Misty Step and a slot-funded Fireball cannot share a turn. The same restriction matters for a slot-funded Reaction cast during your own turn. Slotless casting can behave differently when granted by an actual feature or item, but it still needs its action and all other requirements. Each creature's turn is a separate turn; this is not a one-slot-per-round rule.

An Action-casting-time spell is cast when you Ready it; expend the resources that casting uses then and hold it with Concentration until released or the start of your next turn. Releasing it uses your Reaction. Readying a spell can therefore end your current Concentration before the trigger occurs; a cantrip or other slotless casting does not spend a slot.

See [[Action Economy]] · [[Spellcasting Rules]] · [[Reaction Management]].

## Reaction priority

**A Reaction refreshes at the start of your next turn, not at the top of the round.** Save it for the outcome that matters most before then.

| Trigger / threat | Option to examine | Tradeoff |
|---|---|---|
| An attack hits you | [[Shield - Spell\|Shield]] if its AC increase can matter | Costs the Reaction otherwise available for Counterspell or a different defense |
| A creature falls within the spell's trigger | [[Feather Fall - Spell\|Feather Fall]] | Preventing a fatal fall can outrank normal defense |
| Visible spellcasting within 60 feet with V/S/M components | [[Counterspell - Spell\|Counterspell]] | 2024 forces the caster's CON save; it is not automatic interruption |
| Eligible elemental damage, expanded source allowed | [[Absorb Elements - Spell\|Absorb Elements]] | Check its exact trigger and damage types; not a universal resistance spell |
| A subclass or feat trigger occurs | Your actual feature | Check range, trigger, remaining uses, and competing defenses |

Counterspell checks: **can see the creature → within 60 feet → qualifying components → Reaction available → lawful spell-slot expenditure → disruption worth the cost**. The 2024 failure result wastes the casting action/Bonus Action/Reaction; a slot used for the interrupted spell is not expended. Do not assume every supernatural monster ability is a spell.

Use [[Countering Spellcasters]] for positioning and sight denial; use the linked spell card and official entry to resolve its exact text.

## Emergency routes

| Problem | Immediate route |
|---|---|
| I am cornered | [[Misty Step - Spell\|Misty Step]] for a visible nearby destination; [[Dimension Door - Spell\|Dimension Door]] for longer extraction; check components and slot timing |
| An ally must leave danger now | [[Dimension Door - Spell\|Dimension Door]] or another legal transport; [[Polymorph - Spell\|Polymorph]] may protect an eligible ally but does not restore HP—its temporary HP do not wake a creature unconscious at 0 HP |
| An ally is at 0 HP | Healing if actually available, administer an available potion, stabilize if appropriate, remove the attacker, or arrange extraction; ordinary Wizard spells do not imply Healing Word access |
| Hostile magic already controls a target | [[Dispel Magic - Spell\|Dispel Magic]] if it is a dispellable ongoing spell, or the condition's stated remedy; not every condition or magical feature is dispellable |
| Enemy caster is controlling the fight | [[Countering Spellcasters]]: range, sight, Concentration pressure, isolation, or Dispel Magic |
| Invisible opponent | [[Vision & Senses]]; examine [[See Invisibility - Spell\|See Invisibility]], area effects, footprints/noise, and actual targeting requirements |
| Boss ignores repeated save-or-lose attempts | [[Legendary Resistance & Bosses]]: divide terrain, remove support, coordinate serious saves, or use suitable no-initial-save effects |
| Concentration breaks | Reassess the board before reflexively recasting; the original objective may already be complete |

## End of turn and end of fight

At turn end: announce the maintained effect, its next trigger/save, your final position, and any command that allies or the DM need to resolve. Keep one Reaction priority in mind.

Between encounters, resource depletion, lasting spell effects, and minion-control limits change the value of the next engagement. A Short Rest may enable Arcane Recovery and, at Wizard 5+, one Memorize Spell swap. Newly observed enemy defenses can change which spell is the strongest next choice.

Next: [[Prepared Loadouts]] · [[Resting]] · [[000 Minion Management]] · [[Wizard Operations Roadmap]].

## Sources

Mechanics summarized from [SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf): combat and reactions, pp. 9–18; Wizard, pp. 77–79; casting rules, pp. 104–106; individual spell entries; Concentration and Ready in the glossary. The spell selection and reaction priorities are optimization guidance.

This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. This note summarizes and reorganizes the rules and adds original optimization guidance.
