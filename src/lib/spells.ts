import type { CollectionEntry } from 'astro:content';

export type SpellData = CollectionEntry<'spells'>['data'];

// Null metadata is not evidence of a no-save effect. Indexed spells with no
// listed defense are searchable as such, but still require the active entry.
export const getSpellDefense = (spell: SpellData) =>
  spell.rules.save.ability?.toLowerCase() ??
  (spell.rules.attackRoll
    ? 'ac'
    : spell.rules.save.type
      ? 'other'
      : spell.rules.castingTime
        ? 'none'
        : 'unknown');
export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
export const getSpellSearchText = (spell: SpellData) =>
  normalizeSearch(
    [
      spell.name,
      spell.compendium.summary,
      ...spell.compendium.roles,
      ...getSpellRoleCategories(spell),
      spell.source.category,
      spell.source.book,
      ...spell.compendium.buildRelevance.map(buildLabel),
      spell.rules.castingTime,
      spell.rules.range,
      ...spell.rules.damageTypes,
      spell.rules.ritual ? 'ritual' : '',
      getSpellDefense(spell) === 'none' ? 'no save no listed save' : '',
      getSpellRoleCategories(spell).includes('mobility') ? 'escape' : '',
      spell.compendium.acquisitionRole,
    ]
      .filter(Boolean)
      .join(' '),
  );

// Match longest spell names first to avoid Shield inside Fire Shield.
export function mentionedSpells(text: string, spells: SpellData[]) {
  let remaining = ` ${normalizeSearch(text)} `;
  const found: SpellData[] = [];
  for (const spell of [...spells].sort(
    (a, b) => b.name.length - a.name.length,
  )) {
    const aliases = [
      spell.name,
      ...(spell.id === 'leomunds-tiny-hut' ? ['Tiny Hut'] : []),
      ...(spell.id === 'rarys-telepathic-bond' ? ['Telepathic Bond'] : []),
    ];
    for (const alias of aliases) {
      const phrase = ` ${normalizeSearch(alias)} `;
      if (remaining.includes(phrase)) {
        found.push(spell);
        remaining = remaining.split(phrase).join(' ');
        break;
      }
    }
  }
  return found;
}

const categoryRules: Record<string, string[]> = {
  control: [
    'control',
    'denial',
    'isolation',
    'removal',
    'suppression',
    'terrain',
  ],
  damage: ['damage'],
  defense: ['defense', 'protection'],
  mobility: ['mobility', 'positioning', 'travel'],
  information: ['information', 'detection', 'scouting', 'divination'],
  'anti-caster': ['anti-caster', 'anti-magic', 'suppression'],
  utility: ['utility', 'infrastructure', 'economy', 'communication', 'shelter'],
  summoning: ['summon', 'minion'],
};

export const getSpellRoleCategories = (spell: SpellData) => {
  const roles = spell.compendium.roles.map((role) => role.toLowerCase());
  return Object.entries(categoryRules)
    .filter(([, fragments]) =>
      roles.some((role) =>
        fragments.some((fragment) => role.includes(fragment)),
      ),
    )
    .map(([category]) => category);
};

export const getSpellActionType = (spell: SpellData) => {
  const castingTime = spell.rules.castingTime?.toLowerCase() ?? '';
  if (castingTime === 'action') return 'action';
  if (castingTime === 'bonus action') return 'bonus-action';
  if (castingTime === 'reaction') return 'reaction';
  return castingTime ? 'long-cast' : '';
};

export const getTierGroup = (tier: string | null) => {
  const first = tier?.trim().charAt(0).toLowerCase() ?? '';
  if (first === 's') return 's';
  if (first === 'a') return 'a';
  if (first === 'b') return 'b';
  if (first === 'c') return 'c';
  if (['d', 'e', 'f'].includes(first)) return 'd-f';
  return '';
};

export const buildLabel = (build: string) =>
  ({
    core: 'CORE',
    chron: 'CHRON',
    div: 'DIV',
    ill: 'ILL',
    bladesinger: 'BLADE',
    blade: 'BLADE',
    tank: 'TANK',
    fighter: 'FIGHTER',
  })[build.toLowerCase()] ?? build.toUpperCase();
