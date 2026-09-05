import type { CollectionEntry } from 'astro:content';

export type SpellData = CollectionEntry<'spells'>['data'];

const categoryRules: Record<string, string[]> = {
  control: ['control', 'denial', 'isolation', 'removal', 'suppression', 'terrain'],
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
    .filter(([, fragments]) => roles.some((role) => fragments.some((fragment) => role.includes(fragment))))
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

export const buildLabel = (build: string) => ({
  core: 'CORE',
  chron: 'CHRON',
  div: 'DIV',
  ill: 'ILL',
  bladesinger: 'BLADE',
  blade: 'BLADE',
  tank: 'TANK',
  fighter: 'FIGHTER',
}[build.toLowerCase()] ?? build.toUpperCase());
