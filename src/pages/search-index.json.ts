import type {APIRoute} from 'astro';
import {getCollection} from 'astro:content';
import {getNotes,noteHref} from '@/lib/vault';
import {searchAliases,searchableNotes} from '@/lib/search';
import {getFinderCatalog} from '@/lib/catalog';

export const GET:APIRoute=async()=>{
  const entries=await getCollection('vault');
  const bodies=new Map(entries.map(entry=>[entry.id,entry.body??'']));
  const records=searchableNotes(getNotes()).map(note=>({
    slug:note.slug,title:note.title,section:note.section,sectionLabel:note.sectionLabel,
    url:noteHref(note),summary:note.summary,aliases:searchAliases(note),
    text:(bodies.get(note.slug)??'').replace(/<[^>]*>/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')
      .replace(/[#*`|>]/g,' ').replace(/\s+/g,' ').trim(),
  }));
  for(const note of getFinderCatalog('forms').filter(note=>note.metadata.kind==='gallery-reference'))records.push({
    slug:note.slug,title:`${note.title} — Stat block`,section:note.section,sectionLabel:note.sectionLabel,
    url:noteHref(note),summary:note.summary,aliases:[note.title],
    text:[note.metadata.gallery_sources,note.metadata.gallery_categories,note.metadata.senses,note.metadata.creature_type,note.metadata.transcription_notes].flat().filter(Boolean).join(' '),
  });
  return new Response(JSON.stringify(records),{headers:{'Content-Type':'application/json; charset=utf-8'}});
};
