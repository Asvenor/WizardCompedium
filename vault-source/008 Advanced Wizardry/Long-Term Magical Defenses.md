---
type: "inherited"
rules_status: "Mixed / review required"
rules_version: "Mixed; use the source version in the note"
verification: "Mixed evidence; consult the specific rule source"
provenance: "Preserved existing OneDrive vault note"
tags: ["wizard","section/008"]
---

# Long-Term Magical Defenses
<!-- wizard-upgrade:start -->
[[Home]] · [[Wizard Operations Roadmap]] · [[Problem Navigator]]

<!-- wizard-upgrade:end -->


> **A Wizard's defenses should function as a system, not a collection of traps.**
>
> The goal is to:
>
> **Detect → Delay → Deny → Contain → Respond → Recover**
>
> No single spell should be trusted to protect critical infrastructure.

## Quick Navigation

| Prevention | Active Defense | Security |
|---|---|---|
| [[#Detection & Warning]] | [[#Glyph of Warding]] | [[#Anti-Teleportation]] |
| [[#Access Control]] | [[#Guards and Wards]] | [[#Anti-Divination]] |
| [[#Physical Security]] | [[#Guardians]] | [[#Critical Infrastructure]] |
| [[#Defense in Depth]] | [[#Containment]] | [[#Recovery & Redundancy]] |

---

# Defense Doctrine

A mature defensive system should answer six questions:

1. **Can I detect the intrusion?**
2. **Can I prevent immediate access?**
3. **Can I slow the intruder down?**
4. **Can I isolate or contain them?**
5. **Can defenders respond?**
6. **What happens if the defense fails?**

Think in layers:

**Detection**

↓

**Access Control**

↓

**Delay**

↓

**Magical Defense**

↓

**Guardians**

↓

**Containment**

↓

**Response**

↓

**Recovery**

---

# Threat Model

Before building defenses, identify what you are defending against.

## Mundane Intruders

- Thieves
- Assassins
- Spies
- Soldiers
- Criminals

## Magical Intruders

- Invisibility
- Flight
- Teleportation
- Shapechanging
- Ethereal movement
- Divination
- Dispel Magic
- Counterspell
- Summoned creatures

## High-Level Threats

- Enemy Wizards
- Fiends
- Dragons
- Powerful outsiders
- Planar travelers
- Creatures with Truesight
- Creatures with teleportation
- Creatures capable of destroying infrastructure

A defense designed only against someone walking through the front door is not high-level security.

---

# Defense in Depth

Never rely on one layer.

### Weak

**Locked Door**

### Better

**Locked Door**

↓

**Alarm**

↓

**Guard**

### High-Level

**Controlled perimeter**

↓

**Detection**

↓

**Physical barriers**

↓

**Magical access control**

↓

**Anti-teleportation / anti-divination**

↓

**Glyph defenses**

↓

**Guardians**

↓

**Protected inner vault**

↓

**Independent backups**

If one layer fails, another remains.

---

# Detection & Warning

Detection is usually more valuable than immediately dealing damage.

You want to know:

- Someone entered
- Something teleported nearby
- A restricted door opened
- A creature crossed a boundary
- A protected object was disturbed

Potential tools include:

- Alarm
- Familiar surveillance
- Guards
- Glyph triggers
- Mundane security
- Bastion personnel

See [[Find Familiar]].

---

# Alarm

Alarm is cheap and useful for basic perimeter security.

**Operating limits:** 8 hours; one door, window, or area no larger than a 20-foot Cube. The mental alert reaches you only within **1 mile**; the audible version rings for 10 seconds within **60 feet**. It is not an unlimited-distance monitoring network. [Alarm](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#Alarm).

Good locations:

- Restricted doors
- Secret passages
- Vault entrances
- Sleeping areas
- Laboratory entrances
- Teleportation chambers

It is not sufficient by itself.

Use it as:

> **Detection**

rather than:

> **Defense**

---

# Familiar Surveillance

[[Find Familiar]] can provide:

- Observation
- Remote senses
- Patrol routes
- Aerial surveillance
- Infiltration detection

Familiars are particularly useful when you are physically present and can benefit from the information.

Do not treat a fragile familiar as a permanent security camera that cannot be killed.

---

# Access Control

Separate:

**Who can reach the building?**

from:

**Who can reach the important room?**

Critical infrastructure should have multiple access boundaries.

Example:

**Bastion**

↓

**Restricted Wing**

↓

**Secure Corridor**

↓

**Vault Door**

↓

**Magically Protected Chamber**

↓

**Critical Asset**

---

# Arcane Lock

Arcane Lock is useful because it provides persistent magical access control.

The revised lock cannot be unlocked by **nonmagical means**. It does not state that the door or surrounding wall becomes indestructible. A password spoken within 5 feet unlocks it for 1 minute; authorized creatures are chosen when casting. [Arcane Lock](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#ArcaneLock).

Good targets:

- Vaults
- Laboratories
- Spellbook archives
- Teleportation rooms
- Clone chambers
- Component storage
- Restricted doors

Arcane Lock is best when combined with physical construction rather than replacing it.

---

# Physical Security

Magic does not make walls obsolete.

Use:

- Thick walls
- Strong doors
- Limited entrances
- Chokepoints
- Hidden rooms
- Controlled corridors
- Elevation
- Guard positions
- Separate compartments

Physical security forces intruders to:

- Spend time
- Make noise
- Use resources
- Reveal themselves

That gives magical defenses time to matter.

---

# Chokepoints

Design important locations so intruders cannot immediately spread throughout the facility.

Good layout:

```text
ENTRANCE
   │
   ▼
SECURITY ROOM
   │
   ▼
CONTROLLED CORRIDOR
   │
   ▼
INNER FACILITY
   │
   ▼
VAULT
```
Bad layout:

ENTRANCE → EVERYTHING IMPORTANT

# Glyph of Warding

[[Glyph of Warding]] is one of the strongest fixed-location defensive tools available to a Wizard.

It can provide:

- Damage
- Control
- Buffs
- Summoning
- Emergency effects
- Intruder responses

Its fixed-location nature is a strength when protecting permanent infrastructure.

---

# Symbol and Hallow

These complement ordinary glyphs; neither is a free, ally-safe upgrade.

| Ward | Access and setup | Tactical value and limits |
|---|---|---|
| **Symbol** | Level 7 Wizard spell; 1-minute casting; consumes 1,000+ GP diamond powder | A triggered 60-foot-radius zone persists for 10 minutes. Choose Death, Discord, Fear, Pain, Sleep, or Stunning when creating it. It affects creatures present at activation, on their first entry on a turn, or at their turn's end, at most once per turn. |
| **Hallow** | Normally a level 5 **Cleric** spell, not a Wizard spell; 24-hour casting; consumes 1,000+ GP incense. A Wizard can obtain it through eligible Wish duplication or another explicit access feature. | Lasts until dispelled in an area up to 60-foot radius; cannot overlap existing Hallow. Choose warded creature types and one additional effect, such as anti-teleportation, resistance, silence, or vulnerability. |

**Symbol:** a password can exempt someone from *triggering* the glyph; it does not automatically exempt that ally from the active area. An object bearing the glyph cannot be carried more than 10 feet from the casting location. The chosen effect determines the save and consequences. Do not import the legacy Hopelessness or Insanity options.

**Hallow:** the entry ward can select Aberrations, Celestials, Elementals, Fey, Fiends, and Undead—not Humanoids. The extra effects that allow a choice of creature types have their own broader wording; selecting Humanoids there can include allies. Extradimensional Interference can block friendly travel too. Vulnerability doubles the chosen damage type only for affected types inside the area; it is not a portable party buff. The ward prevents chosen types from **willingly** entering, not every forced entry.

Sources: [2024 Symbol](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#Symbol) and [2024 Hallow](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#Hallow).

---

# Defensive Glyphs

Good trigger concepts:

> Trigger when an unauthorized creature enters this area.

> Trigger when this door is opened without authorization.

> Trigger when this object is disturbed by an unauthorized creature.

Keep triggers clear.

Do not make them unnecessarily complicated.

---

# Glyph Placement

Prioritize:

- Chokepoints
- Vault entrances
- Teleportation arrival rooms
- Restricted corridors
- Critical chambers

Do not scatter expensive Glyphs randomly.

Every Glyph costs resources.

See [[Glyph of Warding#Glyph Economics]].

---

# Glyph Layers

A defensive sequence could be:

**Intruder enters**

↓

**Control Glyph**

↓

**Alarm / response**

↓

**Guardian engages**

↓

**Damage Glyph if intrusion continues**

This is generally stronger than simply stacking damage.

---

# Guards and Wards

Guards and Wards is specifically designed for protecting structures.

It can turn a building into hostile terrain for intruders.

Use it for important:

- Bastions
- Fortresses
- Laboratories
- Underground complexes
- Wizard towers

Its value comes from affecting an entire defended structure rather than one doorway.

---

# Guards and Wards Infrastructure

Use it to create:

- Confusing corridors
- Restricted movement
- Obscured areas
- Protected doors
- Defensive chokepoints

It becomes substantially stronger when the building itself was designed around it.

> **Build architecture that complements the spell.**

Do not add Guards and Wards as an afterthought to a terrible floor plan.

---

# Permanent Guards and Wards

The normal ward lasts 24 hours, covers up to **2,500 square feet of floor space** and is at most **20 feet tall**. Daily casting on the same area for **365 days** makes it last until all its effects are dispelled. Dispel Magic cannot remove the whole spell directly, but can remove the four individual effects; losing all four ends it. Named exemptions or the spoken password can protect allies. [Guards and Wards](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#GuardsandWards).

If pursuing this:

- Track required castings
- Protect the construction period
- Maintain the same target area
- Verify the current spell wording

This is exactly the kind of spell that belongs in a long-term defense plan rather than daily adventuring preparation.

---

# Private Sanctum

Private Sanctum is one of the most important high-level security spells.

Depending on the options selected, it can interfere with:

- Teleportation
- Planar travel
- Divination
- Remote observation
- Sound crossing the perimeter (not every form of magical communication)
- Seeing through protected boundaries

This makes it particularly valuable for:

- Council rooms
- Laboratories
- Clone facilities
- Spell archives
- Secret research
- Vaults
- Planar Binding chambers

---

# Anti-Teleportation

**Private Sanctum's actual scope:** choose any of its six protections when casting. The boundary can block sound and sight, exclude Divination sensors, stop Divination targeting of creatures inside, forbid teleportation into/out of the area, and block planar travel within it. It does not say it blocks all telepathy or Sending. It lasts 24 hours; daily casting on the same spot for 365 days changes that to until dispelled. A level-4 casting makes a Cube from 5 to 100 feet per side. [Private Sanctum](https://www.dndbeyond.com/sources/dnd/phb-2024/spell-descriptions#MordenkainensPrivateSanctum).

High-level enemies should not be expected to use your front door.

You must consider:

- Teleport
- Dimension Door
- Plane Shift
- Gate
- Magical portals
- Creature teleportation abilities

Physical walls alone do not solve this.

Use effects such as [[Long-Term Magical Defenses#Private Sanctum|Private Sanctum]] where appropriate.

---

# Teleportation Chamber Exception

Be careful around [[Teleportation Circle Network]] infrastructure.

If you block teleportation throughout the entire facility, you may disable your own transport systems.

Better:

```
TELEPORTATION CHAMBER
Teleportation Allowed
        │
        ▼
SECURITY CHECK
        │
        ▼
SECURE INTERIOR
Teleportation Restricted
```

This creates a controlled magical border.

---

# Anti-Divination

A secure location should not merely prevent entry.

It should prevent enemies from easily learning:

- Who is inside
- What is stored there
- What you are planning
- Where critical infrastructure exists

Relevant tools may include:

- Private Sanctum
- Nondetection
- Mind Blank
- Physical secrecy
- Compartmentalized information

See [[Information Warfare]].

---

# Information Security

Some defenses should never be written on the front door.

Protect information such as:

- Teleportation Circle sigils
- Clone locations
- Demiplane contents
- Passwords
- Glyph triggers
- Guardian commands
- Secret entrances

An enemy who knows your entire security architecture can plan around it.

---

# Guardians

Magic can create or control creatures suitable for permanent defense.

Potential sources:

- [[Planar Binding]]
- [[True Polymorph]]
- Constructs
- Bastion guards
- Allied creatures

Guardians are valuable because they provide:

- Independent actions
- Observation
- Physical presence
- Combat response

---

# Guardian Doctrine

A guardian needs clear instructions.

Define:

- Who is authorized?
- What counts as intrusion?
- When should it attack?
- When should it warn?
- Can it pursue?
- Can it leave the room?
- What happens if someone surrenders?

Bad commands create bad security.

---

# Guardian Placement

Good guardian locations:

- Teleportation arrival chamber
- Vault
- Component archive
- Laboratory
- Clone facility
- Prison
- Demiplane storage

Avoid placing dangerous creatures somewhere normal staff must constantly pass.

---

# Bound Guardians

[[Planar Binding]] can create long-duration defenders.

Advantages:

- Powerful statblocks
- Special senses
- Magical abilities
- Long duration

Risks:

- Hostile interpretation of commands
- Dispelled binding
- Escape
- Expensive maintenance
- Creature-specific abilities

Use precise commands.

See [[Planar Binding]].

---

# Created Guardians

[[True Polymorph]] can create long-term creatures from objects.

Potential examples include:

- Constructs
- Combat creatures
- Specialized utility creatures

These can complement bound creatures.

See [[True Polymorph#Created Combat Assets]].

---

# Containment

Some threats should be contained rather than immediately destroyed.

Potential containment tools:

- Magic Circle
- Physical cells
- Private Sanctum
- Demiplane
- Glyph support
- Guardians

See:

- [[Planar Binding]]
- [[Demiplane#Containment & Prison]]

---

# Prison Design

A magical prison should answer:

- Can the prisoner teleport?
- Can it Plane Shift?
- Can it cast spells?
- Can it become Ethereal?
- Can it shapechange?
- Can it destroy the walls?
- Does it need food?
- Can allies locate it?
- Can allies rescue it?

Do not assume:

> **Locked room = prison.**

---

# Critical Infrastructure

Not every room deserves the same level of defense.

Prioritize protection around:

## Tier 1 — Catastrophic Loss

- [[Clone]]
- Primary / backup spell archives
- Critical magical artifacts
- Irreplaceable research

## Tier 2 — Major Loss

- Expensive components
- Magic items
- Teleportation Circle
- Valuable prisoners
- Major research

## Tier 3 — Replaceable

- Mundane equipment
- Ordinary supplies
- Common materials

Spend defensive resources accordingly.

---

# Spellbook Archive Defense

[[Spellbook Redundancy & Acquisition]] should be integrated into the defense network.

Protect:

- Backup spellbooks
- Rare scrolls
- Research
- Spell acquisition records

But redundancy is more important than creating one supposedly invulnerable archive.

> **Three separated good backups beat one perfect vault.**

---

# Clone Defense

[[Clone]] infrastructure deserves extremely high security.

If an enemy discovers your Clone, they may be able to:

- Destroy it
- Guard it
- Trap the recovery room
- Wait for your resurrection
- Steal your recovery equipment

Therefore:

**Secrecy**

**Security**

**Redundancy**

are all required.

---

# Demiplane Defense

[[Demiplane]] naturally provides isolation.

Use it for:

- Critical backups
- Dangerous objects
- Glyph infrastructure
- Recovery systems

But do not assume a Demiplane is absolutely inaccessible.

Maintain defense and redundancy.

---

# Teleportation Circle Defense

A permanent [[Teleportation Circle Network|Teleportation Circle]] is both:

**Infrastructure**

and

**Potential attack vector**

Anyone capable of using its sigil appropriately may potentially arrive at a predictable location.

Therefore every permanent circle should have:

- Controlled arrival chamber
- Guards
- Detection
- Restricted internal access
- Response plan

---

# Component Vault

[[Expensive Components]] deserve dedicated protection.

Potential contents:

- Diamonds
- Planar Binding jewels
- Glyph materials
- Clone materials
- Rare summoning components
- Valuable gems

Do not carry every expensive component everywhere.

Use secure reserves.

---

# Decoys

Against intelligent enemies, deception can supplement direct defense.

Potential uses:

- Fake vault
- Fake spellbook
- False documents
- Misleading storage
- Decoy component chest

Do not overcomplicate ordinary security.

Decoys become useful when enemies are specifically targeting your infrastructure.

---

# Response Plan

Detection is useless if nobody responds.

Define:

**Alarm occurs**

↓

**Who receives it?**

↓

**Who investigates?**

↓

**Who fights?**

↓

**Does the Wizard teleport back?**

↓

**Are allies contacted?**

↓

**Is evacuation necessary?**

A defensive system needs an operational response.

---

# Remote Response

High-level mobility makes remote response possible.

Potential tools:

- [[Teleportation Circle Network]]
- Teleport
- Sending
- Familiar communication
- Allied casters

Your Bastion being attacked while you are 500 miles away is not necessarily the same as being unable to respond.

---

# Evacuation

Not every attack should be fought.

Critical infrastructure should have a failure plan.

Potential priorities:

1. People
2. Irreplaceable magical knowledge
3. Critical artifacts
4. Rare components
5. Replaceable property

A Wizard who refuses to abandon a compromised facility may lose both the facility and themselves.

---

# Recovery & Redundancy

Security eventually fails.

Therefore:

> **Redundancy is part of defense.**

Examples:

- Multiple spellbook backups
- Multiple Clones
- Distributed component caches
- Several trusted Teleportation Circles
- Separate Demiplanes
- Independent emergency resources

See:

- [[Clone]]
- [[Demiplane]]
- [[Spellbook Redundancy & Acquisition]]
- [[Teleportation Circle Network]]

---

# Single Point of Failure Audit

Periodically ask:

> **What one event could destroy everything?**

Examples:

**One vault contains everything**

→ bad.

**One person knows every password**

→ dangerous.

**One Teleportation Circle is the only route**

→ fragile.

**One Clone is the only resurrection backup**

→ fragile.

**One spellbook contains every acquired spell**

→ unacceptable.

Remove single points of failure wherever practical.

---

# Bastion Defense Architecture

A mature [[Bastion]] could conceptually use:

```
OUTER PERIMETER
      │
      ▼
DETECTION
      │
      ▼
CONTROLLED ENTRANCE
      │
      ▼
GUARDS / STAFF
      │
      ▼
WARDed INTERIOR
      │
      ├──── TELEPORTATION CHAMBER
      │
      ├──── LABORATORY
      │
      ├──── SPELL ARCHIVE
      │
      └──── COMPONENT VAULT
                │
                ▼
         CRITICAL BACKUPS
         STORED ELSEWHERE
```

The Bastion handles daily operations.

Your most catastrophic backups should not all remain inside it.

---

# Demiplane Defense Architecture

Example:

```
DEMIPLANE
   │
   ▼
ENTRY AREA
   │
   ▼
DETECTION / GLYPH
   │
   ▼
GUARDIAN
   │
   ▼
SECURE STORAGE
```

Keep different purposes in different Demiplanes when the value justifies it.

---

# Defense Construction Priority

## Stage 1 — Basic Security

- Locks
- Guards
- Alarm
- Physical barriers

## Stage 2 — Magical Security

- Arcane Lock
- Glyph of Warding
- Better detection

## Stage 3 — Information Security

- Private Sanctum
- Anti-divination
- Restricted knowledge

## Stage 4 — Guardians

- Constructs
- Bound creatures
- Created creatures

## Stage 5 — Redundancy

- Demiplanes
- Clone backups
- Distributed spellbooks
- Component caches

---

# Cost Doctrine

Do not spend 20,000 GP protecting 500 GP of replaceable equipment.

Spend heavily where loss would be catastrophic.

Priority:

**Irreplaceable knowledge**

**Life / Clone infrastructure**

**Critical magic items**

**Rare components**

**Ordinary wealth**

**Mundane equipment**

---

# Maintenance

Defenses are not fire-and-forget.

Periodically review:

- Are Glyphs still active?
- Are guardians still controlled?
- Are passwords compromised?
- Are sigils compromised?
- Are backups current?
- Have enemies learned the location?
- Have new teleportation threats appeared?
- Has your Bastion expanded?
- Are old defenses still legal/current under the rules?

Infrastructure should evolve with the campaign.

---

# Security Checklist

Before considering a location secure:

- Intrusion detection
- Physical access control
- Magical access control
- Teleportation considered
- Planar travel considered
- Divination considered
- Invisible creatures considered
- Guardians / response available
- Critical assets separated
- Backups stored elsewhere
- Emergency evacuation exists
- Recovery plan exists

---

# Long-Term Defense Doctrine

> **The goal is not to make intrusion impossible.**
> 
> The goal is to make intrusion:
> 
> **Difficult to discover**
> 
> **Difficult to execute**
> 
> **Easy to detect**
> 
> **Slow to complete**
> 
> **Expensive to survive**
> 
> **Unable to destroy everything at once**

The strongest Wizard defense is not one devastating Glyph.
