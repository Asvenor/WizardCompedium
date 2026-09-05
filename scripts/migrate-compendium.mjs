import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const siteRoot = resolve(import.meta.dirname, '..');
const workspaceRoot = resolve(siteRoot, '..');
const auditRoot = join(workspaceRoot, 'Wizard_Compendium_V2');
const sourcePath = join(
  auditRoot,
  '01_Audit/extracted/Ultimate_Wizard_Compendium_FINAL_v1.14_DDB_Verified_Corrected__OneDrive.json',
);
const formattingPath = join(
  auditRoot,
  '01_Audit/extracted/Ultimate_Wizard_Compendium_FINAL_v1.14_DDB_Verified_Corrected__OneDrive.formatting.json',
);
const imagePath = join(auditRoot, '01_Audit/original_image1.png');
const prototype = process.argv.includes('--prototype');
const prototypeChapters = new Set([1, 3, 5, 11, 43, 46]);
const prototypeSpells = new Set([
  'wall-of-force', 'shield', 'web', 'counterspell', 'fireball',
  'find-familiar', 'simulacrum', 'wish', 'fortunes-favor', 'misty-step',
]);

const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const formatting = JSON.parse(readFileSync(formattingPath, 'utf8'));

const chapterDir = join(siteRoot, 'src/content/chapters');
const spellDir = join(siteRoot, 'src/content/spells');
const dataDir = join(siteRoot, 'src/data');
const publicImageDir = join(siteRoot, 'public/images');
const docsDir = join(siteRoot, 'docs');

for (const path of [chapterDir, spellDir]) {
  if (existsSync(path)) rmSync(path, { recursive: true });
  mkdirSync(path, { recursive: true });
}
for (const path of [dataDir, publicImageDir, docsDir]) mkdirSync(path, { recursive: true });
copyFileSync(imagePath, join(publicImageDir, 'area-geometry-reference.png'));

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function normalizeName(value) {
  return value.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
}

