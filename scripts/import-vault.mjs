import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parse as parseYaml, stringify as stringifyYaml} from 'yaml';
import GithubSlugger from 'github-slugger';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSource = '/Users/raccoon/Library/CloudStorage/OneDrive-Persönlich/Dokumente/Wizard Compendium Vault';
const sourceArg = process.argv.find(arg => arg.startsWith('--source='));
const source = path.resolve(sourceArg ? sourceArg.slice('--source='.length) : defaultSource);
const checking = process.argv.includes('--check');
const output = path.join(project, 'src/content/vault');
const dataFile = path.join(project, 'src/data/vault-index.json');
const auditFile = path.join(project, 'src/data/vault-audit.json');
const snapshot = path.join(project, 'vault-source');
const assetDirectory = path.join(project, 'public/vault-assets');
const sections = [
  ['001 Home', 'home', 'Start here', 'Navigators, quick decisions, and the compendium guide.'],
  ['002 Character', 'character', 'Character & builds', 'Subclasses, 35 core progression routes, equipment, and build decisions.'],
  ['003 Spells', 'spells', 'Spells', 'Spell cards, access requirements, preparation priorities, and spellbook choices.'],
  ['004 Items & Crafting', 'items', 'Items & crafting', 'Magic items, attunement, components, and crafting decisions.'],
  ['005 Creature, Minions & Forms', 'creatures', 'Creatures & forms', 'Familiars, summons, undead, transformation candidates, and original stat blocks.'],
  ['006 Housing & Bastion', 'bastions', 'Bastions & downtime', 'Facilities, hirelings, crafting, headquarters, and long-term development.'],
  ['007 Tactics', 'tactics', 'Combat & tactics', 'First turns, concentration, reactions, spell combinations, and problem solving.'],
  ['008 Advanced Wizardry', 'advanced', 'Advanced wizardry', 'Complex spells, infrastructure, intelligence, and ruling-sensitive interactions.'],
  ['009 Reference', 'reference', 'Rules reference', 'Conditions, timing, sources, and the boundaries that decide a play.'],
  ['010 Tier Lists', 'tiers', 'Tier lists', 'Contextual optimization rankings with their assumptions and tradeoffs.'],
  ['011 Inbox', 'inbox', 'Templates', 'The source vault’s reusable note templates.'],
  ['100 Assets', 'assets', 'Additional references', 'Source material accompanying stat-block galleries.'],
].map(([folder, id, label, description], order) => ({folder, id, label, description, order, count:0}));
const sectionByFolder = new Map(sections.map(section => [section.folder, section]));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const portable = value => value.split(path.sep).join('/');
const slug = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'note';
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const markdownLabel = value => String(value).replace(/\|/g, '&#124;').replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/([_*`~])/g, '\\$1');
const key = value => value.normalize('NFC').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\.(md|base)$/i, '').toLowerCase();
const href = note => `/library/${note.slug}/`;
const counts = {};
const audit = {sourceDirectory:source, sourceHash:'', noteCount:0, assetCount:0, sourceUnchanged:false,
  unresolvedLinks:[], ambiguousLinks:[], unresolvedAnchors:[], transformations:[], files:[]};

async function walk(directory) {
  const children = await fs.readdir(directory, {withFileTypes:true});
  const lists = await Promise.all(children.filter(child => !child.name.startsWith('.')).map(async child => {
    const full = path.join(directory, child.name);
    return child.isDirectory() ? walk(full) : [full];
  }));
  return lists.flat().sort((a,b) => portable(a).localeCompare(portable(b), 'en'));
}

function plain(value) {
  return String(value).replace(/!?\[\[([^\]]+)\]\]/g, (_, target) => {
    const parts = target.replace(/\\\|/g, '|').split('|');
    const wikiTarget = parts[0];
    return parts[1] ?? (wikiTarget.includes('#') ? wikiTarget.split('#').slice(1).join('#') : path.basename(wikiTarget).replace(/\.md$/i, ''));
  }).replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '')
    .replace(/[`*_~]/g, '').replace(/\\([\p{P}\p{S}])/gu, '$1').trim();
}

function splitDocument(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  const metadata = match ? parseYaml(match[1]) ?? {} : {};
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Expected YAML mapping');
  return {metadata, body:match ? normalized.slice(match[0].length) : normalized};
}

function headingsFor(body) {
  const slugger = new GithubSlugger();
  const headings = new Map();
  let fence = false, removed = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {fence = !fence; continue;}
    if (fence) continue;
    const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!heading) continue;
    const label = plain(heading[2]);
    if (heading[1] === '#' && !removed) {removed = true; headings.set(key(label), ''); continue;}
    const anchor = slugger.slug(label);
    if (!headings.has(key(label))) headings.set(key(label), anchor);
  }
  return headings;
}

