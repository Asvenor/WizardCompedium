---
cssclasses: [wizard-tools]
note_type: navigator
type: navigation
rules_status: "Index + analysis"
rules_version: "2024 with SRD 5.2.1 updates"
verification_status: scoped-check
verification: "Index of twenty checked metadata cards; full galleries are broader"
verification_scope: "Twenty selected cards; existing galleries contain additional creatures"
last_checked: 2026-09-20
tags: [wizard, creatures, navigation]
---
# Form Catalogue

[[Home]] → [[Form Finder]] → [[Form Catalogue]] · [[Form Legality Guide]]

Twenty concise cards connect the original stat-block images to searchable metadata. All source images stay in their original locations. Use the full galleries in [[Polymorph]], [[Shapechange]], [[True Polymorph]], [[Find Familiar]] and [[Planar Binding Candidate]] for additional choices.

**Before selecting:** read [[Form Legality Guide#Rules version matters]]. A candidate passes only the table's natural creature-type/CR filter; target level, seen forms, source-object size, casting access and campaign rulings still apply.

## Fast choices

| Problem | First cards to compare |
|---|---|
| General aerial familiar | [[Owl - Creature]] |
| Blindsight familiar | [[Bat - Creature]] |
| Tiny climbing infiltration | [[Spider - Creature]] |
| Underwater familiar or inch-wide opening | [[Octopus - Creature]] |
| Polymorph bruiser | [[Giant Ape - Creature]], [[Tyrannosaurus Rex - Creature]] |
| Beast grappling | [[Giant Scorpion - Creature]], [[Giant Constrictor Snake - Creature]] |
| Beast flight and Blindsight | [[Giant Bat - Creature]] |
| Underwater combat | [[Giant Shark - Creature]] |
| Climbing and ranged restraint | [[Giant Spider - Creature]] |
| Flying mount | [[Pegasus - Creature]], [[Nightmare - Creature]] |
| Invisible anti-caster ally | [[Invisible Stalker - Creature]] |
| Truesight and utility ally | [[Couatl - Creature]] |
| Silent earth traversal or siege | [[Earth Elemental - Creature]] |
| Leave a tunnel through rock | [[Purple Worm - Creature]] |
| High-level flying combat body | [[Planetar - Creature]] |
| Guardian research | [[Guardian Naga - Creature]], [[Shield Guardian - Creature]] — read restrictions first |

These are optimization starting points, not universal tier rankings.

## Static catalogue

This table remains useful when Dataview is unavailable. P = Polymorph; S = Shapechange type gate; O = object → creature True Polymorph; B = ordinary Planar Binding. Creature → creature True Polymorph uses target CR/level and has its own speech/spellcasting restriction.

| Card | CR | Size and natural type | Roles | P | S | O | B |
|---|---:|---|---|:---:|:---:|:---:|:---:|
| [[Giant Ape - Creature\|Giant Ape]] | 7 | Huge Beast | bruiser, climbing, area-damage | ✓ | ✓ | ✓ | — |
| [[Tyrannosaurus Rex - Creature\|Tyrannosaurus Rex]] | 8 | Huge Beast | bruiser, grappling, prone | ✓ | ✓ | ✓ | — |
| [[Giant Scorpion - Creature\|Giant Scorpion]] | 3 | Large Beast | grappling, blindsight, poison | ✓ | ✓ | ✓ | — |
| [[Giant Constrictor Snake - Creature\|Giant Constrictor Snake]] | 2 | Huge Beast | grappling, swimming | ✓ | ✓ | ✓ | — |
| [[Giant Bat - Creature\|Giant Bat]] | 1/4 | Large Beast | flight, blindsight, scouting | ✓ | ✓ | ✓ | — |
| [[Giant Shark - Creature\|Giant Shark]] | 5 | Huge Beast | swimming, bruiser, blindsight | ✓ | ✓ | ✓ | — |
| [[Giant Spider - Creature\|Giant Spider]] | 1 | Large Beast | climbing, restraint, stealth | ✓ | ✓ | ✓ | — |
| [[Owl - Creature\|Owl]] | 0 | Tiny Beast | familiar, flight, scouting | ✓ | ✓ | ✓ | — |
| [[Bat - Creature\|Bat]] | 0 | Tiny Beast | familiar, flight, blindsight | ✓ | ✓ | ✓ | — |
| [[Spider - Creature\|Spider]] | 0 | Tiny Beast | familiar, climbing, stealth | ✓ | ✓ | ✓ | — |
| [[Octopus - Creature\|Octopus]] | 0 | Small Beast | familiar, swimming, infiltration | ✓ | ✓ | ✓ | — |
| [[Pegasus - Creature\|Pegasus]] | 2 | Large Celestial | flight, mount, binding | — | ✓ | ✓ | ✓ |
| [[Nightmare - Creature\|Nightmare]] | 3 | Large Fiend | flight, mount, planar-travel, binding | — | ✓ | ✓ | ✓ |
| [[Couatl - Creature\|Couatl]] | 4 | Medium Celestial | flight, truesight, support, binding | — | ✓ | ✓ | ✓ |
| [[Invisible Stalker - Creature\|Invisible Stalker]] | 6 | Large Elemental | flight, stealth, anti-caster, binding | — | ✓ | ✓ | ✓ |
| [[Earth Elemental - Creature\|Earth Elemental]] | 5 | Large Elemental | burrowing, siege, defense, binding | — | ✓ | ✓ | ✓ |
| [[Planetar - Creature\|Planetar]] | 16 | Large Celestial | flight, bruiser, truesight, binding | — | ✓ | — | ✓ |
| [[Purple Worm - Creature\|Purple Worm]] | 15 | Gargantuan Monstrosity | burrowing, tunneling, bruiser | — | ✓ | — | — |
| [[Guardian Naga - Creature\|Guardian Naga]] | 10 | Large Celestial | support, guard, binding | — | ✓ | — | ✓ |
| [[Shield Guardian - Creature\|Shield Guardian]] | 7 | Large Construct | guard, defense, spell-storage | — | — | ✓ | — |

For example, Planetar's S check means the type is permitted, not that a low-level caster can become one. Guardian Naga's missing O check flags the CR 9 object-creation cap; its [[True Polymorph#Creature-to-Creature Specialists|gallery section]] is for creature transformations.

## Polymorph candidates

The target's CR, or level if it has no CR, must be at least the card's CR. Small creatures also work as hostile transformations; that purpose is different from an allied combat upgrade.

```dataview
TABLE cr AS "CR", size AS "Size", hp AS "Form HP", roles AS "Roles", senses AS "Senses"
FROM "005 Creature, Minions & Forms/Creature Cards"
WHERE polymorph = true
SORT cr DESC
```

## Flight, swimming and underground movement

```dataview
TABLE cr AS "CR", fly_ft AS "Fly ft", swim_ft AS "Swim ft", climb_ft AS "Climb ft", burrow_ft AS "Burrow ft", roles AS "Roles"
FROM "005 Creature, Minions & Forms/Creature Cards"
WHERE fly_ft > 0 OR swim_ft > 0 OR climb_ft > 0 OR burrow_ft > 0
SORT cr ASC
```

## Shapechange candidates

Shapechange requires a form whose CR does not exceed the caster's level or CR, and the caster must have seen that sort of creature. This view filters the creature-type gate only; it does not establish those remaining requirements.

```dataview
TABLE cr AS "Minimum level or CR", hp AS "First-form temp HP", roles AS "Roles", senses AS "Senses"
FROM "005 Creature, Minions & Forms/Creature Cards"
WHERE shapechange = true
SORT cr DESC
```

## Object into creature candidates

Choose a source object at least as large as the resulting creature. Continued control is not automatic after one hour.

```dataview
TABLE cr AS "CR", size AS "Minimum object size", creature_type AS "Type", roles AS "Roles", planar_binding AS "Natural binding type?"
FROM "005 Creature, Minions & Forms/Creature Cards"
WHERE true_polymorph_object = true
SORT cr DESC
```

## Binding candidates

This view uses natural creature types, not assumed Magic Aura setups.

```dataview
TABLE cr AS "CR", creature_type AS "Type", roles AS "Roles", senses AS "Senses"
FROM "005 Creature, Minions & Forms/Creature Cards"
WHERE planar_binding = true
SORT cr ASC
```

## Familiar candidates

```dataview
TABLE size AS "Size", hp AS "HP", fly_ft AS "Fly ft", swim_ft AS "Swim ft", climb_ft AS "Climb ft", senses AS "Senses"
FROM "005 Creature, Minions & Forms/Creature Cards"
WHERE find_familiar = true
SORT file.name ASC
```

## Creature sources

```dataview
TABLE source_version AS "Rules reference", source AS "Creature source"
FROM "005 Creature, Minions & Forms/Creature Cards"
SORT file.name ASC
```

Each card identifies its source, edition and original stat-block image. Read that source for exact abilities and use [[Form Legality Guide]] for the common transformation rules. Eligibility flags do not settle every stat-block interaction or campaign ruling.

Additional reference cards should identify the exact bestiary and edition, distinguish checked metadata from tactical analysis, and use a distinct filename ending in ` - Creature`. The catalogue's rules-based filters do not require character or campaign tracking.
