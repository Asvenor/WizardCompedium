import {mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
for(const folder of ['cmaps','standard_fonts','wasm']) {
  const target=path.join(root,'public/character-import',folder);
  await mkdir(target,{recursive:true});
  await cp(path.join(root,'node_modules/pdfjs-dist',folder),target,{recursive:true});
}
console.log('Local PDF display assets ready.');
