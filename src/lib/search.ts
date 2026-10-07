export interface SearchRecord {
  slug: string;
  title: string;
  section: string;
  sectionLabel: string;
  url: string;
  summary: string;
  text: string;
  aliases?: string[];
}

export interface IndexedRecord {
  record: SearchRecord;
  title: string;
  summary: string;
  fullText: string;
  aliases: string[];
}

export const normalizeSearch = (value: string): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

interface SearchNote {
  title: string;
  sourcePath: string;
  type: string;
  section: string;
  aliases?: string[];
  metadata: Record<string, unknown>;
}

export function searchAliases(note: SearchNote): string[] {
  const filename = note.sourcePath.split(/[\\/]/).pop()?.replace(/\.md$/i, '') ?? '';
  const metadataAliases = typeof note.metadata.aliases === 'string' ? [note.metadata.aliases] :
    Array.isArray(note.metadata.aliases) ? note.metadata.aliases.filter((alias): alias is string => typeof alias === 'string') : [];
  const candidates = [filename, filename.replace(/\s+-\s+(?:Spell|Item|Creature)$/i, ''),
    ...metadataAliases, ...(note.aliases ?? [])];
  const seen = new Set([normalizeSearch(note.title)]);
  return candidates.filter(alias => {
    const normalized = normalizeSearch(alias);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// Redirect references remain in the library. Search shows the canonical card
// when the redirect has the same title as an actual spell, item, or creature.
export function searchableNotes<T extends SearchNote>(notes: T[]): T[] {
  const canonicalNames = new Set(notes
    .filter(note => note.section !== 'inbox' && ['spell', 'magic-item', 'creature'].includes(note.type))
    .flatMap(note => [note.title, ...searchAliases(note)].map(normalizeSearch)));
  return notes.filter(note => note.section !== 'inbox' &&
    !(note.type === 'redirect' && canonicalNames.has(normalizeSearch(note.title))));
}

// Normalize the vault once, rather than its full text on every keystroke.
export const indexSearch = (records: SearchRecord[]): IndexedRecord[] => records.map(record => ({
  record,
  title: normalizeSearch(record.title),
  summary: normalizeSearch(record.summary),
  aliases: (record.aliases ?? []).map(normalizeSearch),
  fullText: normalizeSearch(`${record.title} ${(record.aliases ?? []).join(' ')} ${record.summary} ${record.text}`),
}));

export function searchRecords(records: IndexedRecord[], query: string, section = ''): SearchRecord[] {
  const phrase = normalizeSearch(query);
  if (!phrase) return [];
  const terms = phrase.split(' ');
  return records
    .filter(row => (!section || row.record.section === section) && terms.every(term => row.fullText.includes(term)))
    .map(row => ({
      record: row.record,
      rank: row.title === phrase || row.aliases.includes(phrase) ? 0 :
        row.title.startsWith(phrase) || row.aliases.some(alias => alias.startsWith(phrase)) ? 1 :
        terms.every(term => row.title.includes(term)) || row.aliases.some(alias => terms.every(term => alias.includes(term))) ? 2 :
        row.summary.includes(phrase) ? 3 : 4,
    }))
    .sort((a, b) => a.rank - b.rank || a.record.title.localeCompare(b.record.title))
    .map(row => row.record);
}
