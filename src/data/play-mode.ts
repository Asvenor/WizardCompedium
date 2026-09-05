export interface PlayCard {
  id: string;
  label: string;
  fast: string;
  quick: string[];
  href: string;
  linkLabel: string;
}

export const playCards: PlayCard[] = [
  {
    id: 'combat-decision',
    label: 'Combat decision',
    fast: 'Choose one primary job for the premium spell: split, deny, rescue, reveal, counter, escape, or finish.',
    quick: [
      'Before initiative, name the objective, exit, concentration candidate, Reaction reserve, and friendly-fire boundary.',
      'After every meaningful reveal, compare the next spell with Dodge, movement, cantrip, item, or retreat.',
    ],
    href: '/chapters/58-worked-encounter-playbooks/',
    linkLabel: 'Read the encounter playbooks',
  },
  {
    id: 'targeting',
    label: 'Targeting',
    fast: 'Try objective denial or no-save map value before forcing a bad defense.',
    quick: [
      'Use only visible form, behavior, equipment, and outcomes already observed at the table.',
      'If the first save or AC route looked strong, switch defense, target, or job rather than repeating it.',
    ],
    href: '/chapters/59-enemy-defense-and-targeting-matrix/',
    linkLabel: 'Open the targeting matrix',
  },
  {
    id: 'concentration',
    label: 'Concentration',
    fast: 'Keep the current spell while it is still removing meaningful enemy actions.',
    quick: [
      'Replace it only when the enemy has escaped, adapted, or another function now decides the objective.',
      'Use cantrips, movement, Dodge, items, and allies when they can finish the job without replacing concentration.',
    ],
    href: '/chapters/45-concentration-and-reaction-master-matrix/',
    linkLabel: 'Read the concentration matrix',
  },
  {
    id: 'reaction',
    label: 'Reaction',
    fast: 'Reserve the Reaction for the consequence that matters most before your next turn.',
    quick: [
      'Counterspell competes with Shield, Absorb Elements, and subclass Reactions.',
      'Shield rises when it prevents meaningful damage or a dangerous concentration check.',
      'Absorb Elements rises when the reduction materially changes survival or concentration odds.',
    ],
    href: '/chapters/45-concentration-and-reaction-master-matrix/#reaction-competition-matrix',
    linkLabel: 'Read the full Reaction rules',
  },
  {
    id: 'enemy-caster',
    label: 'Enemy caster',
    fast: 'Pressure concentration, line of sight, and range while keeping Counterspell legality visible.',
    quick: [
      'If the caster baits the Reaction, compare the current spell with the unknown follow-up.',
      'If the duel is unfavorable, block sight, move the party, or remove supporting enemies.',
    ],
    href: '/chapters/58-worked-encounter-playbooks/',
    linkLabel: 'Open the enemy-caster playbook',
  },
  {
    id: 'boss-fight',
    label: 'Boss / legendary defenses',
    fast: 'Create no-save value and avoid making the party prove one save-or-nothing line repeatedly.',
    quick: [
      'Open with terrain, geometry, or a party-enabling effect while preserving an exit.',
      'After observed resistance, switch defense, target, or job. If control cannot stick, protect allies and win the objective clock.',
    ],
    href: '/chapters/58-worked-encounter-playbooks/',
    linkLabel: 'Read the boss-fight playbook',
  },
  {
    id: 'escape',
    label: 'Escape',
    fast: 'Create distance, cover, a wall, sight denial, or a safe ally route before trading damage.',
    quick: [
      'Prioritize extraction and encounter division when isolated or surrounded.',
      'Do not teleport to an unknown square or abandon the only ally without a plan.',
    ],
    href: '/chapters/35-emergency-wizard-protocol/',
    linkLabel: 'Open the emergency protocol',
  },
  {
    id: 'ally-rescue',
    label: 'Ally rescue',
    fast: 'Block follow-up damage, enable healing, move the ally, or remove the attacker.',
    quick: [
      'First ask whether the enemy can cause immediate death before the ally acts again.',
      'Extract allies who cannot escape themselves after preventing immediate death or irreversible failure.',
    ],
    href: '/chapters/35-emergency-wizard-protocol/',
    linkLabel: 'Read the rescue sequence',
  },
  {
    id: 'exploration',
    label: 'Exploration',
    fast: 'Lead with scouting, rituals, movement, and information before spending combat resources.',
    quick: [
      'Travel packages prioritize Phantom Steed, Tiny Hut, Water Breathing, Telepathic Bond, Arcane Eye, divinations, and later teleportation.',
      'Rituals and scouting can save more resources than another damage spell.',
    ],
    href: '/chapters/13-prepared-spell-packages/',
    linkLabel: 'Open prepared spell packages',
  },
];
