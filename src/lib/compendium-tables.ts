const decodeEntities = (value: string) => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const toText = (value: string) => decodeEntities(value
  .replace(/<br\s*\/?\s*>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim());

export const extractTableRows = (source: string, tableIndex: number) => {
  const tables = [...source.matchAll(/<table(?:\s[^>]*)?>([\s\S]*?)<\/table>/gi)];
  const table = tables[tableIndex]?.[1];
  if (!table) return [];

  return [...table.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[hd](?:\s[^>]*)?>([\s\S]*?)<\/t[hd]>/gi)].map((cell) => toText(cell[1])),
  );
};
