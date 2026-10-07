import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const args=process.argv.slice(2);
for(const [script,flags] of [['import-vault.mjs',args],['build-form-gallery.mjs',args.includes('--check')?['--check']:[]]]){
  const result=spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),...flags],{stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
