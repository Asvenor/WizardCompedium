---
title: Summon Fey
slug: spells/spell-cards/summon-fey-spell
section: spells
sectionLabel: Spells
type: spell
summary: A mobile Force-damage summon with a free-command turn and a mood-specific trick. Slot 4 is an important breakpoint because it doubles its attacks from one to two.
sourcePath: 003 Spells/Spell Cards/Summon Fey - Spell.md
updatedAt: 2026-09-20T12:32:21.017Z
metadata:
  cssclasses:
    - wizard-tools
  type: spell
  name: Summon Fey
  level: 3
  school: Conjuration
  casting_time: Action
  range: 90 feet
  duration: Concentration, up to 1 hour
  components: V, S, M (a gilded flower worth 300+ GP; not consumed)
  concentration: true
  ritual: false
  save:
    - WIS
  test: Atk; WIS for Mirthful
  roles:
    - summoning
    - damage
    - control
  source_group: 2024 core
  source_book: Player's Handbook (2024)
  rules_version: "2024"
  rules_status: Source checked
  verification: Full spell entry checked through signed-in D&D Beyond
  verification_scope: Casting fields, components, effect, restrictions, and scaling checked. Preparation priorities and tactics are optimization analysis, not official rankings.
  last_checked: 2026-09-20
  sources:
    - https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonFey
  preparation_priority: Mission-dependent
  tags:
    - wizard
    - spell
    - role/summoning
    - role/damage
    - role/control
  range_feet: 90
  range_kind: distance
  access: 2024 core; actual spellbook and campaign permission still apply
---

[Spell Finder](/library/home/spell-finder/) · [Prepared Loadouts](/library/tactics/prepared-loadouts/) · [Rules Desk](/library/reference/rules-desk/)

## At a glance

| Field | Value |
|---|---|
| Level / school | 3 / Conjuration |
| Casting time | Action |
| Range | 90 feet |
| Duration | Concentration, up to 1 hour |
| Components | V, S, M (a gilded flower worth 300+ GP; not consumed) |
| Concentration / ritual | Yes / No |
| Test shorthand | Atk; WIS for Mirthful |
| Access | 2024 core; actual spellbook and campaign permission still apply |

## Decision

A mobile Force-damage summon with a free-command turn and a mood-specific trick. Slot 4 is an important breakpoint because it doubles its attacks from one to two.

**Preparation priority:** Mission-dependent (optimization judgment, not an official rating).

## Rules that decide the play

Summon one allied creature into a visible unoccupied space in range. It acts immediately after the caster on the same Initiative count. Verbal commands cost the caster no action; without a command it Dodges and moves to avoid danger. It disappears at 0 HP or when the spell ends. The priced component is reusable, not consumed. The spirit is a separate creature: its attacks are not the caster's own damage instances for every feature. Choose Fuming, Mirthful, or Tricksy on casting.

## Summoned spirit

The spirit has **no Challenge Rating**, awards 0 XP, and uses the caster's Proficiency Bonus. Do not invent a CR from its spell level for another transformation or feature.

Let **L = the slot level used**. Small Fey; AC **12 + L**, HP **30 + 10 × (L − 3)**; walk and fly **30 feet**. Immune to Charmed; Darkvision 60 feet. Ability/save modifiers: STR +1, DEX +3, CON +2, INT +2, WIS +0, CHA +3.

Its Multiattack makes **floor(L / 2)** Fey Blade attacks, using the caster's spell attack modifier; reach 5 feet, **2d6 + 3 + L Force** per hit. Its own Bonus Action teleports it up to 30 feet to a visible unoccupied space, then applies its mood:

| Mood | Rider after teleporting |
|---|---|
| Fuming | Advantage on its next attack before the end of that turn |
| Mirthful | One visible creature within 10 feet makes WIS save against caster DC; failure Charms it by caster and spirit for one minute or until any damage |
| Tricksy | Magical Darkness fills a 10-foot Cube within 5 feet, lasting until the end of its next turn |

Tricksy does not grant the spirit special sight through its own magical Darkness. Check allies' sight requirements before using it.

Maintain Concentration and compare the effect with the spell it would replace. See [Concentration Strategy](/library/tactics/concentration-strategy/).

## Upcasting

Use the higher slot for L throughout. Attacks rise at slots 4, 6, and 8; AC, HP, and per-hit damage also rise.

## Source and deeper use

[Official D&D Beyond rules](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonFey) · [Spellcasting Rules](/library/reference/spellcasting-rules/) · [Spell Tactics](/library/tactics/spell-tactics/)
