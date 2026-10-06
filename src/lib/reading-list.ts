const key='wizard-compendium-reading-list-v2';
export function savedReferences():string[]{try{const v=JSON.parse(localStorage.getItem(key)??'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,1000):[];}catch{return [];}}
export function toggleReference(slug:string):boolean|null {try{const all=savedReferences();const exists=all.includes(slug);localStorage.setItem(key,JSON.stringify(exists?all.filter(s=>s!==slug):[...all,slug]));return !exists;}catch{return null;}}
