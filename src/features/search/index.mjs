export const normalizeQuery = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();

// Normalize the public index once, not every chapter again on every keystroke.
export const indexDocuments = (documents) =>
  documents.map((document) => ({
    document,
    title: normalizeQuery(document.title),
    description: normalizeQuery(document.description),
    content: normalizeQuery(document.content),
  }));

export function searchDocuments(index, query, kind = "") {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return [];
  const terms = normalizedQuery.split(" ");
  return index
    .filter((entry) => !kind || entry.document.kind === kind)
    .flatMap((entry) => {
      const { title, description, content, document } = entry;
      if (
        !terms.every(
          (term) =>
            title.includes(term) ||
            description.includes(term) ||
            content.includes(term),
        )
      )
        return [];
      const score =
        (title === normalizedQuery
          ? 300
          : title.includes(normalizedQuery)
            ? 180
            : 0) +
        terms.filter((term) => title.includes(term)).length * 45 +
        terms.filter((term) => description.includes(term)).length * 18 +
        terms.filter((term) => content.includes(term)).length * 4 +
        (document.kind === "Spell" ? 3 : 0);
      return [{ document, score }];
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.document.title.localeCompare(b.document.title),
    );
}