const canonicalSpellNames = new Map([
  ['tiny hut', "Leomund's Tiny Hut"],
  ['resilient sphere', "Otiluke's Resilient Sphere"],
  ['telepathic bond', "Rary's Telepathic Bond"],
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const parts = [];
const chapters = [];
let currentPart = { id: 'front', title: 'Front matter', label: 'Front matter' };
let currentChapter = null;
let pendingPartBlocks = [];

for (const block of source.blocks) {
  if (block.kind === 'paragraph' && block.style === 'heading 1') {
    const match = block.text.match(/^PART\s+([IVX]+)\s*[·-]\s*(.+)$/i);
    currentPart = {
      id: match?.[1] ?? 'reference',
      label: match ? `Part ${match[1]}` : block.text,
      title: match?.[2] ?? block.text,
      locator: block.loc,
    };
    parts.push(currentPart);
    currentChapter = null;
    pendingPartBlocks = [];
    continue;
  }

  if (block.kind === 'paragraph' && block.style === 'heading 2') {
    const chapterMatch = block.text.match(/^(\d+)\.\s+(.+)$/);
    if (chapterMatch) {
      currentChapter = {
        number: Number(chapterMatch[1]),
        title: chapterMatch[2],
        locator: block.loc,
        part: currentPart,
        blocks: pendingPartBlocks,
      };
      pendingPartBlocks = [];
      chapters.push(currentChapter);
      continue;
    }
    if (/^Changelog$/i.test(block.text)) {
      currentChapter = {
        number: null,
        title: 'Changelog',
        locator: block.loc,
        part: { id: 'VIII', label: 'Part VIII', title: 'Setup + live play tools' },
        blocks: [],
      };
      chapters.push(currentChapter);
      continue;
    }
  }

  if (currentChapter) currentChapter.blocks.push(block);
  else if (currentPart.id !== 'front') pendingPartBlocks.push(block);
}

function hubFor(number) {
  if (number == null) return 'reference';
  if (number <= 3) return 'fundamentals';
  if (number <= 9 || number === 54) return 'builds';
  if (number <= 17 || number === 31 || number === 32) return 'spells';
  if ((number >= 18 && number <= 24) || [34, 35, 36, 37, 38, 40, 45, 52, 53, 58, 59, 60].includes(number)) return 'combat';
  if ((number >= 25 && number <= 33) || [39, 41].includes(number)) return 'gear';
  return 'reference';
}

for (const chapter of chapters) {
  chapter.slug = chapter.number == null
    ? 'changelog'
    : `${String(chapter.number).padStart(2, '0')}-${slugify(chapter.title)}`;
  chapter.hub = hubFor(chapter.number);
  chapter.description = chapter.blocks.find(
    (block) => block.kind === 'paragraph' && block.style === 'Normal' && block.text.trim(),
  )?.text ?? `Reference material from ${chapter.part.label}.`;
}

const chapterByNumber = new Map(chapters.filter((item) => item.number != null).map((item) => [item.number, item]));

function linkChapterReferences(escaped) {
  return escaped.replace(/\b(Chapter|Ch\.)\s*(\d+)([A-Z])?/gi, (match, prefix, number, suffix = '') => {
    const target = chapterByNumber.get(Number(number));
    if (!target) return match;
    return `<a href="/chapters/${target.slug}/">${prefix} ${number}${suffix}</a>`;
  });
}

function formatText(value) {
  return linkChapterReferences(escapeHtml(value)).replace(/\n/g, '<br>');
}

function renderTable(rows, locator, suffix = '') {
  if (!rows?.length) return '';
  const validRows = rows.filter((row) => row.some((cell) => String(cell ?? '').trim()));
  if (!validRows.length) return '';
  const oneColumn = validRows.every((row) => row.length === 1);
  if (oneColumn && validRows.length === 2) {
    return `<aside class="callout" data-source-locator="${locator}${suffix}"><strong>${formatText(validRows[0][0])}</strong><p>${formatText(validRows[1][0])}</p></aside>`;
  }
  const width = Math.max(...validRows.map((row) => row.length));
  const header = validRows[0];
  const body = validRows.slice(1);
  const headCells = Array.from({ length: width }, (_, index) => `<th scope="col">${formatText(header[index] ?? '')}</th>`).join('');
  const bodyRows = body.map((row) => `<tr>${Array.from({ length: width }, (_, index) => `<td>${formatText(row[index] ?? '')}</td>`).join('')}</tr>`).join('');
  return `<div class="table-wrap" data-source-locator="${locator}${suffix}" tabindex="0"><table><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
}

function renderBlock(block) {
  const marker = `<!-- source:${block.loc} -->`;
  if (block.kind === 'table') {
    const tables = block.nested_tables?.length
      ? block.nested_tables.map((table, index) => renderTable(table.rows, block.loc, `.T${String(index + 1).padStart(3, '0')}`)).join('\n\n')
      : renderTable(block.rows, block.loc);
    return `${marker}\n${tables}`;
  }

  const text = block.text?.trim();
  if (!text) {
    if (block.loc === 'B00282') {
      return `${marker}\n<figure class="source-figure"><img src="/images/area-geometry-reference.png" alt="Six area geometry diagrams for cone, cube, cylinder, emanation, line, and sphere"><figcaption>Area geometry reference from the source Compendium. Use the exact active rules text for adjudication.</figcaption></figure>`;
    }
    return marker;
  }
  if (block.style === 'heading 3') return `${marker}\n## ${text}`;
  if (block.style === 'heading 4') return `${marker}\n### ${text}`;
  if (block.style === 'List Bullet') return `${marker}\n- ${text}`;
  if (block.style === 'Small Note') return `${marker}\n<aside class="callout callout--note"><p>${formatText(text)}</p></aside>`;
  if (/^[A-Z0-9 &/+·—-]{5,}$/.test(text)) return `${marker}\n<p class="eyebrow">${formatText(text)}</p>`;
  return `${marker}\n${text}`;
}

const selectedChapters = chapters.filter((chapter) => !prototype || chapter.number == null || prototypeChapters.has(chapter.number));
const coverage = [];
for (const chapter of selectedChapters) {
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(chapter.title)}`,
    `chapter: ${chapter.number == null ? 'null' : chapter.number}`,
    `order: ${chapter.number ?? 999}`,
    `part: ${JSON.stringify(chapter.part.label)}`,
    `partTitle: ${JSON.stringify(chapter.part.title)}`,
    `hub: ${JSON.stringify(chapter.hub)}`,
    `sourceLocator: ${JSON.stringify(chapter.locator)}`,
    `description: ${JSON.stringify(chapter.description)}`,
    '---',
    '',
  ].join('\n');
  const body = chapter.blocks.map(renderBlock).join('\n\n');
  writeFileSync(join(chapterDir, `${chapter.slug}.md`), `${frontmatter}${body}\n`);
  for (const block of chapter.blocks) coverage.push({ locator: block.loc, output: `src/content/chapters/${chapter.slug}.md` });
}

const masterTable = source.blocks.find((block) => block.loc === 'B00142');
const runs = formatting.spans.filter((span) => span.loc.startsWith('B00142.RUN'));
const acquisitionColors = new Map([
  ['A65336', 'mandatory'],
  ['2F6FB4', 'optional'],
  ['7252B8', 'sleeper'],
]);
const roleByName = new Map();
const preparedByName = new Map();
for (const run of runs) {
  const key = normalizeName(run.text ?? '');
  const role = acquisitionColors.get(run.direct_format?.color?.val?.toUpperCase());
  if (role && key.length > 1) roleByName.set(key, role);
  if (run.direct_format?.u?.val === 'single' && key.length > 1) preparedByName.set(key, true);
}

const spells = new Map();
function ensureSpell(name, level, sourceLocator) {
  const rawName = name.replace(/\s+\[[A-Z]\](?:\[[A-Z]\])*$/g, '').trim();
  const cleanName = canonicalSpellNames.get(normalizeName(rawName)) ?? rawName;
  const id = slugify(cleanName.replace(/’/g, "'"));
  if (!id) return null;
  if (!spells.has(id)) {
    spells.set(id, {
      id,
      name: cleanName,
      level,
      school: null,
      rules: {
        castingTime: null,
        range: null,
        area: null,
        duration: null,
        concentration: /\[C\]/.test(name),
        ritual: /\[R\]/.test(name),
        components: { verbal: null, somatic: null, material: null, description: null, gpCost: null, consumed: null },
        damageTypes: [],
        save: { ability: null, type: null },
        attackRoll: false,
      },
      source: {
        book: /\[D\]/.test(name) ? "Explorer's Guide to Wildemount" : null,
        rulesVersion: /\[D\]|\[X\]/.test(name) ? 'Enabled expanded source' : '2024 baseline unless active entry says otherwise',
        category: /\[D\]/.test(name) ? 'Dunamancy' : /\[X\]/.test(name) ? 'Expanded' : 'Core / active entry',
        sourceSensitive: /\[D\]|\[X\]/.test(name),
      },
      compendium: {
        tier: null,
        acquisitionRole: roleByName.get(normalizeName(cleanName)) ?? 'unclassified',
        preparedBaseline: preparedByName.get(normalizeName(cleanName)) ?? false,
        roles: [],
        summary: 'The Compendium includes this spell in its maintained spellbook pool; consult the active spell entry for complete rules text.',
        buildRelevance: /\[B\]/.test(name) ? ['bladesinger'] : [],
        warnings: ['The Compendium index is an operating reference, not replacement spell text. Confirm the active D&D Beyond entry before casting.'],
        relatedChapters: [11, 15],
      },
      sourceLocator,
    });
  }
  return spells.get(id);
}

const levelNames = new Map([
  ['CANTRIPSKnown', 0], ['1STLevel 1', 1], ['2NDLevel 2', 2], ['3RDLevel 3', 3],
  ['4THLevel 4', 4], ['5THLevel 5', 5], ['6THLevel 6', 6], ['7THLevel 7', 7],
  ['8THLevel 8', 8], ['9THLevel 9', 9],
]);
for (const row of masterTable.rows) {
  const level = levelNames.get(row[0]);
  if (level == null || !row[1]) continue;
  for (const item of row[1].split(/,\s+/)) ensureSpell(item, level, 'B00142');
}

const taggedRows = [];
for (const block of source.blocks) {
  if (block.kind !== 'table' || !block.rows?.length) continue;
  const header = block.rows[0].map((cell) => String(cell).trim());
  const spellColumn = header.findIndex((cell) => cell === 'Spell');
  const levelColumn = header.findIndex((cell) => ['Lv', 'Level', 'Spell level'].includes(cell));
  if (spellColumn < 0 || levelColumn < 0) continue;
  const timeColumn = header.findIndex((cell) => cell === 'Time');
  const rangeColumn = header.findIndex((cell) => /Range/.test(cell));
  const testColumn = header.findIndex((cell) => cell === 'Test');
  const concentrationColumn = header.findIndex((cell) => cell === 'C/Rit');
  const sourceColumn = header.findIndex((cell) => cell === 'Src');
  const summaryColumn = header.findIndex((cell) => /Fast role|burden|Purpose|Role/.test(cell));
  for (const row of block.rows.slice(1)) {
    const rawLevel = String(row[levelColumn] ?? '').trim();
    const level = /^cantrip$/i.test(rawLevel) ? 0 : Number(rawLevel);
    if (!Number.isInteger(level) || level < 0 || level > 9) continue;
    const spell = ensureSpell(row[spellColumn], level, block.loc);
    if (!spell) continue;
    taggedRows.push({ block, row, spell });
    const cRit = concentrationColumn >= 0 ? row[concentrationColumn] ?? '' : '';
    spell.rules.concentration ||= /(^|\/)C($|\/)/.test(cRit);
    spell.rules.ritual ||= /Rit/.test(cRit);
    if (timeColumn >= 0 && row[timeColumn]) {
      spell.rules.castingTime = ({ A: 'Action', BA: 'Bonus Action', R: 'Reaction' })[row[timeColumn]] ?? row[timeColumn];
    }
    if (rangeColumn >= 0 && row[rangeColumn]) {
      const [range, ...area] = row[rangeColumn].split(/\s+\/\s+/);
      spell.rules.range = range;
      spell.rules.area = area.length ? area.join(' / ') : null;
    }
    if (testColumn >= 0 && row[testColumn]) {
      const test = row[testColumn];
      spell.rules.attackRoll = /Atk/.test(test);
      const ability = test.match(/\b(STR|DEX|CON|INT|WIS|CHA)\b/)?.[1] ?? null;
      spell.rules.save.ability = ability;
      spell.rules.save.type = ability ? 'saving throw' : (test !== '—' ? test : null);
    }
    const sourceCode = sourceColumn >= 0 ? row[sourceColumn] : null;
    if (sourceCode) {
      const sourceMap = {
        '24': ["Player's Handbook (2024)", '2024', 'Core', false],
        '5eC': ['Enabled 5e Core source', '2014 / active entry', 'Legacy core', true],
        '5eX': ['Enabled 5e Expanded source', 'Expanded / active entry', 'Expanded', true],
        Duna: ["Explorer's Guide to Wildemount", 'Expanded / active entry', 'Dunamancy', true],
      };
      const mapped = sourceMap[sourceCode];
      if (mapped) {
        [spell.source.book, spell.source.rulesVersion, spell.source.category, spell.source.sourceSensitive] = mapped;
      }
    }
    if (summaryColumn >= 0 && row[summaryColumn]) spell.compendium.summary = row[summaryColumn];
    spell.sourceLocator = block.loc;
  }
}

function spellForName(name) {
  const canonical = canonicalSpellNames.get(normalizeName(name)) ?? name;
  return spells.get(slugify(canonical.replace(/’/g, "'")));
}

function addRelatedChapter(spell, number) {
  spell.compendium.relatedChapters = [...new Set([...spell.compendium.relatedChapters, number])].sort((a, b) => a - b);
}

// Chapter 16 is the authoritative Compendium layer for Dunamancy priority and cautions.
for (const locator of ['B00200', 'B00202']) {
  const table = source.blocks.find((block) => block.loc === locator);
  if (!table) continue;
  for (const row of table.rows.slice(1)) {
    const rawLevel = String(row[0] ?? '').trim();
    const level = /^cantrip$/i.test(rawLevel) ? 0 : Number(rawLevel);
    if (!Number.isInteger(level)) continue;
    const spell = ensureSpell(row[1], level, locator);
    if (!spell) continue;
    spell.source.book = "Explorer's Guide to Wildemount";
    spell.source.rulesVersion = 'Expanded / active entry';
    spell.source.category = 'Dunamancy';
    spell.source.sourceSensitive = true;
    if (locator === 'B00200') {
      const tier = String(row[2] ?? '').match(/^[SABCDF](?:\+)?/i)?.[0]?.toUpperCase();
      if (tier) spell.compendium.tier = tier;
      if (row[3]) spell.compendium.summary = row[3];
      if (row[4]) spell.compendium.warnings.unshift(row[4]);
    } else {
      if (row[2]) spell.compendium.summary = row[2];
      if (row[3]) spell.compendium.warnings.unshift(row[3]);
    }
    addRelatedChapter(spell, 16);
  }
}

// Chapter 25 component tables supply the material descriptions and consumption rules
// that belong on the reusable spell record as well as in the long-form chapter.
for (const locator of ['B00411', 'B00413', 'B00418']) {
  const block = source.blocks.find((item) => item.loc === locator);
  const rows = block?.nested_tables?.[0]?.rows ?? block?.rows;
  if (!rows) continue;
  for (const row of rows.slice(1)) {
    const names = String(row[0] ?? '').split(/\s+\/\s+/).map((name) => name.trim());
    for (const name of names) {
      const spell = spellForName(name);
      if (!spell) continue;
      const description = String(row[1] ?? '').trim();
      const consumedText = String(row[2] ?? '').trim();
      const whyItMatters = String(row[3] ?? '').trim();
      spell.rules.components.material = true;
      spell.rules.components.description = description;
      spell.rules.components.consumed = /^yes$/i.test(consumedText)
        ? true
        : /^(no|not consumed)/i.test(consumedText) ? false : null;
      const cost = description.match(/([\d,]+)\+?\s*(?:gp|GP)/)?.[1];
      if (cost) spell.rules.components.gpCost = Number(cost.replace(/,/g, ''));
      if (whyItMatters) spell.compendium.warnings.push(`Component planning: ${whyItMatters}`);
      addRelatedChapter(spell, 25);
    }
  }
}

// Chapter 23's safety matrix is spell-specific operational information.
const safetyTable = source.blocks.find((block) => block.loc === 'B00371');
for (const row of safetyTable?.rows.slice(1) ?? []) {
  const names = String(row[0] ?? '').split(/\s+\/\s+/).map((name) => name.trim());
  for (const name of names) {
    const spell = spellForName(name);
    if (!spell) continue;
    if (row[1]) spell.compendium.warnings.push(`Pre-cast gate: ${row[1]}`);
    if (row[2]) spell.compendium.warnings.push(`Failure state: ${row[2]}`);
    if (row[3]) spell.compendium.warnings.push(`Safe operating default: ${row[3]}`);
    addRelatedChapter(spell, 23);
  }
}

for (const block of source.blocks.filter((item) => item.loc >= 'B00757' && item.loc <= 'B00765' && item.kind === 'table')) {
  for (const row of block.rows.slice(1)) {
    const spell = spellForName(String(row[0]));
    if (!spell) continue;
    const role = row[1] ?? '';
    const roleTags = role.split(/\s*\/\s*/).map(slugify).filter(Boolean);
    spell.compendium.roles = [...new Set([...spell.compendium.roles, ...roleTags])];
    if (row[2]) spell.compendium.summary = row[2];
    const related = String(row[3] ?? '').match(/\d+/g)?.map(Number) ?? [];
    spell.compendium.relatedChapters = [...new Set([...spell.compendium.relatedChapters, ...related, 47])].sort((a, b) => a - b);
  }
}

for (const spell of spells.values()) {
  if (spell.source.sourceSensitive) {
    spell.compendium.warnings.unshift('Source-sensitive: availability does not grant permission by itself; use the exact selectable entry and campaign rules.');
  }
  if (spell.source.category === 'Dunamancy') {
    spell.compendium.relatedChapters = [...new Set([...spell.compendium.relatedChapters, 16])].sort((a, b) => a - b);
  }
  const costMatch = spell.compendium.summary.match(/(?:consumes?\s+)?([\d,]+)\+?\s*gp/i);
  if (costMatch) spell.rules.components.gpCost = Number(costMatch[1].replace(/,/g, ''));
}

const selectedSpells = [...spells.values()]
  .filter((spell) => !prototype || prototypeSpells.has(spell.id))
  .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
for (const spell of selectedSpells) {
  const folder = spell.level === 0 ? 'cantrips' : `level-${spell.level}`;
  const targetDir = join(spellDir, folder);
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(join(targetDir, `${spell.id}.json`), `${JSON.stringify(spell, null, 2)}\n`);
}

function chapterLinks(value) {
  return [...new Set((String(value).match(/\d+/g) ?? []).map(Number))]
    .map((number) => ({ number, title: chapterByNumber.get(number)?.title ?? `Chapter ${number}`, slug: chapterByNumber.get(number)?.slug ?? '' }))
    .filter((item) => item.slug);
}

const problemGroups = [];
const quickTable = source.blocks.find((block) => block.loc === 'B00008');
const quickHeaders = [quickTable.rows[0][0], quickTable.rows[0][2], quickTable.rows[0][4]];
for (let pair = 0; pair < 3; pair += 1) {
  problemGroups.push({
    title: quickHeaders[pair].replace(' PROBLEM', ''),
    items: quickTable.rows.slice(1)
      .filter((row) => row[pair * 2]?.trim())
      .map((row) => ({ problem: row[pair * 2].trim(), chapters: chapterLinks(row[pair * 2 + 1]) })),
  });
}

const detailedProblems = [];
for (const [locator, title] of [['B00750', 'Combat problems'], ['B00753', 'Exploration, objective and resource problems']]) {
  const table = source.blocks.find((block) => block.loc === locator)?.nested_tables?.[0];
  if (!table) continue;
  detailedProblems.push({
    title,
    items: table.rows.slice(1).map((row) => ({
      problem: row[0], answer: row[1], check: row[2], chapters: chapterLinks(row[3]),
    })),
  });
}

const chapterIndex = chapters.filter((chapter) => chapter.number != null).map((chapter) => ({
  number: chapter.number,
  title: chapter.title,
  slug: chapter.slug,
  part: chapter.part.label,
  partTitle: chapter.part.title,
  hub: chapter.hub,
  description: chapter.description,
  sourceLocator: chapter.locator,
}));
writeFileSync(join(dataDir, 'chapters.json'), `${JSON.stringify(chapterIndex, null, 2)}\n`);
writeFileSync(join(dataDir, 'problem-navigator.json'), `${JSON.stringify({ quick: problemGroups, detailed: detailedProblems }, null, 2)}\n`);
writeFileSync(join(dataDir, 'migration-coverage.json'), `${JSON.stringify({
  mode: prototype ? 'prototype' : 'complete',
  source: source.file,
  sourceBlocks: source.blocks.length,
  numberedChapters: chapterIndex.length,
  outputChapters: selectedChapters.length,
  canonicalSpellRecords: selectedSpells.length,
  discoveredSpellRecords: spells.size,
  migratedBlocks: coverage.length,
  coverage,
}, null, 2)}\n`);

const inventory = `# Migration content inventory\n\n` +
  `Primary source: \`${source.file}\`\n\n` +
  `- 61 numbered chapters across 8 parts\n` +
  `- ${source.blocks.filter((block) => block.kind === 'paragraph').length} direct paragraphs\n` +
  `- ${source.blocks.filter((block) => block.kind === 'table').length} top-level tables\n` +
  `- ${source.blocks.reduce((count, block) => count + (block.nested_tables?.length ?? 0), 0)} nested tables\n` +
  `- ${source.outline.length} headings in the full outline\n` +
  `- 1 source image, preserved in Chapter 20\n` +
  `- ${spells.size} canonical Compendium spell records discovered from the Master Spellbook Pool and structured spell indexes\n\n` +
  `## Chapters\n\n` +
  chapterIndex.map((item) => `- Chapter ${item.number}: ${item.title} (${item.part}; ${item.sourceLocator})`).join('\n') + '\n';
writeFileSync(join(docsDir, 'MIGRATION_AUDIT.md'), inventory);

console.log(JSON.stringify({
  mode: prototype ? 'prototype' : 'complete',
  chapters: selectedChapters.length,
  numberedChaptersInventoried: chapterIndex.length,
  spellRecords: selectedSpells.length,
  discoveredSpells: spells.size,
  migratedBlocks: coverage.length,
}, null, 2));
