import data from '../data/vault-index.json' with {type:'json'};

export type VaultSection = {id:string; label:string; description:string; count:number; order:number};
export type VaultNote = {
  id:string; slug:string; title:string; section:string; sectionLabel:string;
  type:string; summary:string; sourcePath:string; updatedAt:string;
  metadata:Record<string,any>; links:string[]; backlinks:string[];
  aliases?:string[]; url?:string;
};
// Website labels can clarify navigation without changing the preserved vault text.
const displayTitles:Record<string,string>={
  'home/quick-finder':'Quick Finder',
  'tactics/spell-tactics':'Spell Tactics',
  'tiers/polymorph-friendly-hostile-tier-list':'Friendly & Hostile Polymorph Forms Tier List',
};
export const vaultNotes = (data.notes as VaultNote[]).map(note=>displayTitles[note.slug]
  ? {...note,title:displayTitles[note.slug],aliases:[note.title,...(note.aliases??[])]}
  : note);
export const vaultSections = data.sections as VaultSection[];
export const vaultInfo = {noteCount:data.noteCount, importedAt:data.importedAt};
export const noteHref = (note:VaultNote) => note.url??`/library/${note.slug}/`;
export const getNotes = () => vaultNotes;
export const getSections = () => vaultSections;
export const getNote = (slug:string) => vaultNotes.find(n=>n.slug===slug);
export const findNote = (name:string) => {
  const matches=vaultNotes.filter(n=>n.title.toLowerCase()===name.toLowerCase() || n.aliases?.some(alias=>alias.toLowerCase()===name.toLowerCase()) || n.sourcePath.split('/').pop()?.replace(/\.md$/,'').toLowerCase()===name.toLowerCase());
  return matches.find(n=>['spell','magic-item','creature'].includes(n.type)&&!['inbox','home'].includes(n.section))??matches[0];
};
export const hrefFor = (name:string) => { const n=findNote(name); return n ? noteHref(n) : '/library/'; };
export const sectionsForNavigation = () => vaultSections.filter(s=>!['home','inbox','assets'].includes(s.id));
export const plainTitle = (text:string) => text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_m,target,label)=>label??target).replace(/[*`]/g,'');
