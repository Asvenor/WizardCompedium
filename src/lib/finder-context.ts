export const finderPaths = ['/spells/', '/items/', '/forms/'] as const;
const fields = new Set(['q','level','school','focus','source','role','save','longrange','rarity','attunement','route','maxcr','movement','senses','review','gallery','sort','compare','view']);
const storageKey = (path:string) => `wizard-compendium-finder-context-v1:${path}`;
type StorageLike = Pick<Storage,'getItem'|'setItem'>;
const session = ():StorageLike|undefined => {try{return globalThis.sessionStorage;}catch{return undefined;}};

/** Never returns an external URL, arbitrary route, credentials or unknown params. */
export function sanitizeFinderContext(value:string, origin:string):string|null {
  if(typeof value!=='string'||value.length>12000)return null;
  try{
    const url=new URL(value,origin);
    if(url.origin!==new URL(origin).origin||url.username||url.password||!finderPaths.includes(url.pathname as typeof finderPaths[number]))return null;
    const params=new URLSearchParams();
    for(const [key,value] of url.searchParams){
      if(!fields.has(key)||params.has(key)||!value)continue;
      if(key==='compare'){
        const selected=[...new Set(value.split(',').filter(slug=>/^[a-z0-9][a-z0-9/-]{0,179}$/.test(slug)))].slice(0,4);
        if(selected.length)params.set(key,selected.join(','));
      }else if(key==='view'){
        if(value==='rows')params.set(key,value);
      }else params.set(key,value.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,key==='q'?300:180));
    }
    return url.pathname+(params.size?`?${params}`:'');
  }catch{return null;}
}

export function rememberFinderContext(value:string,origin:string,storage:StorageLike|undefined=session()):string|null {
  const safe=sanitizeFinderContext(value,origin);
  if(!safe)return null;
  try{storage?.setItem(storageKey(new URL(safe,origin).pathname),safe);}catch{/* Links still carry their return context when storage is blocked. */}
  return safe;
}

export function finderReturnHref(path:string,origin:string,{returnTo='',referrer='',storage=session()}:{returnTo?:string;referrer?:string;storage?:StorageLike}={}):string {
  if(!finderPaths.includes(path as typeof finderPaths[number]))return '/library/';
  const forPath=(value:string)=>{const safe=sanitizeFinderContext(value,origin);return safe&&new URL(safe,origin).pathname===path?safe:null;};
  for(const value of [returnTo,referrer]){const safe=forPath(value);if(safe)return safe;}
  try{const safe=forPath(storage?.getItem(storageKey(path))??'');if(safe)return safe;}catch{/* Default finder remains usable. */}
  return path;
}

export function enhanceFinderReturnLinks():void {
  const returnTo=new URLSearchParams(location.search).get('returnTo')??'';
  for(const link of document.querySelectorAll<HTMLAnchorElement>('[data-finder-return]')){
    link.href=finderReturnHref(link.dataset.finderReturn??'',location.origin,{returnTo,referrer:document.referrer});
  }
}
