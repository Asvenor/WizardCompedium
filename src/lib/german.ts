import { getCollection } from 'astro:content';
import { extractTableRows } from './compendium-tables';
export async function getGermanTerms() {
  const chapter = (await getCollection('chapters')).find(
    (c) => c.data.chapter === 43,
  )!;
  const categories = [
    'Table basics',
    'Distance',
    'Weight',
    'Volume',
    'Currency',
    'Actions',
    'Rules',
    'Areas',
  ];
  return categories.flatMap((category, i) =>
    extractTableRows(chapter.body ?? '', i)
      .slice(1)
      .map((row, j) => ({
        id: `term-${i}-${j}`,
        english: row[0],
        german: row[1],
        note: row[2] ?? '',
        category,
      })),
  );
}
