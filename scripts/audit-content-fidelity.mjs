import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourceFile = resolve(root, '../Wizard_Compendium_V2/01_Audit/extracted/Ultimate_Wizard_Compendium_FINAL_v1.14_DDB_Verified_Corrected__OneDrive.json');
const chapterDirectory = join(root, 'src/content/chapters');
const source = JSON.parse(await readFile(sourceFile, 'utf8'));

function tokens(value) {
  return String(value ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]*>/g, ' ').replace(/<!--[^>]*-->/g, ' ').normalize('NFKD').toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function coverage(sourceTokens, outputTokens) {
  const counts = new Map();
  for (const token of outputTokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  let found = 0;
  for (const token of sourceTokens) {
    const remaining = counts.get(token) ?? 0;
    if (remaining > 0) { found += 1; counts.set(token, remaining - 1); }
  }
  return sourceTokens.length ? found / sourceTokens.length : 1;
}

const locatorOutput = new Map();
for (const file of await readdir(chapterDirectory)) {
  const markdown = await readFile(join(chapterDirectory, file), 'utf8');
  const matches = [...markdown.matchAll(/<!-- source:(B\d+) -->/g)];
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index + matches[index][0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    locatorOutput.set(matches[index][1], { file, content: markdown.slice(start, end) });
  }
}

const substantive = source.blocks.filter((block) => {
  if (!block.text?.trim()) return block.loc === 'B00282';
  if (block.kind === 'paragraph' && ['Title', 'Subtitle', 'heading 1', 'heading 2'].includes(block.style)) return false;
  return block.loc >= 'B00010';
});

const failures = [];
let sourceTokenCount = 0;
let representedTokenCount = 0;
for (const block of substantive) {
  const sourceTokens = tokens(block.text);
  const output = locatorOutput.get(block.loc);
  const ratio = output ? coverage(sourceTokens, tokens(output.content)) : 0;
  sourceTokenCount += sourceTokens.length;
  representedTokenCount += Math.round(sourceTokens.length * ratio);
  if (ratio < 0.995) failures.push({ locator: block.loc, kind: block.kind, coverage: Number((ratio * 100).toFixed(1)), sourceTokens: sourceTokens.length, output: output?.file ?? null });
}

const report = {
  source: source.file, substantiveBlocks: substantive.length, sourceTokens: sourceTokenCount,
  representedTokens: representedTokenCount,
  tokenCoveragePercent: Number((representedTokenCount / sourceTokenCount * 100).toFixed(2)),
  incompleteBlocks: failures.length, failures,
};
await writeFile(join(root, 'docs/CONTENT_FIDELITY_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
