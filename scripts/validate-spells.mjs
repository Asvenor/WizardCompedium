import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (path.endsWith('.json')) files.push(path);
  }
}
walk('src/content/spells');
const errors = [],
  ids = new Map(),
  spells = [];
for (const file of files) {
  try {
    const spell = JSON.parse(readFileSync(file, 'utf8'));
    if (ids.has(spell.id))
      errors.push(
        `${file}: duplicate spell id ${spell.id} (also ${ids.get(spell.id)})`,
      );
    ids.set(spell.id, file);
    spells.push([file, spell]);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spell.id))
      errors.push(file + ': invalid URL-safe spell id');
    if (!spell.sourceLocator) errors.push(file + ': missing source locator');
  } catch (error) {
    errors.push(file + ': ' + error.message);
  }
}
for (const [file, spell] of spells)
  for (const id of spell.compendium.relatedSpells ?? [])
    if (!ids.has(id))
      errors.push(file + ': related spell does not exist: ' + id);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Validated ${spells.length} unique spell IDs and related references. Field values are checked by the Astro schema.`,
);
