import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, '../Wizard_Compendium_V2/01_Audit/extracted/Ultimate_Wizard_Compendium_FINAL_v1.14_DDB_Verified_Corrected__OneDrive.json');
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const coverage = JSON.parse(readFileSync(join(root, 'src/data/migration-coverage.json'), 'utf8'));
const research = JSON.parse(readFileSync(join(root, 'src/data/research-integration-20260907.json'), 'utf8'));
const chapters = JSON.parse(readFileSync(join(root, 'src/data/chapters.json'), 'utf8'));

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

const errors = [];
if (chapters.length !== 61) errors.push(`Expected 61 chapter records, found ${chapters.length}.`);
const duplicateNumbers = chapters.filter((item, index) => chapters.findIndex((other) => other.number === item.number) !== index);
if (duplicateNumbers.length) errors.push(`Duplicate chapter numbers: ${duplicateNumbers.map((item) => item.number).join(', ')}`);

const chapterFiles = walk(join(root, 'src/content/chapters')).filter((path) => path.endsWith('.md'));
const spellFiles = walk(join(root, 'src/content/spells')).filter((path) => path.endsWith('.json'));
if (coverage.mode === 'complete') {
  if (chapterFiles.length !== 62) errors.push(`Expected 61 chapters plus changelog, found ${chapterFiles.length} Markdown files.`);
  const expectedSpellCount = coverage.discoveredSpellRecords + research.newSpellIds.length;
  if (spellFiles.length !== expectedSpellCount) errors.push(`Expected ${coverage.discoveredSpellRecords} migrated plus ${research.newSpellIds.length} research spell files, found ${spellFiles.length}.`);
  const records = spellFiles.map((file) => JSON.parse(readFileSync(file, 'utf8')));
  const added = new Set(research.newSpellIds);
  for (const id of added) {
    const record = records.find((spell) => spell.id === id);
    if (!record?.sourceLocator?.startsWith('RESEARCH-20260907:')) errors.push(`Missing or untraceable research addition: ${id}`);
  }
  const migrated = records.filter((spell) => !added.has(spell.id));
  if (migrated.length !== coverage.discoveredSpellRecords || migrated.some((spell) => !/^B\d+/.test(spell.sourceLocator))) errors.push('Original migrated spell coverage changed.');
  const expectedLocators = [];
  let started = false;
  for (const block of source.blocks) {
    if (block.loc === 'B00010') started = true;
    const structuralHeading = block.kind === 'paragraph'
      && (block.style === 'heading 1' || (block.style === 'heading 2' && (/^\d+\.\s/.test(block.text) || /^Changelog$/i.test(block.text))));
    if (started && !structuralHeading) expectedLocators.push(block.loc);
  }
  const covered = new Set(coverage.coverage.map((item) => item.locator));
  const missing = expectedLocators.filter((locator) => !covered.has(locator));
  if (missing.length) errors.push(`Missing source blocks: ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '…' : ''}`);
}

for (const file of chapterFiles) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/href="\/chapters\/([^/]+)\/"/g)) {
    if (!existsSync(join(root, 'src/content/chapters', `${match[1]}.md`))) errors.push(`Broken chapter link in ${file}: ${match[1]}`);
  }
}

for (const file of spellFiles) {
  const record = JSON.parse(readFileSync(file, 'utf8'));
  if (!record.id || !record.name || !Number.isInteger(record.level)) errors.push(`Invalid spell record: ${file}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'pass',
  mode: coverage.mode,
  chapters: chapters.length,
  chapterFiles: chapterFiles.length,
  spellRecords: spellFiles.length,
  migratedBlocks: coverage.migratedBlocks,
}, null, 2));
