import {getNotes,noteHref,type VaultNote} from './vault.ts';
import {normalizeSearch} from './search.ts';
import {getFormGallery,galleryHref,type FormGalleryImage} from './form-gallery.ts';
import {getGalleryStats} from './form-stats.ts';
export type CatalogKind='spells'|'items'|'forms';
export type Column={key:string;label:string};
export const catalogColumns:Record<CatalogKind,Column[]>={
  spells:[{key:'level',label:'Level'},{key:'school',label:'School'},{key:'casting_time',label:'Casting time'},{key:'concentration',label:'Concentration'},{key:'ritual',label:'Ritual'},{key:'range',label:'Range'},{key:'save',label:'Enemy save'},{key:'source_group',label:'Source'},{key:'access',label:'Access'}],
  items:[{key:'rarity',label:'Rarity'},{key:'attunement',label:'Attunement'},{key:'access',label:'Access'},{key:'roles',label:'Roles'},{key:'source_group',label:'Source'}],
  forms:[{key:'cr',label:'CR'},{key:'creature_type',label:'Type'},{key:'size',label:'Size'},{key:'ac',label:'AC'},{key:'hp',label:'HP'},{key:'movement',label:'Movement'},{key:'senses',label:'Senses'},{key:'routes',label:'Candidate routes'},{key:'review',label:'Review status'}],
};
export const candidateRoutes=[['polymorph','Polymorph'],['shapechange','Shapechange'],['true_polymorph_creature','True Polymorph · creature'],['true_polymorph_object','True Polymorph · object'],['planar_binding','Planar Binding'],['find_familiar','Find Familiar']] as const;
export function getCatalog(kind:CatalogKind){const types={spells:'spell',items:'magic-item',forms:'creature'};const sections={spells:'spells',items:'items',forms:'creatures'};return getNotes().filter(n=>n.type===types[kind]&&n.section===sections[kind]).sort((a,b)=>a.title.localeCompare(b.title));}
// The original twenty checked cards stay intact. Gallery-only references are a
// separate derived layer, never manufactured vault notes or eligibility flags.
export function getFinderCatalog(kind:CatalogKind):VaultNote[]{
  if(kind!=='forms')return getCatalog(kind);
  const gallery=getFormGallery();
  const addContext=(entry:typeof gallery[number])=>({
    images:entry.images,
    gallery_sources:[...new Set(entry.sources.filter(source=>source.kind==='gallery').map(source=>source.title))],
    gallery_categories:[...new Set(entry.sources.filter(source=>source.kind==='gallery').map(source=>source.heading))],
  });
  const checked=getCatalog('forms').map(note=>{
    const entry=gallery.find(e=>e.checkedCardSlug===note.slug);
    return entry?{...note,metadata:{...note.metadata,...addContext(entry)}}:note;
  });
  const references=gallery.filter(entry=>!entry.checkedCardSlug).map(entry=>({
    id:`gallery/${entry.slug}`,slug:`gallery/${entry.slug}`,title:entry.title,
    section:'creatures',sectionLabel:'Creatures & forms',type:'creature',
    summary:`Original stat-block reference in ${[...new Set(entry.sources.map(source=>source.title))].join(', ')}. Spell eligibility needs review.`,
    sourcePath:entry.images[0].sourcePath,updatedAt:entry.sources[0].updatedAt,
    metadata:{...entry.metadata,...getGalleryStats(entry),...addContext(entry)},links:entry.sources.map(source=>source.slug),backlinks:[],url:galleryHref(entry),
  }));
  return [...checked,...references].sort((a,b)=>a.title.localeCompare(b.title));
}
export const reviewLabel=(status:unknown)=>status==='metadata-checked'?'Metadata checked':status==='image-transcribed'?'Image-transcribed stats':'Gallery reference · review needed';
export const catalogNotes=(note:VaultNote):string[] => (note.metadata.transcription_notes??[]).map((text:string)=>text
  .replace(/^Basic statistics manually checked against the embedded image, not independently DDB-verified\.\s*/,'')
  .replace(/\s*Unlisted movement modes(?: and hover)? remain null; no eligibility inference\.?$/,'').trim()).filter(Boolean);
export const displayValue=(v:any)=>v==null||v===''?'Not recorded':Array.isArray(v)?v.length?v.join(', '):'—':typeof v==='boolean'?v?'Yes':'No':String(v);
export function catalogValue(note:VaultNote,key:string){const m=note.metadata;if(key==='review')return reviewLabel(m.verification_status);if(key==='movement')return ['walk','fly','swim','climb','burrow'].filter(k=>m[`${k}_ft`]>0).map(k=>`${k} ${m[`${k}_ft`]} ft${k==='fly'&&m.hover?' (hover)':''}`).join(' · ')||'Not recorded';if(key==='routes')return m.kind==='gallery-reference'?'Not reviewed — check spell requirements':candidateRoutes.filter(([key])=>m[key]===true).map(([,label])=>label).join(' · ')||'No flagged route';return key==='level'&&m.level===0?'Cantrip':displayValue(m[key]);}
export function catalogFilters(note:VaultNote){const m=note.metadata;return {...m,title:note.title,section:note.section,review:m.verification_status,text:normalizeSearch(`${note.title} ${(note.aliases??[]).join(' ')} ${note.summary} ${displayValue(m.roles)} ${m.access??''} ${displayValue(m.senses)} ${displayValue(m.gallery_sources)} ${displayValue(m.gallery_categories)} ${catalogNotes(note).join(' ')}`),senses:['darkvision','blindsight','truesight','tremorsense'].filter(s=>normalizeSearch(displayValue(m.senses)).includes(s)),focus:[m.concentration===true?'concentration':m.concentration===false?'no-concentration':'',m.ritual===true?'ritual':'',String(m.casting_time??'').startsWith('Reaction')?'reaction':'',String(m.casting_time??'').startsWith('Bonus Action')?'bonus-action':''].filter(Boolean),movement:['fly','swim','climb','burrow'].filter(k=>m[`${k}_ft`]>0)};}
export function catalogRecord(note:VaultNote){
  const kind:CatalogKind=note.type==='spell'?'spells':note.type==='magic-item'?'items':'forms';
  const fields:{[key:string]:string}=Object.fromEntries(catalogColumns[kind].map(c=>[c.label,catalogValue(note,c.key)]));
  if(kind==='spells')Object.assign(fields,{Duration:displayValue(note.metadata.duration),Components:displayValue(note.metadata.components),'Preparation priority':displayValue(note.metadata.preparation_priority)});
  if(kind==='forms'&&note.metadata.gallery_sources)fields['Source galleries']=displayValue(note.metadata.gallery_sources);
  if(kind==='forms'&&catalogNotes(note).length)fields['Stat-block conditions']=displayValue(catalogNotes(note));
  if(kind==='forms'&&note.metadata.verification_scope)fields['Review scope']=displayValue(note.metadata.verification_scope);
  Object.assign(fields,{'Rules version':displayValue(note.metadata.rules_version??note.metadata.source_version),'Source book':displayValue(note.metadata.source_book??note.metadata.source),Evidence:displayValue(note.metadata.rules_status??note.metadata.evidence)});
  return {slug:note.slug,title:note.title,type:note.type,url:noteHref(note),summary:note.summary,fields,...(kind==='forms'?{images:note.metadata.images as FormGalleryImage[]|undefined}:{})};
}