function summaryFor(body, metadata) {
  const decision = body.match(/^## (?:Decision|Best use.*|Why .*|Purpose)\s*\n+([^#\n][^\n]+)/m)?.[1];
  const paragraphs = body.split(/\n\s*\n/).map(plain).filter(paragraph => paragraph.length > 45 &&
    !paragraph.startsWith('#') && !paragraph.startsWith('|') && !paragraph.startsWith('>') &&
    !paragraph.startsWith('<!--') && !paragraph.includes('→') && !paragraph.includes(' · '));
  const candidate = decision ? plain(decision) : paragraphs[0] ?? metadata.verification ?? metadata.rules_status ?? 'Open the complete reference note.';
  const compact = candidate.replace(/\s+/g, ' ');
  return compact.length > 220 ? compact.slice(0, 220).replace(/\s+\S*$/, '')+'…' : compact;
}

const files = await walk(source);
const records = await Promise.all(files.map(async filename => {
  const bytes = await fs.readFile(filename);
  const stat = await fs.stat(filename);
  const relative = portable(path.relative(source, filename));
  const extension = path.extname(filename).toLowerCase();
  const dimensions = extension === '.png' && bytes.length >= 24 && bytes.subarray(1,4).toString() === 'PNG' ?
    {width:bytes.readUInt32BE(16), height:bytes.readUInt32BE(20)} : {};
  return {filename, relative, bytes, sha256:sha(bytes), modifiedAt:stat.mtime.toISOString(), extension, ...dimensions};
}));
audit.files = records.map(record => ({path:record.relative, sha256:record.sha256, bytes:record.bytes.length}));
audit.sourceHash = sha(audit.files.map(file => `${file.path}\0${file.sha256}\n`).join(''));
const notes = records.filter(record => record.extension === '.md').map(record => {
  const {metadata, body} = splitDocument(record.bytes.toString('utf8'));
  if (metadata.type === 'spell' && metadata.access === undefined) {
    const access = body.match(/^\|\s*Access\s*\|\s*([^\n]+?)\s*\|\s*$/m)?.[1];
    if (access) metadata.access = plain(access);
  }
  const relativeParts = record.relative.split('/');
  const section = sectionByFolder.get(relativeParts[0]);
  if (!section) throw new Error(`Unknown vault section: ${relativeParts[0]}`);
  const noteSlug = [section.id, ...relativeParts.slice(1).map(part => slug(part.replace(/\.md$/i, '')))].join('/');
  const firstHeading = body.match(/^#\s+(.+)$/m)?.[1];
  const title = plain(metadata.name ?? metadata.item ?? (firstHeading?.includes('{{') ? undefined : firstHeading) ?? path.basename(record.relative, '.md'));
  const type = section.id === 'inbox' ? 'template' : metadata.type ?? (section.id === 'tiers' ? 'tier-list' : 'reference');
  section.count++;
  counts[type] = (counts[type] ?? 0) + 1;
  return {...record, id:noteSlug, slug:noteSlug, title, section:section.id, sectionLabel:section.label, type,
    summary:summaryFor(body, metadata), sourcePath:record.relative, updatedAt:record.modifiedAt,
    metadata, body, headingAnchors:headingsFor(body), links:new Set(), backlinks:new Set(),
    blockIds:new Set([...body.matchAll(/\^([A-Za-z0-9-]+)\s*$/gm)].map(match => match[1]))};
});
const slugs = new Set();
for (const note of notes) {if(slugs.has(note.slug)) throw new Error(`Slug collision: ${note.slug}`); slugs.add(note.slug);}
const noteByPath = new Map(notes.map(note => [note.relative, note]));
const names = new Map();
for (const record of records) {
  const note = noteByPath.get(record.relative);
  const aliases = Array.isArray(note?.metadata.aliases) ? note.metadata.aliases : note?.metadata.aliases ? [note.metadata.aliases] : [];
  for (const name of [record.relative, path.basename(record.relative), ...aliases]) {
    const normalized = key(name);
    if (!names.has(normalized)) names.set(normalized, new Set());
    names.get(normalized).add(record);
  }
}

function resolveFile(target, from) {
  const normalized = key(target);
  let candidates = [...(names.get(normalized) ?? [])];
  if (!candidates.length && !target.includes('/')) {
    const local = key(`${path.dirname(from.relative)}/${target}`);
    candidates = [...(names.get(local) ?? [])];
  }
  if (candidates.length > 1) {
    const local = candidates.filter(record => path.dirname(record.relative) === path.dirname(from.relative));
    const section = candidates.filter(record => record.relative.split('/')[0] === from.relative.split('/')[0]);
    audit.ambiguousLinks.push({from:from.relative, target, candidates:candidates.map(record=>record.relative),
      resolution:(local[0] ?? section[0] ?? candidates[0]).relative});
    candidates = local.length === 1 ? local : section.length === 1 ? section : candidates;
  }
  return candidates[0];
}

function reference(target, from) {
  const [filePart, ...fragmentParts] = target.split('#');
  const fragment = fragmentParts.join('#');
  const record = filePart ? resolveFile(filePart, from) : from;
  if (!record) {
    audit.unresolvedLinks.push({from:from.relative, target});
    return {url:`/library/?q=${encodeURIComponent(filePart)}`, missing:true};
  }
  const destination = noteByPath.get(record.relative);
  if (destination) {
    from.links.add(destination.slug);
    destination.backlinks.add(from.slug);
    let anchor = '';
    if (fragment.startsWith('^')) {
      const block = fragment.slice(1);
      if (destination.blockIds.has(block)) anchor = `#block-${block}`;
      else audit.unresolvedAnchors.push({from:from.relative, target, destination:destination.relative, kind:'block'});
    } else if (fragment) {
      const match = destination.headingAnchors.get(key(plain(fragment)));
      if (match !== undefined) anchor = match ? `#${match}` : '';
      else {
        audit.unresolvedAnchors.push({from:from.relative, target, destination:destination.relative, kind:'heading'});
        // Keep the note accessible when the source heading was renamed or removed.
      }
    }
    return {url:href(destination) + anchor, destination};
  }
  if (record.extension === '.base') return {url:record.relative.startsWith('003 ') ? '/spells/' : '/items/', catalogue:record};
  const assetPath = record.relative.split('/').map(encodeURIComponent).join('/');
  return {url:`/vault-assets/${assetPath}`, asset:record};
}

function fieldValue(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(fieldValue).join(', ') || '—';
  return markdownLabel(value).replace(/\n/g, ' ');
}

function tableFor(candidates, columns) {
  const heading = ['Reference', ...columns.map(column => column.label)];
  const rows = candidates.map(note => [`[${markdownLabel(note.title)}](${href(note)})`, ...columns.map(column => fieldValue(note.metadata[column.field]))]);
  return ['| ' + heading.join(' | ') + ' |', '| ' + heading.map(()=>'---').join(' | ') + ' |', ...rows.map(row=>'| '+row.join(' | ')+' |')].join('\n');
}

function queryTable(query, from) {
  const columns = [...query.matchAll(/([\w.]+)\s+AS\s+"([^"]+)"/g)].map(match=>({field:match[1], label:match[2]}));
  const where = query.match(/^WHERE\s+(.+)$/m)?.[1];
  const folder = query.match(/^FROM\s+"([^"]+)"$/m)?.[1];
  let candidates = notes.filter(note => folder ? note.relative.startsWith(folder+'/') : note.type === 'creature');
  if (where) {
    const testClause = (note, clause) => {
      const match = clause.trim().match(/^(\w+)\s*(=|>|>=|<|<=)\s*(true|false|\d+(?:\.\d+)?)$/);
      if (!match) throw new Error(`Unsupported Dataview condition in ${from.relative}: ${clause}`);
      const left = note.metadata[match[1]], right = match[3] === 'true' ? true : match[3] === 'false' ? false : Number(match[3]);
      return match[2] === '=' ? left === right : match[2] === '>' ? left > right : match[2] === '>=' ? left >= right : match[2] === '<' ? left < right : left <= right;
    };
    candidates = candidates.filter(note => where.split(/\s+OR\s+/).some(group => group.split(/\s+AND\s+/).every(clause=>testClause(note,clause))));
  }
  const sort = query.match(/^SORT\s+([\w.]+)\s+(ASC|DESC)$/m);
  if (sort) candidates.sort((a,b)=> {
    if (sort[1] === 'file.name') return a.title.localeCompare(b.title)*(sort[2] === 'DESC' ? -1 : 1);
    const numeric = value => typeof value === 'string' && value.includes('/') ? value.split('/').reduce((a,b)=>Number(a)/Number(b)) : Number(value);
    return (numeric(a.metadata[sort[1]])-numeric(b.metadata[sort[1]]))*(sort[2] === 'DESC' ? -1 : 1);
  });
  for (const destination of candidates) {from.links.add(destination.slug); destination.backlinks.add(from.slug);}
  audit.transformations.push({from:from.relative, kind:'dataview-table', count:candidates.length, fields:columns.map(column=>column.field)});
  return `[Open the searchable form finder](/forms/).\n\n${tableFor(candidates, columns)}`;
}

function catalogueFor(record, from) {
  const config = parseYaml(record.bytes.toString('utf8'));
  const isSpell = record.relative.startsWith('003 ');
  const candidates = notes.filter(note => note.section === (isSpell ? 'spells' : 'items') && note.type === (isSpell ? 'spell' : 'magic-item'));
  const views = config.views ?? [];
  const finder = isSpell ? '/spells/' : '/items/';
  const columns = isSpell ? [{field:'level',label:'Level'},{field:'school',label:'School'},{field:'casting_time',label:'Casting time'},
    {field:'concentration',label:'Concentration'},{field:'ritual',label:'Ritual'},{field:'save',label:'Saves'},
    {field:'roles',label:'Roles'},{field:'source_group',label:'Source'}] : [{field:'rarity',label:'Rarity'},
    {field:'attunement',label:'Attunement'},{field:'access',label:'Access requirement'},{field:'roles',label:'Tactical roles'},
    {field:'source_group',label:'Source group'},{field:'source',label:'Edition / book'},{field:'evidence',label:'Rules evidence'}];
  for (const destination of candidates) {from.links.add(destination.slug); destination.backlinks.add(from.slug);}
  audit.transformations.push({from:from.relative, kind:'base-catalogue', source:record.relative, count:candidates.length,
    views:views.map(view=>view.name), fields:columns.map(column=>column.field)});
  const viewText = views.map(view=>view.name).join(', ');
  const sorted = [...candidates].sort((a,b)=>isSpell ? Number(a.metadata.level)-Number(b.metadata.level)||a.title.localeCompare(b.title) : Number(a.metadata.rarity_rank)-Number(b.metadata.rarity_rank)||a.title.localeCompare(b.title));
  return `[Open the searchable ${isSpell ? 'spell' : 'item'} catalogue](${finder}) to compare ${viewText.toLowerCase()}.\n\n${tableFor(sorted, columns)}`;
}

function convertLinks(text, from) {
  return text.replace(/(!?)\[\[([^\]]+)\]\]/g, (_, embed, inner) => {
    const [target, ...aliasParts] = inner.replace(/\\\|/g, '|').split('|');
    const alias = aliasParts.join('|');
    const resolved = reference(target, from);
    const label = alias || (target.includes('#') ? target.split('#').slice(1).join('#') : path.basename(target).replace(/\.md$/i,'')) || target.replace(/^#/, '');
    if (embed && resolved.catalogue) return catalogueFor(resolved.catalogue, from);
    if (embed && resolved.asset) {
      if (/\.(png|jpe?g|gif|webp|svg)$/i.test(resolved.asset.relative)) {
        const size = alias.match(/^(\d+)(?:x(\d+))?$/);
        const dimensions = size ? ` width="${size[1]}"${size[2] ? ` height="${size[2]}"` : ''}` :
          resolved.asset.width ? ` width="${resolved.asset.width}" height="${resolved.asset.height}"` : '';
        const alt = size ? path.basename(resolved.asset.relative, resolved.asset.extension) : label.replace(/\.\w+$/, '');
        return `<img src="${resolved.url}" alt="${escapeHtml(alt)}"${dimensions} loading="lazy" decoding="async" />`;
      }
      if (resolved.asset.extension === '.pdf') return `[Open ${markdownLabel(label)}](${resolved.url})\n\n<object data="${resolved.url}" type="application/pdf" class="vault-pdf" aria-label="${escapeHtml(label)}"><a href="${resolved.url}">Download ${escapeHtml(label)}</a></object>`;
    }
    if (embed && resolved.destination) {
      audit.transformations.push({from:from.relative, kind:'embedded-note-link', target});
      return `> **Related reference:** [${markdownLabel(label)}](${resolved.url})`;
    }
    return `[${markdownLabel(label)}](${resolved.url})`;
  });
}

function convertCallouts(body, from) {
  const lines = body.split('\n'), out = [];
  for (let position = 0; position < lines.length; position++) {
    const start = lines[position].match(/^>\s*\[!([\w-]+)\]([+-]?)\s*(.*)$/);
    if (!start) {out.push(lines[position]); continue;}
    const [, kind, fold, title] = start;
    const content = [];
    while (position + 1 < lines.length && /^>/.test(lines[position+1])) content.push(lines[++position].replace(/^>\s?/, ''));
    const label = title.trim() || ({info:'Information',tip:'Tip',warning:'Check before using',important:'Important',note:'Note'}[kind] ?? kind.charAt(0).toUpperCase()+kind.slice(1));
    audit.transformations.push({from:from.relative, kind:'callout', label, calloutType:kind});
    if (fold) out.push(`<details class="callout callout-${kind}"${fold === '+' ? ' open' : ''}><summary>${escapeHtml(plain(label))}</summary>`, '', ...content, '', '</details>');
    else out.push(`<aside class="callout callout-${kind}" data-callout="${kind}">`, '', `**${label}**`, '', ...content, '', '</aside>');
  }
  return out.join('\n');
}

function convertBody(note) {
  let body = note.body.replace(/```dataview\s*\n([\s\S]*?)\n```/g, (_, query)=>queryTable(query, note));
  body = convertLinks(body, note);
  body = convertCallouts(body, note);
  // The page supplies its own H1. Preserve further section headings as H2.
  let removedTitle = false, fence = false;
  body = body.split('\n').map(line => {
    if (/^\s*(```|~~~)/.test(line)) {fence = !fence; return line;}
    if (!fence && /^#\s+/.test(line)) {
      if (!removedTitle) {removedTitle = true; audit.transformations.push({from:note.relative, kind:'page-title', text:plain(line.replace(/^#\s+/,''))}); return '';}
      return '#' + line;
    }
    if (!fence && /^\^[A-Za-z0-9-]+\s*$/.test(line)) return `<span id="block-${line.trim().slice(1)}" class="block-anchor" aria-hidden="true"></span>`;
    if (!fence) return line.replace(/\s+\^([A-Za-z0-9-]+)\s*$/, ' <span id="block-$1" class="block-anchor" aria-hidden="true"></span>');
    return line;
  }).join('\n');
  return body.trim() + '\n';
}

let existing;
try {existing = JSON.parse(await fs.readFile(dataFile, 'utf8'));} catch {}
const importedAt = existing?.sourceHash === audit.sourceHash ? existing.importedAt : new Date().toISOString();
const converted = notes.map(note => ({note, body:convertBody(note)}));
const index = {noteCount:notes.length, importedAt, sourceHash:audit.sourceHash,
  sections:sections.map(({folder,...section})=>section), notes:notes.map(note=>({id:note.id, slug:note.slug, title:note.title,
    section:note.section, sectionLabel:note.sectionLabel, type:note.type, summary:note.summary, sourcePath:note.sourcePath,
    updatedAt:note.updatedAt, metadata:note.metadata, links:[...note.links].sort(), backlinks:[...note.backlinks].sort()}))};
audit.noteCount = notes.length;
audit.assetCount = records.filter(record=>record.extension !== '.md' && record.extension !== '.base').length;
audit.typeCounts = counts;
audit.importedAt = importedAt;
audit.sourceUnchanged = (await Promise.all(records.map(async record=>sha(await fs.readFile(record.filename)) === record.sha256))).every(Boolean);
if (!audit.sourceUnchanged) throw new Error('Source vault changed during import; rerun to capture one consistent version.');

async function write(filename, value) {
  let current;
  try {current = await fs.readFile(filename);} catch {}
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  if (current?.equals(bytes)) return;
  if (checking) throw new Error(`Generated file is stale: ${portable(path.relative(project, filename))}`);
  await fs.mkdir(path.dirname(filename), {recursive:true});
  await fs.writeFile(filename, bytes);
}

for (const {note, body} of converted) {
  const frontmatter = {title:note.title, slug:note.slug, section:note.section, sectionLabel:note.sectionLabel, type:note.type,
    summary:note.summary, sourcePath:note.sourcePath, updatedAt:note.updatedAt, metadata:note.metadata};
  await write(path.join(output, note.slug+'.md'), `---\n${stringifyYaml(frontmatter, {lineWidth:0}).trimEnd()}\n---\n\n${body}`);
}
for (const record of records) {
  if (record.extension === '.md' || record.extension === '.base') await write(path.join(snapshot, record.relative), record.bytes);
  else await write(path.join(assetDirectory, record.relative), record.bytes);
}
await write(dataFile, JSON.stringify(index, null, 2)+'\n');
await write(auditFile, JSON.stringify(audit, null, 2)+'\n');
console.log(JSON.stringify({mode:checking?'check':'import', notes:audit.noteCount, assets:audit.assetCount, types:counts,
  sourceUnchanged:audit.sourceUnchanged, unresolvedLinks:audit.unresolvedLinks.length, ambiguousLinks:audit.ambiguousLinks.length,
  unresolvedAnchors:audit.unresolvedAnchors.length, sourceHash:audit.sourceHash}, null, 2));
