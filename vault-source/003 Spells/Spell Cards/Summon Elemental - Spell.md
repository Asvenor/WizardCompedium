---
cssclasses: [wizard-tools]
type: "spell"
name: "Summon Elemental"
level: 4
school: "Conjuration"
casting_time: "Action"
range: "90 feet"
duration: "Concentration, up to 1 hour"
components: "V, S, M (air, a pebble, ash, and water in a gold-inlaid vial worth 400+ GP; not consumed)"
concentration: true
ritual: false
save: []
test: "Atk"
roles: ["summoning","damage","utility"]
source_group: "2024 core"
source_book: "Player's Handbook (2024)"
rules_version: "2024"
rules_status: "Source checked"
verification: "Full spell entry checked through signed-in D&D Beyond"
verification_scope: "Casting fields, components, effect, restrictions, and scaling checked. Preparation priorities and tactics are optimization analysis, not official rankings."
last_checked: "2026-09-20"
sources: ["https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonElemental"]
preparation_priority: "Mission-dependent"
tags: ["wizard","spell","role/summoning","role/damage","role/utility"]
range_feet: 90
range_kind: "distance"
---

# Summon Elemental

[[Spell Finder]] · [[Prepared Loadouts]] · [[Rules Desk]]

## At a glance

| Field | Value |
|---|---|
| Level / school | 4 / Conjuration |
| Casting time | Action |
| Range | 90 feet |
| Duration | Concentration, up to 1 hour |
| Components | V, S, M (air, a pebble, ash, and water in a gold-inlaid vial worth 400+ GP; not consumed) |
| Concentration / ritual | Yes / No |
| Test shorthand | Atk |
| Access | 2024 core; actual spellbook and campaign permission still apply |

## Decision

Flexible movement and defenses, particularly Earth durability and Air mobility. This produces a creature, unlike the revised area-effect Conjure Elemental.

**Preparation priority:** Mission-dependent (optimization judgment, not an official rating).

## Rules that decide the play

Summon one allied creature into a visible unoccupied space in range. It acts immediately after the caster on the same Initiative count. Verbal commands cost the caster no action; without a command it Dodges and moves to avoid danger. It disappears at 0 HP or when the spell ends. The priced component is reusable, not consumed. The spirit is a separate creature: its attacks are not the caster's own damage instances for every feature. Choose Air, Earth, Fire, or Water on casting.

## Summoned spirit

The spirit has **no Challenge Rating**, awards 0 XP, and uses the caster's Proficiency Bonus. Do not invent a CR from its spell level for another transformation or feature.

Let **L = slot level**. Medium Elemental; AC **11 + L**, HP **50 + 10 × (L − 4)**; Speed 40 feet. All forms are immune to Poison damage and Exhaustion, Paralyzed, Petrified, Poisoned. Darkvision 60 feet. Ability/save modifiers: STR +4, DEX +2, CON +3, INT −3, WIS +0, CHA +3.

Multiattack makes **floor(L / 2)** Slams using the caster's spell attack modifier; reach 5, **1d10 + 4 + L** damage of the form's type.

| Element | Damage | Movement / extra defenses |
|---|---|---|
| Air | Lightning | Fly 40 (hover); Lightning/Thunder resistance |
| Earth | Bludgeoning | Burrow 40; Piercing/Slashing resistance, not restricted to nonmagical attacks |
| Fire | Fire | Fire immunity |
| Water | Cold | Swim 40; Acid resistance |

Air, Fire, and Water fit through a one-inch space without Difficult Terrain. Earth does not gain that trait or an unrestricted Earth Glide ability just from having Burrow Speed.

Maintain Concentration and compare the effect with the spell it would replace. See [[Concentration Strategy]].

## Upcasting

Use higher L throughout. Attack count rises at slots 6 and 8.

## Source and deeper use

[Official D&D Beyond rules](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonElemental) · [[Spellcasting Rules]] · [[Spell Tactics]]
