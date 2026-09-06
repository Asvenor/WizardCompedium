import { getCollection } from 'astro:content';
import { extractTableRows } from './compendium-tables';
export const buildChapters: Record<string, number> = {
  CORE: 5,
  CHRON: 6,
  DIV: 6,
  ILL: 6,
  BLADE: 7,
  TANK: 8,
  FIGHTER: 9,
};
export async function getBuilds() {
  const chapters = await getCollection('chapters');
  const matrix = chapters.find((c) => c.data.chapter === 4)!;
  return extractTableRows(matrix.body ?? '', 1)
    .slice(1)
    .map((row) => {
      const id = row[0].split(' ')[0];
      const chapter = chapters.find(
        (c) => c.data.chapter === buildChapters[id],
      )!;
      return {
        id,
        name: row[0].replace(/ · \w+ — /, ' · '),
        emphasis: row[1],
        fit: row[2],
        caution: row[3],
        href: `/chapters/${chapter.id}/`,
        timing: ['CORE', 'TANK', 'FIGHTER'].includes(id)
          ? 'One-level dip: Wizard spells arrive one character level later.'
          : 'Pure Wizard: Wizard level equals character level.',
      };
    });
}
