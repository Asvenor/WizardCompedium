import type {APIRoute} from 'astro';
import {getCollection} from 'astro:content';
import {getNotes,noteHref} from '@/lib/vault';
export const GET:APIRoute=async()=>{const entries=await getCollection('vault');const bodies=new Map(entries.map(e=>[e.id,e.body??'']));return new Response(JSON.stringify(getNotes().filter(n=>n.section!=='inbox').map(n=>({slug:n.slug,title:n.title,section:n.section,sectionLabel:n.sectionLabel,url:noteHref(n),summary:n.summary,text:(bodies.get(n.slug)??'').replace(/<[^>]*>/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*`|>]/g,' ').replace(/\s+/g,' ').trim()}))),{headers:{'Content-Type':'application/json; charset=utf-8'}});};
