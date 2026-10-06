import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parse as parseYaml} from 'yaml';
import {createSatteriMarkdownProcessor} from '@astrojs/markdown-satteri';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(await fs.readFile(path.join(project,'src/data/vault-index.json'),'utf8'));
const audit = JSON.parse(await fs.readFile(path.join(project,'src/data/vault-audit.json'),'utf8'));
const failures = [];
const processor = await createSatteriMarkdownProcessor({syntaxHighlight:false});
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const documents = new Map();
const split = text => {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g,'\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  return {metadata:match ? parseYaml(match[1]) ?? {} : {}, body:match ? normalized.slice(match[0].length) : normalized};
};
function readable(text) {
  return text.replace(/<!--([\s\S]*?)-->/g,'').replace(/```dataview\s*\n[\s\S]*?\n```/g,'')
    .replace(/!\[\[[^\]]+\]\]/g,'')
    .replace(/\[\[([^\]]+)\]\]/g,(_,inner)=> {
      const [target,...alias]=inner.replace(/\\\|/g,'|').split('|');
      return alias.length ? alias.join('|') : target.includes('#') ? target.split('#').slice(1).join('#') : path.basename(target).replace(/\.md$/i,'');
    }).replace(/!?\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/^>\s*\[![\w-]+\][+-]?\s*/gm,'')
    .replace(/\^[A-Za-z0-9-]+\s*$/gm,'').replace(/<[^>]*>/g,'').replace(/&(?:amp|#38);/g,'&')
    .replace(/&#124;/g,'|').replace(/&quot;/g,'"').replace(/&(?:lt|gt);/g,' ')
    .normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
}
const tokens = text => readable(text).match(/[\p{L}\p{N}]+/gu) ?? [];
const countTokens = values => {const counts = new Map(); for(const value of values) counts.set(value,(counts.get(value)??0)+1); return counts;};

if (index.noteCount !== index.notes.length || index.notes.length !== audit.noteCount) failures.push('Note count mismatch');
if (index.sections.reduce((sum,section)=>sum+section.count,0) !== index.noteCount) failures.push('Section count mismatch');
if (index.sourceHash !== audit.sourceHash) failures.push('Source version mismatch');
if (new Set(index.notes.map(note=>note.slug)).size !== index.noteCount) failures.push('Duplicate note slugs');
if (audit.unresolvedLinks.length || audit.unresolvedAnchors.length || audit.ambiguousLinks.length) failures.push('Source references require a recorded resolution');

for (const file of audit.files) {
  const root = /\.(md|base)$/i.test(file.path) ? 'vault-source' : 'public/vault-assets';
  try {
    const bytes = await fs.readFile(path.join(project,root,file.path));
    if (sha(bytes) !== file.sha256) failures.push(`Changed source snapshot or asset: ${file.path}`);
  } catch {failures.push(`Missing source snapshot or asset: ${file.path}`);}
}

let sourceTokens = 0, retainedTokens = 0;
for (const note of index.notes) {
  const filename = path.join(project,'src/content/vault',note.slug+'.md');
  const generated = split(await fs.readFile(filename,'utf8'));
  const source = split(await fs.readFile(path.join(project,'vault-source',note.sourcePath),'utf8'));
  if (generated.metadata.slug !== note.slug || generated.metadata.sourcePath !== note.sourcePath) failures.push(`Content identity mismatch: ${note.sourcePath}`);
  for (const [field,value] of Object.entries(source.metadata)) {
    if (JSON.stringify(generated.metadata.metadata[field]) !== JSON.stringify(value)) failures.push(`Metadata field changed: ${note.sourcePath} / ${field}`);
  }
  if (generated.body.includes('[[') || /```(?:dataview|dataviewjs|base)\b/.test(generated.body)) failures.push(`Unconverted Obsidian syntax: ${note.sourcePath}`);
  const rendered = await processor.render(generated.body);
  const ids = [...rendered.code.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  if (new Set(ids).size !== ids.length) failures.push(`Duplicate page anchors: ${note.sourcePath}`);
  documents.set(note.slug,{note,html:rendered.code,ids:new Set(ids)});
  // Compare every source word within its own note. Only the source's first H1,
  // plugin queries, image-link names, and structural callout markers are exempt.
  const expectedBody = source.body.replace(/^#\s+[^\n]+$/m,'');
  const expected = countTokens(tokens(expectedBody));
  const actual = countTokens(tokens(generated.body));
  const missing = [];
  for (const [token,count] of expected) {
    sourceTokens += count;
    retainedTokens += Math.min(count,actual.get(token)??0);
    if (count > (actual.get(token)??0)) missing.push({word:token,count:count-(actual.get(token)??0)});
  }
  if (missing.length) failures.push({source:note.sourcePath,kind:'source-word-coverage',missing});
}

let references = 0, assets = 0, anchors = 0;
for (const {note,html} of documents.values()) {
  for (const match of html.matchAll(/\b(href|src|data)="([^"]+)"/g)) {
    const [,attribute,raw] = match;
    if (!raw.startsWith('/') && !raw.startsWith('#')) continue;
    const url = new URL(raw,'https://wizard.local');
    if (url.pathname.startsWith('/library/') && url.pathname !== '/library/') {
      references++;
      const targetSlug = decodeURIComponent(url.pathname.replace(/^\/library\//,'').replace(/\/$/,''));
      const target = documents.get(targetSlug);
      if (!target) failures.push(`Missing note destination: ${note.sourcePath} -> ${raw}`);
      else if (url.hash) {
        anchors++;
        if (!target.ids.has(decodeURIComponent(url.hash.slice(1)))) failures.push(`Missing rendered anchor: ${note.sourcePath} -> ${raw}`);
      }
    } else if (url.pathname.startsWith('/vault-assets/')) {
      assets++;
      try {await fs.access(path.join(project,'public',decodeURIComponent(url.pathname)));}
      catch {failures.push(`Missing rendered asset: ${note.sourcePath} -> ${raw}`);}
    } else if (url.hash && attribute === 'href' && url.pathname === '/') {
      anchors++;
      if (!documents.get(note.slug).ids.has(decodeURIComponent(url.hash.slice(1)))) failures.push(`Missing local rendered anchor: ${note.sourcePath} -> ${raw}`);
    }
  }
}

const result = {notes:index.noteCount,sourceFiles:audit.files.length,sourceHash:audit.sourceHash,
  references,assetReferences:assets,anchorReferences:anchors,sourceTokens,retainedTokens,
  wordCoverage:sourceTokens ? retainedTokens/sourceTokens : 1,failures};
console.log(JSON.stringify(result,null,2));
if (failures.length) process.exitCode = 1;
