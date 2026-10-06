---
cssclasses: [wizard-tools]
type: "spell"
name: "Summon Aberration"
level: 4
school: "Conjuration"
casting_time: "Action"
range: "90 feet"
duration: "Concentration, up to 1 hour"
components: "V, S, M (a pickled tentacle and eyeball in a platinum-inlaid vial worth 400+ GP; not consumed)"
concentration: true
ritual: false
save: ["WIS"]
test: "Atk; WIS for Mind Flayer aura"
roles: ["summoning","damage"]
source_group: "2024 core"
source_book: "Player's Handbook (2024)"
rules_version: "2024"
rules_status: "Source checked"
verification: "Full spell entry checked through signed-in D&D Beyond"
verification_scope: "Casting fields, components, effect, restrictions, and scaling checked. Preparation priorities and tactics are optimization analysis, not official rankings."
last_checked: "2026-09-20"
sources: ["https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonAberration"]
preparation_priority: "Mission-dependent"
tags: ["wizard","spell","role/summoning","role/damage"]
range_feet: 90
range_kind: "distance"
---

# Summon Aberration

[[Spell Finder]] · [[Prepared Loadouts]] · [[Rules Desk]]

## At a glance

| Field | Value |
|---|---|
| Level / school | 4 / Conjuration |
| Casting time | Action |
| Range | 90 feet |
| Duration | Concentration, up to 1 hour |
| Components | V, S, M (a pickled tentacle and eyeball in a platinum-inlaid vial worth 400+ GP; not consumed) |
| Concentration / ritual | Yes / No |
| Test shorthand | Atk; WIS for Mind Flayer aura |
| Access | 2024 core; actual spellbook and campaign permission still apply |

## Decision

Beholderkin offers ranged hovering pressure, Slaad anti-healing and regeneration, and Mind Flayer close-area Psychic damage. Avoid friendly-fire auras near allies.

**Preparation priority:** Mission-dependent (optimization judgment, not an official rating).

## Rules that decide the play

Summon one allied creature into a visible unoccupied space in range. It acts immediately after the caster on the same Initiative count. Verbal commands cost the caster no action; without a command it Dodges and moves to avoid danger. It disappears at 0 HP or when the spell ends. The priced component is reusable, not consumed. The spirit is a separate creature: its attacks are not the caster's own damage instances for every feature. Choose Beholderkin, Mind Flayer, or Slaad on casting; use the current Mind Flayer form rather than the legacy Star Spawn label.

## Summoned spirit

The spirit has **no Challenge Rating**, awards 0 XP, and uses the caster's Proficiency Bonus. Do not invent a CR from its spell level for another transformation or feature.

Let **L = slot level**. Medium Aberration; AC **11 + L**, HP **40 + 10 × (L − 4)**; walk 30 feet, with hover/fly 30 for Beholderkin. Immune to Psychic damage; Darkvision 60 feet. Ability/save modifiers: STR +3, DEX +0, CON +2, INT +3, WIS +0, CHA −2.

Multiattack makes **floor(L / 2)** attacks using the caster's spell attack modifier:

| Form | Attack and rider |
|---|---|
| Beholderkin | Range 150: **1d8 + 3 + L Psychic** |
| Slaad | Reach 5: **1d10 + 3 + L Slashing**, preventing HP recovery until its next turn starts; regenerates 5 HP at its turn's start if it still has at least 1 HP |
| Mind Flayer | Reach 5: **1d8 + 3 + L Psychic**; at its turn's start, if not Incapacitated, creatures within 5 feet other than the caster make WIS saves against caster DC, taking **2d6 Psychic** on failure |

The aura does not exempt the caster's allies and lists no half damage on success.

Maintain Concentration and compare the effect with the spell it would replace. See [[Concentration Strategy]].

## Upcasting

Use higher L throughout. Slot 5 adds AC/HP/per-hit damage but still two attacks; slot 6 reaches three attacks.

## Source and deeper use

[Official D&D Beyond rules](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonAberration) · [[Spellcasting Rules]] · [[Spell Tactics]]
