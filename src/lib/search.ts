export interface SearchRecord {
  slug: string;
  title: string;
  section: string;
  sectionLabel: string;
  url: string;
  summary: string;
  text: string;
  aliases?: string[];
  kind?: 'note' | 'heading' | 'gallery';
  parentTitle?: string;
  heading?: string;
}

export interface IndexedRecord {
  record: SearchRecord;
  title: string;
  summary: string;
  fullText: string;
  aliases: string[];
  titleTerms: Set<string>;
  aliasTerms: Set<string>[];
  summaryTerms: Set<string>;
  fullTerms: Set<string>;
}

export const normalizeSearch = (value: string): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

// Conversational filler is not a required word in the source. Negations and
// numbers are deliberately retained: "without concentration" is not its inverse.
const stopWords = new Set('a an the i im me my mine you your we our it its they them their this that these those is are am be been being do does did have has had should could would will shall can may might must how what which when where why at by per each every in on of for to from with and or as about please tell want need up'.split(' '));
const termGroups = [
  ['spell', 'spells', 'spels'], ['slot', 'slots'], ['cantrip', 'cantrips', 'cantrpis'],
  ['level', 'levels', 'levelled', 'leveled', 'levelling', 'leveling', 'levle'],
  ['spellbook', 'spellbooks', 'book', 'books', 'spellbok'],
  ['count', 'counts', 'many', 'number', 'numbers', 'amount', 'amounts', 'total', 'totals', 'minimum', 'quantity'],
  ['prepare', 'prepared', 'preparing', 'preparation', 'preparations', 'prep', 'prepaired', 'preperation'],
  ['copy', 'copying', 'copied', 'copies', 'transcribe', 'transcribing'],
  ['cost', 'costs', 'price', 'prices', 'gold', 'gp'],
  ['ritual', 'rituals', 'ritually'],
  ['concentration', 'concentrate', 'concentrating', 'concetration'],
  ['condition', 'conditions'], ['learn', 'learned', 'learning', 'acquisition', 'acquisitions'],
] as const;
const canonicalTerms = new Map<string, string>();
for (const group of termGroups) for (const term of group) canonicalTerms.set(term, group[0]);
export const searchTerms = (value: string): string[] => [...new Set(normalizeSearch(value).split(' ')
  .filter(term => term && !stopWords.has(term)).map(term => canonicalTerms.get(term) ?? term))];
const termSet = (value: string) => new Set(searchTerms(value));
const overlap = (terms: string[], field: Set<string>) => terms.filter(term => field.has(term)).length;

export const markdownSearchText = (body: string): string => body
  .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*`|>]/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

type SearchHeading = {depth: number; slug: string; text: string};
const genericHeading = /^(?:sources?(?: and .*)?|source attribution|quick navigation|navigation|at a glance|decision|upcasting|source and deeper use|sources,? edition.*)$/i;

// The slugs come from Astro's renderer, so search uses exactly the same deep
// anchors as the reader. Excerpts are bounded; the full note is also indexed.
export function headingSearchRecords(note: SearchRecord, body: string, headings: SearchHeading[], aliasesByUrl: Map<string, string[]> = new Map()): SearchRecord[] {
  const lines = body.split('\n');
  const starts: {depth: number; text: string; line: number}[] = [];
  let fenced = false;
  for (let line = 0; line < lines.length; line++) {
    if (/^\s*(?:```|~~~)/.test(lines[line])) { fenced = !fenced; continue; }
    if (fenced) continue;
    const match = lines[line].match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (match) starts.push({depth: match[1].length, text: markdownSearchText(match[2]), line});
  }
  let cursor = 0;
  const candidates: {record: SearchRecord; preferred: boolean; order: number}[] = [];
  for (const heading of headings) {
    const startIndex = starts.findIndex((start, index) => index >= cursor && start.depth === heading.depth && normalizeSearch(start.text) === normalizeSearch(heading.text));
    if (startIndex < 0) continue;
    cursor = startIndex + 1;
    if (heading.depth < 2 || heading.depth > 3) continue;
    const url = `${note.url}#${heading.slug}`, aliases = aliasesByUrl.get(url) ?? [];
    if (genericHeading.test(heading.text) && !aliases.length) continue;
    const start = starts[startIndex], end = starts.slice(startIndex + 1).find(next => next.depth <= start.depth)?.line ?? lines.length;
    const text = markdownSearchText(lines.slice(start.line + 1, end).join('\n')).slice(0, 1400);
    if (text.length < 30 && !aliases.length) continue;
    candidates.push({record: {...note, slug: `${note.slug}#${heading.slug}`, kind: 'heading', parentTitle: note.title,
      title: heading.text, heading: heading.text, url, aliases, summary: text.slice(0, 220), text},
      preferred: aliases.length > 0, order: candidates.length});
  }
  return candidates.sort((a, b) => Number(b.preferred) - Number(a.preferred) || a.order - b.order).slice(0, 10).map(candidate => candidate.record);
}

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
  titleTerms: termSet(record.title), aliasTerms: (record.aliases ?? []).map(termSet),
  summaryTerms: termSet(record.summary),
  fullTerms: termSet(`${record.title} ${record.parentTitle ?? ''} ${(record.aliases ?? []).join(' ')} ${record.summary} ${record.text}`),
}));

