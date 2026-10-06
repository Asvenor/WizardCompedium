---
title: Planar Binding Optimization
slug: advanced/complex-spells/planar-binding
section: advanced
sectionLabel: Advanced wizardry
type: inherited
summary: The creature must remain within 60 feet for the entire 1-hour casting time.
sourcePath: 008 Advanced Wizardry/Complex Spells/Planar Binding.md
updatedAt: 2026-09-20T12:32:21.091Z
metadata:
  type: inherited
  rules_status: Mixed / review required
  rules_version: Mixed; use the source version in the note
  verification: Mixed evidence; consult the specific rule source
  provenance: Preserved existing OneDrive vault note
  tags:
    - wizard
    - section/008
---

<!-- wizard-upgrade:start -->
[Home](/library/home/home/) · [Wizard Operations Roadmap](/library/advanced/wizard-operations-roadmap/) · [Problem Navigator](/library/home/problem-navigator/)

<aside class="callout callout-warning" data-callout="warning">

**Rules clarification**

Upcasting [Glyph of Warding](https://www.dndbeyond.com/spells/2618951-glyph-of-warding) raises its stored-spell level ceiling to the Glyph slot's level, so a level-5-or-higher Glyph passes Planar Binding's spell-level gate. Normal one-hour [Planar Binding](https://www.dndbeyond.com/spells/2618864-planar-binding) casting requires concentration under the [longer casting-time rules](https://www.dndbeyond.com/sources/dnd/br-2024/spells#LongerCastingTimes), even though its ongoing effect does not. Targeting, containment, costs, and timing still need a legal procedure; see [Binding budget and schedule](/library/advanced/wizard-operations-roadmap/#binding-budget-and-schedule).

</aside>

<!-- wizard-upgrade:end -->


> **Planar Binding converts access to a creature into a long-term controlled asset.**
> 
> The spell's real difficulty is not choosing a strong creature. It is solving four problems:
> 
> **Acquire → Contain → Bind → Command**

---

## Core Rules

|Property|Planar Binding|
|---|---|
|**Level**|5th|
|**School**|Abjuration|
|**Casting Time**|1 hour|
|**Range**|60 feet|
|**Duration**|24 hours|
|**Concentration**|Required during the 1-hour casting; not required for the ongoing binding effect|
|**Saving Throw**|Charisma|
|**Material Cost**|Jewel worth 1,000+ GP, consumed|
|**Valid Targets**|Celestial, Elemental, Fey, Fiend|

The creature must remain within **60 feet for the entire 1-hour casting time**.

At the completion of the casting:

**Target makes a Charisma saving throw**

↓

**Success → Binding fails**

**Failure → Creature serves you for the duration**

---

## Duration Scaling

|Slot|Duration|
|---|---|
|**5th**|24 hours|
|**6th**|10 days|
|**7th**|30 days|
|**8th**|180 days|
|**9th**|366 days|

The material cost remains:

**1,000+ GP per casting**

This makes higher-level Planar Binding dramatically more economical for creatures worth maintaining.

See [Wizard Optimization Math](/vault-assets/PDF%20for%20the%20Compendium/wizard_optimization_math_2024.pdf).

---

## The Binding Engine

A successful Planar Binding operation has four stages.

## 1. Acquire

Obtain access to a worthwhile creature.

Possible sources include:

- Summoning
    
- Captured creatures
    
- Cooperative creatures
    
- Creatures encountered during adventures
    
- Extraplanar contacts
    
- Other magical acquisition methods
    

See [Planar Binding Candidate](/library/creatures/planar-binding-candidate/).

---

## 2. Contain

The creature must remain within 60 feet for the entire casting.

For hostile creatures, this is usually the hardest logistical problem.

Possible tools:

- [Magic Circle](/library/advanced/complex-spells/planar-binding/#inverted-magic-circle)
    
- [Mordenkainen's Private Sanctum](/library/advanced/long-term-magical-defenses/#private-sanctum)
    
- Physical containment
    
- Allied control
    
- Prepared binding chambers
    

---

## 3. Bind

Complete the uninterrupted 1-hour casting.

The target then makes its Charisma save.

A failed save converts the creature into a bound servant for the spell's duration.

---

## 4. Command

A bound creature follows your commands to the **best of its ability**.

Hostile creatures remain dangerous because they may attempt to twist your commands toward their own objectives.

Binding the creature does not automatically make it loyal.

---

## Inverted Magic Circle

[Magic Circle](/library/advanced/complex-spells/planar-binding/#inverted-magic-circle) is the standard containment tool specifically referenced by Planar Binding.

Normally, Magic Circle prevents selected creature types from entering.

When reversed:

> **The selected creatures cannot willingly leave by nonmagical means. Teleportation or interplanar escape requires a Charisma save.**

The reversed circle also protects targets outside it, but it is not a solid wall or complete shutdown of every hostile action. Its creature-type, area, and escape restrictions still matter. [2024 Magic Circle](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#MagicCircle).

This creates a dedicated binding chamber.

### Basic Setup

**Cast inverted Magic Circle**

↓

**Place / summon creature inside**

↓

**Creature remains contained**

↓

**Begin Planar Binding**

↓

**Complete the 1-hour cast**

### Duration Problem

A base Magic Circle lasts:

**1 hour**

Planar Binding also takes:

**1 hour**

This leaves essentially no timing margin.

Upcasting Magic Circle increases its duration by **1 hour per slot level above 3**.

For a prepared binding operation, a longer-duration Circle is significantly safer.

### Cost

Magic Circle consumes:

**100+ GP of salt and powdered silver**

Therefore a basic Planar Binding operation using Magic Circle costs at least:

**1,100 GP**

before any summoning or additional setup costs.

---

## Private Sanctum

[Mordenkainen's Private Sanctum](/library/advanced/long-term-magical-defenses/#private-sanctum) can solve one of the most dangerous containment problems:

**magical escape.**

The 2024 spell can prevent:

- Teleportation into or out of the area
    
- Planar travel within the area
    

This is extremely useful against creatures with:

- Teleportation
    
- Plane Shift
    
- Dimension Door-style abilities
    
- Other magical escape methods
    

### Binding Chamber

A strong prepared facility can therefore use:

**Private Sanctum**

-   
    

**Inverted Magic Circle**

-   
    

**Physical security**

to attack several escape routes simultaneously.

### Permanent Facility

Casting Private Sanctum on the same location every day for **365 days** makes it last until dispelled.

A permanent binding chamber is therefore viable high-level Wizard infrastructure.

See [Bastion](/library/bastions/bastion/).

---

## Summon → Bind

One of Planar Binding's strongest interactions is with creatures created or summoned by another spell.

If the target was summoned or created by another spell:

> **That spell's duration is extended to match Planar Binding's duration.**

### Engine

**Summon qualifying creature**

↓

**Contain it**

↓

**Cast Planar Binding**

↓

**Creature fails Charisma save**

↓

**Summoning spell duration becomes Planar Binding duration**

This can turn a temporary creature into an asset lasting:

**1 day → 10 days → 30 days → 180 days → 366 days**

---

## Concentration Interaction

The completed Planar Binding effect does **not** require Concentration. Its normal one-hour casting **does**, and requires your Magic action on each turn. Starting that cast ends a different effect you were concentrating on, so you cannot simply maintain your own concentration summon while personally performing the normal binding cast.

More importantly, when Planar Binding extends the duration of the spell that summoned or created the creature, the original spell now has the extended duration.

This is what makes Planar Binding particularly important for temporary summons.

<aside class="callout callout-warning" data-callout="warning">

**Exact Interaction**

Duration extension and Concentration are separate rules concepts.

Planar Binding expressly extends the summoning spell's duration; it does **not expressly remove that spell's Concentration requirement**. Do not budget a concentration-free army from duration extension alone. A non-Concentration source, an explicit exception, or an agreed table interpretation is a separate part of the procedure.

</aside>

Sources: [Planar Binding](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#PlanarBinding) and [Longer Casting Times](https://www.dndbeyond.com/sources/dnd/phb-2024/spells#LongerCastingTimes).

The strategic goal is to convert temporary magical access into a long-duration creature asset without permanently occupying your normal combat Concentration.

---

## Save Optimization

A failed Charisma save is required.

This matters because every failed attempt consumes:

**1,000+ GP**

and potentially significant preparation.

Therefore, save manipulation can be extremely valuable.

Potential tools depend on your party and allowed sources.

Examples may include:

- Effects imposing Disadvantage
    
- Effects penalizing saving throws
    
- Reroll manipulation
    
- Features affecting a creature's save
    

<aside class="callout callout-warning" data-callout="warning">

**Verify Timing**

Check the exact wording of each save-manipulation ability.

Not every effect can legally modify every saving throw.

</aside>

The more expensive or difficult the target is to acquire, the more valuable save reliability becomes.

---

## Glyph of Warding for Planar Binding

A common older/theoretical combo is:

**Glyph of Warding → store Planar Binding**

This fails the spell-level requirement with a **level-3 or level-4 Glyph**, but an appropriately upcast Glyph passes that requirement.

The base Spell Glyph option stores a prepared spell of:

**Level 3 or lower**

Planar Binding is:

**Level 5**

Therefore:

> **A level-5-or-higher Glyph can store a prepared Planar Binding of no higher level than the Glyph slot.**

That does not, by itself, establish every step of an automated binding procedure. The stored spell is cast during Glyph preparation, has its own one-hour casting and target-in-range requirement, and later targets the creature that triggers the Glyph. Resolve how that full procedure meets targeting and timing with the DM; the obstacle is **not** a universal level-3 storage cap. [PHB: Glyph of Warding](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#GlyphofWarding).

See [Glyph of Warding](/library/advanced/complex-spells/glyph-of-warding/).

---

## Hostile Creature Command Doctrine

A hostile bound creature may attempt to twist your commands.

Therefore:

> **Command wording is part of Planar Binding optimization.**

Avoid vague commands.

## Weak Command

> Protect me.

Questions immediately appear:

- From what?
    
- At what cost?
    
- Can it harm allies?
    
- Can it sabotage you while technically protecting you?
    
- When does the command end?
    

---

## Better Command Structure

Define:

### Authority

Who must it obey?

### Allies

Who must it treat as friendly?

### Hostiles

Who may it attack?

### Restrictions

What must it never do?

### Intent

How should ambiguous commands be interpreted?

### Reporting

What should it do after completing a task?

### Idle Behavior

What should it do when it has no active instruction?

---

## Standing Safety Orders

Potential instructions include:

- Do not intentionally harm me.
    
- Do not intentionally harm creatures I designate as allies.
    
- Do not sabotage our equipment, property, plans, or objectives.
    
- Do not knowingly assist our enemies.
    
- Do not reveal protected information without permission.
    
- Follow the intended purpose of my instructions rather than deliberately exploiting ambiguous wording.
    
- Ask for clarification when an instruction is genuinely unclear.
    
- Return to the designated location when you have no active task.
    

The exact wording should be adapted to the creature and campaign.

---

## Creature Roles

Do not evaluate a binding candidate only by DPR.

A creature is valuable when it provides a capability worth maintaining.

## Combat

Look for:

- Durability
    
- Damage
    
- Flight
    
- Ranged attacks
    
- Control
    
- Resistances
    
- Immunities
    

---

## Spellcaster

Potentially one of the highest-value roles.

Look for:

- Utility magic
    
- Countermagic
    
- Healing
    
- Divination
    
- Teleportation
    
- Buffs
    
- Control
    
- Repeatable magical abilities
    

A bound spellcaster can preserve your own:

- Spell slots
    
- Actions
    
- Prepared spells
    
- Concentration
    
- Resources
    

---

## Scout

Look for:

- Invisibility
    
- Flight
    
- Stealth
    
- Telepathy
    
- Special senses
    
- High movement
    

---

## Support

Look for:

- Healing
    
- Defensive abilities
    
- Buffs
    
- Condition removal
    
- Information gathering
    

---

## Guard

Long-duration creatures can defend:

- [Bastion](/library/bastions/bastion/)
    
- Spellbooks
    
- Laboratories
    
- [Teleportation Circle](/library/advanced/teleportation-planar-travel/#teleportation-circle)
    
- Binding chambers
    
- Magic-item storage
    
- Important prisoners
    

---

## Transport

Look for:

- Flight
    
- High Speed
    
- Carrying capacity
    
- Teleportation
    
- Planar movement
    

See [Planar Binding Mount](/library/creatures/planar-binding-mount/).

---

## Multiple Bindings

Planar Binding does not itself establish a general one-creature limit.

Given sufficient:

- Gold
    
- Time
    
- Spell slots
    
- Targets
    
- Containment
    
- Preparation
    

a Wizard can potentially maintain multiple separately bound creatures.

This scales extremely aggressively.

Instead of creating several creatures that all perform the same job, consider building a **capability network**.

Example:

**Combatant**

-   
    

**Spellcaster**

-   
    

**Scout**

-   
    

**Support**

-   
    

**Transport**

-   
    

**Bastion Guard**

This creates Wizard infrastructure rather than merely additional DPR.

---

## Binding Economics

Every normal casting consumes:

**1,000+ GP**

Additional setup can include:

- Magic Circle — 100+ GP
    
- Summoning components
    
- Binding chamber construction
    
- Travel
    
- Creature acquisition
    
- Failed binding attempts
    

## Minimum GP per Day

|Slot|Duration|Minimum Binding Cost|Approx. GP / Day|
|---|---|---|---|
|**5th**|1 day|1,000 GP|1,000|
|**6th**|10 days|1,000 GP|100|
|**7th**|30 days|1,000 GP|33.33|
|**8th**|180 days|1,000 GP|5.56|
|**9th**|366 days|1,000 GP|2.73|

This ignores setup costs.

**Reliability budget (analysis):** if each attempt has an independent success probability `p`, expected jewel expenditure to obtain one success is `1,000 GP / p`. At a 50% success chance, that is **2,000 GP**, not 1,000 GP, before containment and acquisition. Legendary Resistance, changing save modifiers, escapes, or a limited number of attempts can make that simple model inapplicable. High duration improves value only if the target can actually be acquired and retained.

For a genuinely valuable creature:

> **Higher-level binding becomes dramatically more efficient.**

See [Wizard Optimization Math](/vault-assets/PDF%20for%20the%20Compendium/wizard_optimization_math_2024.pdf).

---

## Renewal Strategy

Renewal needs the creature available again for a complete casting, another consumed jewel, and a new saving throw. The duration table above determines the safe service window; a previous successful binding does not guarantee the next one.

For high-value servants:

- Track expiration
    
- Plan rebinding
    
- Maintain components
    
- Maintain containment
    
- Maintain access to the creature
    

---

## Failure Planning

Never assume the Charisma save fails.

Before casting, answer:

## If the creature succeeds

- Is containment still active?
    
- Can it attack us?
    
- Can it escape?
    
- Can we attempt another binding?
    
- Do we have another jewel?
    

## If containment fails

Know the creature's:

- Speed
    
- Teleportation
    
- Planar travel
    
- Offensive abilities
    
- Resistances
    
- Immunities
    

## If the binding expires

Know:

- Where the creature is
    
- Whether it remains hostile
    
- Whether it can immediately attack
    
- Whether it can escape
    
- Whether another containment system exists
    

---

## Acquisition Strategy

Planar Binding becomes stronger when you actively build access to suitable creatures.

Potential sources:

- Summoning spells
    
- Planar travel
    
- Campaign encounters
    
- Captured enemies
    
- Negotiated cooperation
    
- Known extraplanar locations
    

Maintain a list of useful targets.

See:

- [Planar Binding Candidate](/library/creatures/planar-binding-candidate/)
    
- [Planar Binding Mount](/library/creatures/planar-binding-mount/)
    

---

## Binding Facility

A dedicated high-level binding facility can include:

- Permanent [Mordenkainen's Private Sanctum](/library/advanced/long-term-magical-defenses/#private-sanctum)
    
- Inverted [Magic Circle](/library/advanced/complex-spells/planar-binding/#inverted-magic-circle)
    
- Physical containment
    
- [Glyph of Warding](/library/advanced/complex-spells/glyph-of-warding/) defenses
    
- Guards
    
- Counterspell support
    
- Emergency exits
    
- Material-component storage
    
- Creature holding areas
    

This converts Planar Binding from:

**dangerous improvised ritual**

into:

**repeatable Wizard infrastructure**

---

## Optimization Principle

> **Do not bind a creature merely because it is powerful.**
> 
> Bind it because it adds a capability worth paying to maintain.

Ask:

> **What resource does this creature replace?**

Possible answers:

- My Action
    
- My Concentration
    
- My spell slot
    
- My prepared spell
    
- My travel time
    
- My scouting
    
- My healing
    
- My transportation
    
- My Bastion defense
    

The best binding candidates expand the Wizard's total available resources.

---

## Arcane Exploit — Nystul's Magic Aura

<aside class="callout callout-warning" data-callout="warning">

**High-Optimization / Table-Sensitive**

The 2024 wording of Nystul's Magic Aura is substantially broader than the old version.

The interaction below has strong textual support, but because of its extreme consequences, confirm the table's interpretation before building around it.

</aside>

## Expanded Binding Targets

Normally, Planar Binding can target only:

- Celestials
    
- Elementals
    
- Fey
    
- Fiends
    

[Nystul's Magic Aura](/library/advanced/complex-spells/planar-binding/#arcane-exploit--nystuls-magic-aura) can potentially expand that pool.

The 2024 **Mask** effect allows you to choose another creature type.

Spells and other magical effects then:

> **treat the target as if it were a creature of the chosen type.**

This creates the interaction:

**Normally invalid creature**

↓

**Nystul's Magic Aura**

↓

**Mask as Celestial / Elemental / Fey / Fiend**

↓

**Planar Binding treats it as an eligible creature type**

↓

**Potential long-term servant**

---

## Nystul Requirements

Nystul's Magic Aura targets a:

**willing creature**

Therefore, this is not automatically a method for walking up to any hostile creature and changing its type.

You first need a creature willing to receive the Aura or another situation that legitimately satisfies the spell's targeting requirement.

This is an important practical restriction.

---

## Why Nystul Binding Matters

If the interaction is accepted, the Planar Binding candidate pool expands enormously.

Potentially valuable traits include:

- Powerful spellcasting
    
- Unique actions
    
- Exceptional mobility
    
- Teleportation
    
- Special senses
    
- Healing
    
- Strong defenses
    
- Unusual utility
    
- Abilities unavailable from normal Celestials, Elementals, Fey, or Fiends
    

This can completely change [Planar Binding Candidate](/library/creatures/planar-binding-candidate/).

---

## Permanent Nystul Setup

Nystul's Magic Aura normally lasts:

**24 hours**

If you cast it on the same target every day for:

**30 days**

the illusion lasts:

**Until Dispelled**

For long-term projects, this can create a permanently masked candidate without needing to refresh Nystul every day.

---

## Nystul + Binding Pipeline

For a cooperative long-term target:

**Acquire willing creature**

↓

**Nystul's Magic Aura**

↓

**Choose eligible Planar Binding creature type**

↓

**Prepare containment**

↓

**Planar Binding**

↓

**Target fails Charisma save**

↓

**Long-duration servant**

For permanent infrastructure:

**Repeat Nystul for 30 days**

↓

**Aura lasts until dispelled**

↓

**Maintain / renew Planar Binding as needed**

---

## Nystul Risk

The interaction creates several questions worth confirming with the DM:

- Does the table apply Mask to spell targeting exactly as written?
    
- What happens if Nystul is dispelled while Planar Binding remains active?
    
- Does losing the masked creature type affect an already-established binding?
    
- How are other creature-type-dependent magical effects handled?
    

Do not discover the table's ruling after investing thousands of GP into the setup.

---

## Nystul Optimization Principle

> **If the Nystul interaction is allowed, evaluate Planar Binding candidates by what the spell can acquire—not merely by the four creature types printed in Planar Binding.**

This turns Nystul's Magic Aura from a deception spell into a potential **creature-targeting infrastructure tool**.

See [Arcane Exploits](/library/tactics/arcane-exploits/).

---

## Related

- [Planar Binding Candidate](/library/creatures/planar-binding-candidate/)
    
- [Planar Binding Mount](/library/creatures/planar-binding-mount/)
    
- [Arcane Exploits](/library/tactics/arcane-exploits/)
    
- [Nystul's Magic Aura](/library/advanced/complex-spells/planar-binding/#arcane-exploit--nystuls-magic-aura)
    
- [Magic Circle](/library/advanced/complex-spells/planar-binding/#inverted-magic-circle)
    
- [Mordenkainen's Private Sanctum](/library/advanced/long-term-magical-defenses/#private-sanctum)
    
- [Glyph of Warding](/library/advanced/complex-spells/glyph-of-warding/)
    
- [Wizard Optimization Math](/vault-assets/PDF%20for%20the%20Compendium/wizard_optimization_math_2024.pdf)
    
- [Minion Management](/library/creatures/000-minion-management/)
    
- [Bastion](/library/bastions/bastion/)
