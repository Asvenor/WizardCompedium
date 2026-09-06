import { getCollection } from 'astro:content';
import { mentionedSpells } from './spells';
export async function getAcquisitionLanes() {
  const [chapters, entries] = await Promise.all([
    getCollection('chapters'),
    getCollection('spells'),
  ]);
  const source = chapters.find((c) => c.data.chapter === 11)?.body ?? '';
  const spells = entries.map((e) => e.data);
  const lanes = [
    ['GUARANTEE', 'learn', 'Learn on level-up'],
    ['COPY-FIRST', 'copy', 'Copy-first'],
    ['MISSION PREP', 'mission', 'Mission prep'],
    ['BUILD / TABLE', 'build', 'Build / table dependent'],
  ];
  const result: Record<string, { id: string; label: string }> = {};
  for (const [heading, id, label] of lanes) {
    const section =
      source.split('### ' + heading + '\n')[1]?.split('\n### ')[0] ?? '';
    const list = section
      .split('\n')
      .filter((line) => line.startsWith('- '))
      .join(' ');
    for (const spell of mentionedSpells(list, spells))
      result[spell.id] = { id, label };
  }
  return result;
}
