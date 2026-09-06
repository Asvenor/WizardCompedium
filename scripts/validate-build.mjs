import { access, readdir, readFile } from 'node:fs/promises';
import { join, resolve, relative, extname } from 'node:path';
const root = resolve('dist');
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}
await access(join(root, 'index.html'));
await access(join(root, 'pagefind', 'pagefind-ui.js'));
const files = (await walk(root)).filter((file) => file.endsWith('.html'));
const documents = new Map(
  await Promise.all(
    files.map(async (file) => [file, await readFile(file, 'utf8')]),
  ),
);
const ids = new Map(
  [...documents].map(([file, html]) => [
    file,
    new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1])),
  ]),
);
const missing = [];
let checked = 0,
  anchors = 0;
for (const [file, html] of documents) {
  const pathname = '/' + relative(root, file).replace(/index\.html$/, '');
  const references = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  if (file === join(root, 'index.html')) {
    const search = JSON.parse(
      await readFile(join(root, 'search-index.json'), 'utf8'),
    );
    for (const kind of [
      'Spell',
      'Chapter',
      'Build',
      'Tool',
      'German Conversion',
    ])
      if (!search.some((entry) => entry.kind === kind))
        missing.push('Search index missing category: ' + kind);
    references.push(...search.map((entry) => entry.url));
  }
  for (const reference of references) {
    if (!reference || /^(?:[a-z]+:|\/\/)/i.test(reference)) continue;
    let url;
    try {
      url = new URL(
        reference.replace(/&amp;/g, '&'),
        'https://local.test' + pathname,
      );
    } catch {
      missing.push(file + ' -> invalid URL ' + reference);
      continue;
    }
    if (url.origin !== 'https://local.test') continue;
    let path;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      missing.push(reference + ' -> invalid encoding');
      continue;
    }
    let target = join(root, path.slice(1));
    if (path.endsWith('/')) target = join(target, 'index.html');
    else if (!extname(path)) target = join(target, 'index.html');
    checked++;
    try {
      await access(target);
    } catch {
      missing.push(
        relative(root, file) + ' -> missing page/asset ' + reference,
      );
      continue;
    }
    if (url.hash && ids.has(target)) {
      anchors++;
      let anchor;
      try {
        anchor = decodeURIComponent(url.hash.slice(1));
      } catch {
        anchor = '';
      }
      if (anchor && !ids.get(target).has(anchor))
        missing.push(relative(root, file) + ' -> missing anchor ' + reference);
    }
  }
}
if (missing.length) {
  console.error(
    'Build validation failed: ' + missing.length + ' missing internal targets.',
  );
  console.error(missing.slice(0, 80).join('\n'));
  process.exit(1);
}
console.log(
  `Build validation passed: ${files.length} HTML pages, ${checked} links/assets, ${anchors} anchors checked.`,
);
