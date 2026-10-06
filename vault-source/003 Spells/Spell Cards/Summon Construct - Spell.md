---
cssclasses: [wizard-tools]
type: "spell"
name: "Summon Construct"
level: 4
school: "Conjuration"
casting_time: "Action"
range: "90 feet"
duration: "Concentration, up to 1 hour"
components: "V, S, M (a lockbox worth 400+ GP; not consumed)"
concentration: true
ritual: false
save: ["WIS"]
test: "Atk; WIS for Stone"
roles: ["summoning","damage","control"]
source_group: "2024 core"
source_book: "Player's Handbook (2024)"
rules_version: "2024"
rules_status: "Source checked"
verification: "Full spell entry checked through signed-in D&D Beyond"
verification_scope: "Casting fields, components, effect, restrictions, and scaling checked. Preparation priorities and tactics are optimization analysis, not official rankings."
last_checked: "2026-09-20"
sources: ["https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonConstruct"]
preparation_priority: "Mission-dependent"
tags: ["wizard","spell","role/summoning","role/damage","role/control"]
range_feet: 90
range_kind: "distance"
---

# Summon Construct

[[Spell Finder]] · [[Prepared Loadouts]] · [[Rules Desk]]

## At a glance

| Field | Value |
|---|---|
| Level / school | 4 / Conjuration |
| Casting time | Action |
| Range | 90 feet |
| Duration | Concentration, up to 1 hour |
| Components | V, S, M (a lockbox worth 400+ GP; not consumed) |
| Concentration / ritual | Yes / No |
| Test shorthand | Atk; WIS for Stone |
| Access | 2024 core; actual spellbook and campaign permission still apply |

## Decision

A durable melee blocker with strong condition defenses. Choose Stone to hinder enemy movement, Clay for retaliatory action economy, or Metal against melee pressure.

**Preparation priority:** Mission-dependent (optimization judgment, not an official rating).

## Rules that decide the play

Summon one allied creature into a visible unoccupied space in range. It acts immediately after the caster on the same Initiative count. Verbal commands cost the caster no action; without a command it Dodges and moves to avoid danger. It disappears at 0 HP or when the spell ends. The priced component is reusable, not consumed. The spirit is a separate creature: its attacks are not the caster's own damage instances for every feature. Choose Clay, Metal, or Stone on casting.

## Summoned spirit

The spirit has **no Challenge Rating**, awards 0 XP, and uses the caster's Proficiency Bonus. Do not invent a CR from its spell level for another transformation or feature.

Let **L = slot level**. Medium Construct; AC **13 + L**, HP **40 + 15 × (L − 4)**; Speed 30 feet. **Resistance** to Poison damage, not damage immunity; immune to Charmed, Exhaustion, Frightened, Paralyzed, Poisoned. Darkvision 60 feet. Ability/save modifiers: STR +4, DEX +0, CON +4, INT +2, WIS +0, CHA −3.

Multiattack makes **floor(L / 2)** Slams using the caster's spell attack modifier; reach 5, **1d8 + 4 + L Bludgeoning**.

| Material | Additional mechanic |
|---|---|
| Clay | When damaged by a creature, its Reaction can Slam that creature if possible; otherwise it moves up to half Speed toward that creature without Opportunity Attacks |
| Metal | A creature hitting it with a melee attack, or starting a turn in a grapple with it, takes **1d10 Fire** |
| Stone | A visible creature starting within 10 feet can be forced to save WIS against caster DC; failure halves Speed and prevents **Opportunity Attacks** until its next turn starts |

Stone prevents Opportunity Attacks, not every Reaction. Clay's retaliation is the spirit's Reaction, not the Wizard's.

Maintain Concentration and compare the effect with the spell it would replace. See [[Concentration Strategy]].

## Upcasting

Use higher L throughout; each slot adds 15 HP. Attack count rises at slots 6 and 8.

## Source and deeper use

[Official D&D Beyond rules](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonConstruct) · [[Spellcasting Rules]] · [[Spell Tactics]]
