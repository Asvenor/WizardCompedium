export interface SearchRecord {
  slug: string;
  title: string;
  section: string;
  sectionLabel: string;
  url: string;
  summary: string;
  text: string;
}

export interface IndexedRecord {
  record: SearchRecord;
  title: string;
  summary: string;
  fullText: string;
}

export const normalizeSearch = (value: string): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

// Normalize the vault once, rather than its full text on every keystroke.
export const indexSearch = (records: SearchRecord[]): IndexedRecord[] => records.map(record => ({
  record,
  title: normalizeSearch(record.title),
  summary: normalizeSearch(record.summary),
  fullText: normalizeSearch(`${record.title} ${record.summary} ${record.text}`),
}));

export function searchRecords(records: IndexedRecord[], query: string, section = ''): SearchRecord[] {
  const phrase = normalizeSearch(query);
  if (!phrase) return [];
  const terms = phrase.split(' ');
  return records
    .filter(row => (!section || row.record.section === section) && terms.every(term => row.fullText.includes(term)))
    .map(row => ({
      record: row.record,
      rank: row.title === phrase ? 0 : row.title.startsWith(phrase) ? 1 :
        terms.every(term => row.title.includes(term)) ? 2 : row.summary.includes(phrase) ? 3 : 4,
    }))
    .sort((a, b) => a.rank - b.rank || a.record.title.localeCompare(b.record.title))
    .map(row => row.record);
}
