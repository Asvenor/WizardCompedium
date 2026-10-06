---
title: Summon Undead
slug: spells/spell-cards/summon-undead-spell
section: spells
sectionLabel: Spells
type: spell
summary: Choose ranged pressure, reliable on-hit Frightened, or a Poisoned-to-Paralyzed combination according to the enemy's defenses. The form choice matters more than generic summon rankings.
sourcePath: 003 Spells/Spell Cards/Summon Undead - Spell.md
updatedAt: 2026-09-20T12:32:21.018Z
metadata:
  cssclasses:
    - wizard-tools
  type: spell
  name: Summon Undead
  level: 3
  school: Necromancy
  casting_time: Action
  range: 90 feet
  duration: Concentration, up to 1 hour
  components: V, S, M (a gilded skull worth 300+ GP; not consumed)
  concentration: true
  ritual: false
  save:
    - CON
  test: Atk; CON for Putrid aura
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
    - https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonUndead
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
| Level / school | 3 / Necromancy |
| Casting time | Action |
| Range | 90 feet |
| Duration | Concentration, up to 1 hour |
| Components | V, S, M (a gilded skull worth 300+ GP; not consumed) |
| Concentration / ritual | Yes / No |
| Test shorthand | Atk; CON for Putrid aura |
| Access | 2024 core; actual spellbook and campaign permission still apply |

## Decision

Choose ranged pressure, reliable on-hit Frightened, or a Poisoned-to-Paralyzed combination according to the enemy's defenses. The form choice matters more than generic summon rankings.

**Preparation priority:** Mission-dependent (optimization judgment, not an official rating).

## Rules that decide the play

Summon one allied creature into a visible unoccupied space in range. It acts immediately after the caster on the same Initiative count. Verbal commands cost the caster no action; without a command it Dodges and moves to avoid danger. It disappears at 0 HP or when the spell ends. The priced component is reusable, not consumed. The spirit is a separate creature: its attacks are not the caster's own damage instances for every feature. Choose Ghostly, Putrid, or Skeletal on casting.

## Summoned spirit

The spirit has **no Challenge Rating**, awards 0 XP, and uses the caster's Proficiency Bonus. Do not invent a CR from its spell level for another transformation or feature.

Let **L = slot level**. Medium Undead; AC **11 + L**. HP **30 + 10 × (L − 3)** for Ghostly/Putrid, or **20 + 10 × (L − 3)** for Skeletal. Walk 30 feet; Ghostly also flies and hovers at 40 feet. Immune to Necrotic and Poison damage, and Exhaustion, Frightened, Paralyzed, Poisoned. Darkvision 60 feet. Ability/save modifiers: STR +1, DEX +3, CON +2, INT −3, WIS +0, CHA −1.

Multiattack makes **floor(L / 2)** attacks using the caster's spell attack modifier:

| Form | Attack and distinguishing effect |
|---|---|
| Ghostly | Reach 5: **1d8 + 3 + L Necrotic**; a hit also Frightens until the end of the target's next turn, with no separate save listed. Passes through creatures/objects as Difficult Terrain; ending inside an object causes ejection and 1d10 Force per 5 feet moved. |
| Putrid | Reach 5: **1d6 + 3 + L Slashing**; hitting an already Poisoned target Paralyzes it until the end of the target's next turn. Creatures other than the caster starting within 5 feet save CON against caster DC or become Poisoned until the start of their next turn. This aura can affect allies. |
| Skeletal | Range 150: **2d4 + 3 + L Necrotic**, trading lower HP for ranged attacks. |

Immunity to the **Poisoned or Paralyzed condition** can shut down the Putrid control chain; Poison damage immunity alone does not. Necrotic damage defenses and Frightened immunity separately limit Ghostly.

Maintain Concentration and compare the effect with the spell it would replace. See [Concentration Strategy](/library/tactics/concentration-strategy/).

## Upcasting

Use higher L for AC, HP, damage, and floor(L / 2) attacks. Slot 4 is the first two-attack breakpoint.

## Source and deeper use

[Official D&D Beyond rules](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#SummonUndead) · [Spellcasting Rules](/library/reference/spellcasting-rules/) · [Spell Tactics](/library/tactics/spell-tactics/)
