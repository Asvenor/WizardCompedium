---
title: Summon Fiend
slug: spells/spell-cards/summon-fiend-spell
section: spells
sectionLabel: Spells
type: spell
summary: A high-level sustained-damage summon with Magic Resistance. Devil provides ranged flight, Yugoloth mobility and HP, while Demon requires careful explosion placement.
sourcePath: 003 Spells/Spell Cards/Summon Fiend - Spell.md
updatedAt: 2026-09-20T12:32:21.017Z
metadata:
  cssclasses:
    - wizard-tools
  type: spell
  name: Summon Fiend
  level: 6
  school: Conjuration
  casting_time: Action
  range: 90 feet
  duration: Concentration, up to 1 hour
  components: V, S, M (a bloody vial worth 600+ GP; not consumed)
  concentration: true
  ritual: false
  save:
    - DEX
  test: Atk; DEX for Demon explosion
  roles:
    - summoning
    - damage
  source_group: 2024 core
  source_book: Player's Handbook (2024)
  rules_version: "2024"
  rules_status: Source checked
  verification: Full spell entry checked through signed-in D&D Beyond
  verification_scope: Casting fields, components, effect, restrictions, and scaling checked. Preparation priorities and tactics are optimization analysis, not official rankings.
  last_checked: 2026-09-20
  sources:
    - https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonFiend
  preparation_priority: Mission-dependent
  tags:
    - wizard
    - spell
    - role/summoning
    - role/damage
  range_feet: 90
  range_kind: distance
  access: 2024 core; actual spellbook and campaign permission still apply
---

[Spell Finder](/library/home/spell-finder/) · [Prepared Loadouts](/library/tactics/prepared-loadouts/) · [Rules Desk](/library/reference/rules-desk/)

## At a glance

| Field | Value |
|---|---|
| Level / school | 6 / Conjuration |
| Casting time | Action |
| Range | 90 feet |
| Duration | Concentration, up to 1 hour |
| Components | V, S, M (a bloody vial worth 600+ GP; not consumed) |
| Concentration / ritual | Yes / No |
| Test shorthand | Atk; DEX for Demon explosion |
| Access | 2024 core; actual spellbook and campaign permission still apply |

## Decision

A high-level sustained-damage summon with Magic Resistance. Devil provides ranged flight, Yugoloth mobility and HP, while Demon requires careful explosion placement.

**Preparation priority:** Mission-dependent (optimization judgment, not an official rating).

## Rules that decide the play

Summon one allied creature into a visible unoccupied space in range. It acts immediately after the caster on the same Initiative count. Verbal commands cost the caster no action; without a command it Dodges and moves to avoid danger. It disappears at 0 HP or when the spell ends. The priced component is reusable, not consumed. The spirit is a separate creature: its attacks are not the caster's own damage instances for every feature. Choose Demon, Devil, or Yugoloth on casting. The spirit's Magic Resistance protects its own saves, not the caster's Concentration.

## Summoned spirit

The spirit has **no Challenge Rating**, awards 0 XP, and uses the caster's Proficiency Bonus. Do not invent a CR from its spell level for another transformation or feature.

Let **L = slot level**. Large Fiend; AC **12 + L**; base HP at slot 6 is **50 Demon / 40 Devil / 60 Yugoloth**, plus **15 × (L − 6)**. Walk 40 feet; Demon climbs 40; Devil flies 60. Fire resistance, Poison damage/condition immunity, Darkvision 60, and Advantage on saves against spells and other magical effects. Ability/save modifiers: STR +1, DEX +3, CON +2, INT +0, WIS +0, CHA +3.

Multiattack makes **floor(L / 2)** attacks using the caster's spell attack modifier:

| Form | Attack and rider |
|---|---|
| Demon | Reach 5: **1d12 + 3 + L Necrotic**. At 0 HP **or when the spell ends**, it explodes in a 10-foot Emanation: DEX save against caster DC for **2d10 + L Fire**, half on success. Allies are not exempt. |
| Devil | Reach 5 or range 150: **2d6 + 3 + L Fire**. Magical Darkness does not impede its Darkvision. |
| Yugoloth | Reach 5: **1d8 + 3 + L Slashing**. After each hit or miss it can teleport up to 30 feet to a visible unoccupied space. |

A safe choice to end Concentration can still trigger the Demon's harmful explosion.

Maintain Concentration and compare the effect with the spell it would replace. See [Concentration Strategy](/library/tactics/concentration-strategy/).

## Upcasting

Use higher L throughout. A level-7 slot still gives three attacks; level 8 reaches four.

## Source and deeper use

[Official D&D Beyond rules](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonFiend) · [Spellcasting Rules](/library/reference/spellcasting-rules/) · [Spell Tactics](/library/tactics/spell-tactics/)
