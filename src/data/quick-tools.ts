// Every quick-reference card is extracted from the named chapter table at build time.
// Add a route here, not another copy of the chapter's rules text.
export const quickTools = [
  {
    id: 'reactions',
    title: 'Reaction discipline',
    chapter: 45,
    tables: [2],
    intro:
      'Reserve the reaction for the worst consequence before your next turn. These options compete; they are not a checklist to spend together.',
  },
  {
    id: 'targeting',
    title: 'Target a defense',
    chapter: 59,
    tables: [0, 1],
    intro:
      'Start with the objective and observed clues. A creature’s appearance is not a known numeric save bonus.',
  },
  {
    id: 'anti-caster',
    title: 'Enemy caster',
    chapter: 24,
    tables: [5, 6],
    intro:
      'Check the active Counterspell procedure, sight, range, and reaction availability. Denying access or concentration can be more useful than trading spells.',
  },
  {
    id: 'emergency',
    title: 'Emergency protocol',
    chapter: 35,
    tables: [0],
    intro:
      'Find your current failure state. Stabilize, restore a legal action, and preserve a route out before rebuilding the plan.',
  },
  {
    id: 'objectives',
    title: 'Objective play',
    chapter: 36,
    tables: [1, 3],
    intro:
      'Name the win condition and retreat trigger before spending. Killing the opposition is not always the mission.',
  },
  {
    id: 'exploration',
    title: 'Exploration',
    chapter: 38,
    tables: [1, 2, 3, 5],
    intro:
      'Scout the route, establish the return plan, and check what happens when movement or concentration fails.',
  },
  {
    id: 'anti-wizard',
    title: 'Protect against counterplay',
    chapter: 52,
    tables: [0, 1, 2],
    intro:
      'Audit enemy sight, reach, reactions, concentration pressure, saves, isolation, components, and antimagic. Choose the pressure you are actually facing.',
  },
  {
    id: 'party',
    title: 'Party synergy',
    chapter: 53,
    tables: [0, 1, 3],
    intro:
      'Give each job an owner and a backup. Filter by an ally role or encounter need to find the Compendium’s handoff guidance.',
  },
  {
    id: 'security',
    title: 'Spellbook security',
    chapter: 32,
    tables: [2, 3, 4],
    intro:
      'Protect the primary book, maintain an independent backup, and know what you can still do if either is lost.',
  },
  {
    id: 'replacements',
    title: 'Spell replacement ladders',
    chapter: 14,
    tables: [0, 1, 2],
    intro:
      'Later spells do not automatically invalidate earlier ones. Compare the job, cost, and failure mode—not only spell level.',
  },
  {
    id: 'items',
    title: 'Items and attunement',
    chapter: 27,
    tables: [0],
    intro:
      'Filter actual item entries by name, rarity, operation, or role. Verify the exact item and source before assigning one of your attunement slots.',
  },
  {
    id: 'crafting',
    title: 'Crafting reference',
    chapter: 29,
    tables: [0, 2, 4, 5],
    intro:
      'Choose the problem first, then check tool, proficiency, time, cost, and source gates. A plan does not guarantee access to a formula or item.',
  },
  {
    id: 'campaign',
    title: 'Campaign assumptions',
    chapter: 42,
    tables: [0, 2],
    intro:
      'Campaign conditions can change the value of a recommendation. These source comparisons do not rewrite spell tiers.',
  },
] as const;
export const toolDirectory = [
  {
    title: 'Calculators: saves, concentration & components',
    url: '/tools/',
    description:
      'Compare six saves, normal and advantage concentration, expected damage, and component material costs.',
  },
  {
    title: 'Prepare spells',
    url: '/prepare/',
    description: 'Mission packages and preparation role coverage.',
  },
  {
    title: 'Level up',
    url: '/wizard/level-up/',
    description: 'Build progression milestones and an acquisition audit.',
  },
  {
    title: 'Spellbook planner',
    url: '/wizard/spellbook/',
    description: 'Owned, wanted, copy targets, research and shopping.',
  },
  {
    title: 'Resource planner',
    url: '/wizard/resources/',
    description: 'Spell slots, reserve, initiative and first turn.',
  },
  {
    title: 'Gear and downtime planner',
    url: '/wizard/gear/',
    description:
      'Attunement, crafting projects, tools, components and gold allocations.',
  },
  {
    title: 'Adventure checklist',
    url: '/wizard/checklist/',
    description:
      'Spellbook, focus, scrolls, armor, emergency supplies and mission gear.',
  },
  {
    title: 'Current concentration',
    url: '/play/concentration/',
    description:
      'Track concentration and find non-concentration follow-up spells.',
  },
  {
    title: 'Legendary Resistance',
    url: '/play/boss/',
    description: 'Bypass, burn intentionally, or ignore temporarily.',
  },
  {
    title: 'My quick reference',
    url: '/wizard/quick-reference/',
    description: 'Pinned spells, chapters, tools and builds.',
  },
  {
    title: 'English / German lookup',
    url: '/reference/german/',
    description: 'English and German terms, units and table wording.',
  },
  {
    title: 'Compare spells',
    url: '/spells/compare/',
    description:
      'Compare two to four spell roles, saves, concentration, acquisition and source-specific tradeoffs.',
  },
  {
    title: 'Compare builds',
    url: '/builds/compare/',
    description:
      'Compare Wizard build route timing, spell emphasis and campaign tradeoffs.',
  },
  ...quickTools.map((tool) => ({
    title: tool.title,
    url: `/quick/${tool.id}/`,
    description: tool.intro,
  })),
];
