import { access, readdir, readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve('dist');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function destinationFor(url) {
  const path = decodeURIComponent(url.split('#')[0].split('?')[0]);
  if (path === '/') return join(root, 'index.html');
  if (path.endsWith('/')) return join(root, path.slice(1), 'index.html');
  const target = join(root, path.slice(1));
  return extname(path) ? target : `${target}.html`;
}

await access(join(root, 'index.html'));
await access(join(root, 'pagefind', 'pagefind-ui.js'));

const htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
const missing = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const references = html.matchAll(/(?:href|src)=["'](\/[^"']+)["']/g);
  for (const [, reference] of references) {
    if (reference.startsWith('//') || reference.startsWith('/#')) continue;
    checked += 1;
    try {
      await access(destinationFor(reference));
    } catch {
      missing.push(`${file.slice(root.length + 1)} -> ${reference}`);
    }
  }
}

if (missing.length) {
  console.error(`Build validation failed: ${missing.length} missing internal targets.`);
  console.error(missing.slice(0, 30).join('\n'));
  process.exit(1);
}

console.log(`Build validation passed: ${htmlFiles.length} HTML pages and ${checked} internal links/assets checked.`);
