import { getCollection } from 'astro:content';
import { extractTableRows } from './compendium-tables';
import { mentionedSpells } from './spells';
export async function getSpellRelationships() {
  const [chapters, entries] = await Promise.all([
    getCollection('chapters'),
    getCollection('spells'),
  ]);
  const source = chapters.find((c) => c.data.chapter === 14)!;
  const spells = entries.map((e) => e.data);
  return [0, 1, 2]
    .flatMap((table) =>
      extractTableRows(source.body ?? '', table)
        .slice(1)
        .map((row) => ({
          label: row[0],
          ids: mentionedSpells(table === 0 ? row[1] : row[0], spells).map(
            (s) => s.id,
          ),
          note:
            table === 1
              ? `First option: ${row[1]} Second option: ${row[2]}`
              : row[row.length - 1],
          kind:
            table === 0
              ? 'Replacement ladder'
              : table === 1
                ? 'Conditional comparison'
                : 'Role overlap',
        })),
    )
    .filter((group) => group.ids.length > 1);
}