export function searchRecords(records: IndexedRecord[], query: string, section = ''): SearchRecord[] {
  const phrase = normalizeSearch(query);
  if (!phrase) return [];
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const minimumMatch = terms.length < 4 ? terms.length : Math.ceil(terms.length * .8);
  const criticalTerms=terms.filter(term=>/^\d+$/.test(term)||['not','no','without','cannot','cant','dont','doesnt'].includes(term));
  const ranked = records
    .filter(row => (!section || row.record.section === section) && criticalTerms.every(term=>row.fullTerms.has(term)) && (overlap(terms, row.fullTerms) >= minimumMatch ||
      phrase.length >= 3 && (row.title.startsWith(phrase) || row.aliases.some(alias => alias.startsWith(phrase)))))
    .map(row => ({
      record: row.record,
      rank: (row.title === phrase ? 1000 : row.aliases.includes(phrase) ? 960 :
        row.title.startsWith(phrase) ? (row.record.kind === 'heading' ? 720 : 800) - Math.min(80, (row.title.length - phrase.length) * 4) :
        row.aliases.some(alias => alias.startsWith(phrase)) ? (row.record.kind === 'heading' ? 700 : 760) -
          Math.min(80, Math.min(...row.aliases.filter(alias => alias.startsWith(phrase)).map(alias => alias.length - phrase.length)) * 4) : 0) +
        Math.max(overlap(terms, row.titleTerms) * 80, ...row.aliasTerms.map(field => overlap(terms, field) * 65), 0) +
        overlap(terms, row.summaryTerms) * 12 + overlap(terms, row.fullTerms) * 8 +
        (row.summary.includes(phrase) ? 30 : 0) + (row.record.kind === 'heading' ? 10 : 0) -
        Math.min(20, row.record.text.length / 1600),
    }))
    .sort((a, b) => b.rank - a.rank || a.record.title.localeCompare(b.record.title));
  // One best destination per parent note avoids ten sections of a long guide
  // crowding out other sources. Exact card names still lead to the card itself.
  const seen = new Set<string>();
  return ranked.filter(row => {
    const key = row.record.kind === 'heading' ? row.record.slug.split('#')[0] : row.record.slug;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).map(row => row.record);
}

// Excerpts are quoted from indexed source text, never synthesized answers.
export function searchSnippet(record: SearchRecord, query: string, maxLength = 200): string {
  const text = markdownSearchText(record.text || record.summary);
  if (text.length <= maxLength) return text;
  const terms = searchTerms(query).filter(term => term.length > 2);
  const words = [...text.matchAll(/[\p{L}\p{N}’']+/gu)];
  const match = words.find(word => searchTerms(word[0]).some(term => terms.includes(term)));
  // Matching offsets use the original source string, not its normalized length.
  let start = Math.max(0, (match?.index ?? 0) - 65);
  if (start > 0) start = text.indexOf(' ', start) + 1 || start;
  let end = Math.min(text.length, start + maxLength);
  if (end < text.length) end = text.lastIndexOf(' ', end) > start ? text.lastIndexOf(' ', end) : end;
  return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

// Suggestions are explicit alternatives, never silently substituted queries or
// answers. Compare only close note/card names and their supplied aliases.
function boundedEditDistance(left: string, right: string, limit: number): number {
  if (Math.abs(left.length - right.length) > limit) return limit + 1;
  let previous = Array.from({length: right.length + 1}, (_, index) => index);
  for (let index = 1; index <= left.length; index++) {
    const current = [index];
    for (let other = 1; other <= right.length; other++) current[other] = Math.min(
      current[other - 1] + 1, previous[other] + 1,
      previous[other - 1] + Number(left[index - 1] !== right[other - 1]),
    );
    if (Math.min(...current) > limit) return limit + 1;
    previous = current;
  }
  return previous[right.length];
}

export function searchSuggestions(records: IndexedRecord[], query: string, section = ''): SearchRecord[] {
  const phrase = normalizeSearch(query);
  if (phrase.length < 4 || phrase.length > 64 || phrase.split(' ').length > 4 ||
      /^(?:how|what|why|when|where|can|could|do|does|did|should|would|is|are)\b/.test(phrase)) return [];
  const limit = phrase.length <= 7 ? 1 : 2;
  const matches = records.filter(row => row.record.kind !== 'heading' && (!section || row.record.section === section))
    .map(row => ({record: row.record, distance: Math.min(...[row.title, ...row.aliases]
      .map(name => boundedEditDistance(phrase, name, limit)))}))
    .filter(row => row.distance > 0 && row.distance <= limit)
    .sort((a, b) => a.distance - b.distance || a.record.title.localeCompare(b.record.title));
  return matches.slice(0, 3).map(row => row.record);
}
