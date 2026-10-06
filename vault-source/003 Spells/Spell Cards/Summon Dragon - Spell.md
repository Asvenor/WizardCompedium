---
cssclasses: [wizard-tools]
type: "spell"
name: "Summon Dragon"
level: 5
school: "Conjuration"
casting_time: "Action"
range: "60 feet"
duration: "Concentration, up to 1 hour"
components: "V, S, M (an object engraved with a dragon image worth 500+ GP; not consumed)"
concentration: true
ritual: false
save: ["DEX"]
test: "Atk; DEX breath"
roles: ["summoning","damage","defense"]
source_group: "2024 core"
source_book: "Player's Handbook (2024)"
rules_version: "2024"
rules_status: "Source checked"
verification: "Full spell entry checked through signed-in D&D Beyond"
verification_scope: "Casting fields, components, effect, restrictions, and scaling checked. Preparation priorities and tactics are optimization analysis, not official rankings."
last_checked: "2026-09-20"
sources: ["https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonDragon"]
preparation_priority: "Mission-dependent"
tags: ["wizard","spell","role/summoning","role/damage","role/defense"]
range_feet: 60
range_kind: "distance"
---

# Summon Dragon

[[Spell Finder]] · [[Prepared Loadouts]] · [[Rules Desk]]

## At a glance

| Field | Value |
|---|---|
| Level / school | 5 / Conjuration |
| Casting time | Action |
| Range | 60 feet |
| Duration | Concentration, up to 1 hour |
| Components | V, S, M (an object engraved with a dragon image worth 500+ GP; not consumed) |
| Concentration / ritual | Yes / No |
| Test shorthand | Atk; DEX breath |
| Access | 2024 core; actual spellbook and campaign permission still apply |

## Decision

A robust flying summon that combines weapon-like attacks, a breath every Multiattack, and one shared resistance. Position its Cone to avoid allies.

**Preparation priority:** Mission-dependent (optimization judgment, not an official rating).

## Rules that decide the play

Summon one allied creature into a visible unoccupied space in range. It acts immediately after the caster on the same Initiative count. Verbal commands cost the caster no action; without a command it Dodges and moves to avoid danger. It disappears at 0 HP or when the spell ends. The priced component is reusable, not consumed. The spirit is a separate creature: its attacks are not the caster's own damage instances for every feature. Choose the shared resistance and breath damage type on casting from its listed resistances.

## Summoned spirit

The spirit has **no Challenge Rating**, awards 0 XP, and uses the caster's Proficiency Bonus. Do not invent a CR from its spell level for another transformation or feature.

Let **L = slot level**. Large Dragon; AC **14 + L**, HP **50 + 10 × (L − 5)**; walk 30, fly 60, swim 30 feet. Resists **Acid, Cold, Fire, Lightning, Poison**; immune to Charmed, Frightened, Poisoned. Blindsight 30 and Darkvision 60 feet. Ability/save modifiers: STR +4, DEX +2, CON +3, INT +0, WIS +2, CHA +2.

The caster gains one chosen listed damage resistance until the spell ends. Multiattack makes **floor(L / 2)** Rends **and** uses Breath Weapon. Rend uses the caster's spell attack modifier, reach 10 feet, for **1d6 + 4 + L Piercing**. Breath affects every creature in a **30-foot Cone**, DEX save against caster DC for **2d6** of the selected resistance type, half on success. The breath has no recharge requirement in this block and its damage does not scale with L.

Flying does not automatically make it a consequence-free combat mount; normal mounting, control, carrying, and initiative rules still need to be satisfied.

Maintain Concentration and compare the effect with the spell it would replace. See [[Concentration Strategy]].

## Upcasting

Use higher L for AC/HP/Rend damage and attack count. Slot 6 adds a third Rend; breath remains 2d6.

## Source and deeper use

[Official D&D Beyond rules](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonDragon) · [[Spellcasting Rules]] · [[Spell Tactics]]
