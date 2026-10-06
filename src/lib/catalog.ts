import {getNotes,noteHref,type VaultNote} from './vault.ts';
export type CatalogKind='spells'|'items'|'forms';
export type Column={key:string;label:string};
export const catalogColumns:Record<CatalogKind,Column[]>={
  spells:[{key:'level',label:'Level'},{key:'school',label:'School'},{key:'casting_time',label:'Casting time'},{key:'concentration',label:'Concentration'},{key:'ritual',label:'Ritual'},{key:'range',label:'Range'},{key:'save',label:'Enemy save'},{key:'source_group',label:'Source'},{key:'access',label:'Access'}],
  items:[{key:'rarity',label:'Rarity'},{key:'attunement',label:'Attunement'},{key:'access',label:'Access'},{key:'roles',label:'Roles'},{key:'source_group',label:'Source'}],
  forms:[{key:'cr',label:'CR'},{key:'creature_type',label:'Type'},{key:'size',label:'Size'},{key:'ac',label:'AC'},{key:'hp',label:'HP'},{key:'movement',label:'Movement'},{key:'routes',label:'Candidate routes'}],
};
export const candidateRoutes=[['polymorph','Polymorph'],['shapechange','Shapechange'],['true_polymorph_creature','True Polymorph · creature'],['true_polymorph_object','True Polymorph · object'],['planar_binding','Planar Binding'],['find_familiar','Find Familiar']] as const;
export function getCatalog(kind:CatalogKind){const types={spells:'spell',items:'magic-item',forms:'creature'};const sections={spells:'spells',items:'items',forms:'creatures'};return getNotes().filter(n=>n.type===types[kind]&&n.section===sections[kind]).sort((a,b)=>a.title.localeCompare(b.title));}
export const displayValue=(v:any)=>v==null||v===''?'Not recorded':Array.isArray(v)?v.length?v.join(', '):'—':typeof v==='boolean'?v?'Yes':'No':String(v);
export function catalogValue(note:VaultNote,key:string){const m=note.metadata;if(key==='movement')return ['walk','fly','swim','climb','burrow'].filter(k=>m[`${k}_ft`]>0).map(k=>`${k} ${m[`${k}_ft`]} ft${k==='fly'&&m.hover?' (hover)':''}`).join(' · ')||'Not recorded';if(key==='routes')return candidateRoutes.filter(([key])=>m[key]===true).map(([,label])=>label).join(' · ')||'No flagged route';return key==='level'&&m.level===0?'Cantrip':displayValue(m[key]);}
export function catalogFilters(note:VaultNote){const m=note.metadata;return {...m,title:note.title,section:note.section,text:`${note.title} ${note.summary} ${displayValue(m.roles)} ${m.access??''}`.toLowerCase(),focus:[m.concentration===true?'concentration':m.concentration===false?'no-concentration':'',m.ritual===true?'ritual':'',String(m.casting_time??'').startsWith('Reaction')?'reaction':'',String(m.casting_time??'').startsWith('Bonus Action')?'bonus-action':''].filter(Boolean),movement:['fly','swim','climb','burrow'].filter(k=>m[`${k}_ft`]>0)};}
export function catalogRecord(note:VaultNote){
  const kind:CatalogKind=note.type==='spell'?'spells':note.type==='magic-item'?'items':'forms';
  const fields:{[key:string]:string}=Object.fromEntries(catalogColumns[kind].map(c=>[c.label,catalogValue(note,c.key)]));
  if(kind==='spells')Object.assign(fields,{Duration:displayValue(note.metadata.duration),Components:displayValue(note.metadata.components),'Preparation priority':displayValue(note.metadata.preparation_priority)});
  Object.assign(fields,{'Rules version':displayValue(note.metadata.rules_version??note.metadata.source_version),'Source book':displayValue(note.metadata.source_book??note.metadata.source),Evidence:displayValue(note.metadata.rules_status??note.metadata.evidence)});
  return {slug:note.slug,title:note.title,type:note.type,url:noteHref(note),summary:note.summary,fields};
}
