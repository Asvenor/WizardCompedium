import type {APIRoute} from 'astro';
import {getCollection,render} from 'astro:content';
import {getNotes,noteHref} from '@/lib/vault';
import {searchAliases,searchableNotes,markdownSearchText,headingSearchRecords,type SearchRecord} from '@/lib/search';
import {getFinderCatalog} from '@/lib/catalog';
import {questionAnswers} from '@/lib/questions';

export const GET:APIRoute=async()=>{
  const entries=await getCollection('vault');
  const entryBySlug=new Map(entries.map(entry=>[entry.id,entry]));
  const aliasesByUrl=new Map<string,string[]>();
  for(const answer of questionAnswers)aliasesByUrl.set(answer.url,[...(aliasesByUrl.get(answer.url)??[]),...answer.questions]);
  const records:SearchRecord[]=[];
  for(const note of searchableNotes(getNotes())){
    const entry=entryBySlug.get(note.slug),body=entry?.body??'';
    const record:SearchRecord={slug:note.slug,title:note.title,section:note.section,sectionLabel:note.sectionLabel,
      kind:'note',url:noteHref(note),summary:note.summary,aliases:searchAliases(note),text:markdownSearchText(body)};
    records.push(record);
    const isCard=['spell','magic-item','creature'].includes(note.type);
    if(!entry||isCard&&!questionAnswers.some(answer=>answer.url.startsWith(`${record.url}#`)))continue;
    const {headings}=await render(entry);
    const indexedHeadings=isCard?headings.filter(heading=>aliasesByUrl.has(`${record.url}#${heading.slug}`)):headings;
    records.push(...headingSearchRecords(record,body,indexedHeadings,aliasesByUrl));
  }
  for(const note of getFinderCatalog('forms').filter(note=>note.metadata.kind==='gallery-reference'))records.push({
    slug:note.slug,title:`${note.title} — Stat block`,kind:'gallery',section:note.section,sectionLabel:note.sectionLabel,
    url:noteHref(note),summary:note.summary,aliases:[note.title],
    text:[note.metadata.gallery_sources,note.metadata.gallery_categories,note.metadata.senses,note.metadata.creature_type,note.metadata.transcription_notes].flat().filter(Boolean).join(' '),
  });
  return new Response(JSON.stringify(records),{headers:{'Content-Type':'application/json; charset=utf-8'}});
};
