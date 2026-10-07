import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import GithubSlugger from 'github-slugger';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slugFor = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const plain = value => value.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '').replace(/[`*_~]/g, '').trim();
const decodeHtml = value => value.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

// This is an inventory of preserved image references, not a stat-block reader.
// No CR, type, movement, senses or eligibility is inferred from a gallery name.
export function buildFormGallery(root = project) {
  const index = JSON.parse(fs.readFileSync(path.join(root, 'src/data/vault-index.json'), 'utf8'));
  const checkedCards = index.notes.filter(note => note.section === 'creatures' && note.type === 'creature');
  const entries = new Map();
  let placementCount = 0;
  for (const note of index.notes.filter(note => note.section === 'creatures')) {
    const text = fs.readFileSync(path.join(root, 'src/content/vault', `${note.slug}.md`), 'utf8');
    const body = text.replace(/^---\n[\s\S]*?\n---(?:\n|$)/, '');
    const slugger = new GithubSlugger();
    let heading = '', headingAnchor = '', fence = false;
    for (const line of body.split('\n')) {
      if (/^\s*(```|~~~)/.test(line)) { fence = !fence; continue; }
      if (fence) continue;
      const headingMatch = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
      if (headingMatch) { heading = plain(headingMatch[1]); headingAnchor = slugger.slug(heading); }
      for (const match of line.matchAll(/<img\s+[^>]+>/g)) {
        const attrs = Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decodeHtml(value)]));
        if (!attrs.src?.startsWith('/vault-assets/')) continue;
        const assetPath = decodeURIComponent(attrs.src.slice('/vault-assets/'.length));
        if (!assetPath.startsWith('100 Assets/Statblocks for Compendium/')) continue;
        const fullPath = path.resolve(root, 'public/vault-assets', assetPath);
        if (!fullPath.startsWith(path.resolve(root, 'public/vault-assets') + path.sep)) throw new Error(`Unsafe gallery asset: ${attrs.src}`);
        const bytes = fs.readFileSync(fullPath);
        const title = (attrs.alt || path.basename(assetPath, path.extname(assetPath))).trim();
        const slug = slugFor(title);
        if (!slug) throw new Error(`Missing creature title: ${attrs.src}`);
        const checkedCard = checkedCards.find(card => card.title.toLowerCase() === title.toLowerCase());
        if (!entries.has(slug)) entries.set(slug, {
          slug, title, images: [], sources: [],
          ...(checkedCard ? {checkedCardSlug: checkedCard.slug} : {}),
          metadata: {
            kind: 'gallery-reference',
            rules_status: 'Inherited gallery / review required',
            rules_version: 'Mixed; use the edition in the original stat block and source note',
            verification_status: 'metadata-not-reviewed',
            verification: 'Gallery reference; metadata not reviewed',
            verification_scope: 'Images and source locations preserved; no stat extraction or eligibility review',
            provenance: 'Original stat-block image embedded in the imported Obsidian vault',
          },
        });
        const entry = entries.get(slug);
        if (entry.title.toLowerCase() !== title.toLowerCase()) throw new Error(`Creature slug collision: ${title}`);
        const imageHash = sha(bytes);
        // Identical bytes under another path are the same image; different images
        // with the same creature name are retained as separate variants.
        if (!entry.images.some(image => image.sha256 === imageHash)) {
          const isPng = bytes.length >= 24 && bytes.subarray(1, 4).toString() === 'PNG';
          entry.images.push({url: attrs.src, alt: title, sourcePath: assetPath, sha256: imageHash,
            ...(isPng ? {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)} : {})});
        }
        const source = {slug: note.slug, title: note.title, sectionLabel: note.sectionLabel,
          sourcePath: note.sourcePath, heading, headingAnchor,
          kind: note.type === 'creature' ? 'checked-card' : 'gallery',
          rulesStatus: note.metadata.rules_status ?? 'Consult the source note',
          rulesVersion: note.metadata.rules_version ?? 'Use the edition in the source note',
          updatedAt: note.updatedAt};
        if (!entry.sources.some(item => item.slug === source.slug && item.headingAnchor === source.headingAnchor)) entry.sources.push(source);
        placementCount++;
      }
    }
  }
  const forms = [...entries.values()].sort((a, b) => a.title.localeCompare(b.title, 'en'));
  for (const entry of forms) entry.sources.sort((a, b) => (a.kind === 'gallery' ? 0 : 1) - (b.kind === 'gallery' ? 0 : 1) || a.title.localeCompare(b.title, 'en') || a.heading.localeCompare(b.heading, 'en'));
  return {schemaVersion: 1, sourceHash: index.sourceHash, importedAt: index.importedAt,
    entryCount: forms.length, checkedCardCount: forms.filter(entry => entry.checkedCardSlug).length,
    galleryOnlyCount: forms.filter(entry => !entry.checkedCardSlug).length,
    imageCount: forms.reduce((sum, entry) => sum + entry.images.length, 0), placementCount, entries: forms};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = buildFormGallery();
  const output = path.join(project, 'src/data/form-gallery.json');
  const json = JSON.stringify(result, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(output, 'utf8') !== json) throw new Error('Form gallery is stale; rebuild the source-derived inventory.');
  } else {
    fs.writeFileSync(output, json);
  }
  console.log(`${result.entryCount} gallery entries: ${result.checkedCardCount} checked cards + ${result.galleryOnlyCount} image references; ${result.imageCount} images from ${result.placementCount} placements.`);
}
