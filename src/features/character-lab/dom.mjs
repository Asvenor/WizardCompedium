// All character-controlled content goes through textContent/value, never HTML.
export function el(tag, text = "", attributes = {}) {
  const node = document.createElement(tag);
  if (text) node.textContent = String(text);
  for (const [key, val] of Object.entries(attributes)) {
    if (val !== null && val !== undefined) node.setAttribute(key, String(val));
  }
  return node;
}
export const list = (items) => {
  const ul = el("ul");
  for (const item of items) ul.append(el("li", item));
  return ul;
};
export const display = (value) =>
  value === null || value === undefined
    ? "Unknown"
    : value === true
      ? "Yes"
      : value === false
        ? "No"
        : String(value);
export function changesView(changes) {
  const container = el("div", "", { class: "lab-diff" });
  if (!changes.length)
    container.append(el("p", "No changes in reviewed values."));
  for (const c of changes) {
    const row = el("div", "", { class: "lab-diff-row" });
    row.append(
      el("strong", c.label),
      el("span", `Before: ${display(c.before)}`),
      el("span", `Now: ${display(c.after)}`),
    );
    container.append(row);
  }
  return container;
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = el("a", "", { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
