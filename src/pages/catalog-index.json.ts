import type {APIRoute} from 'astro';
import {getFinderCatalog,catalogRecord} from '@/lib/catalog';
export const GET:APIRoute=()=>new Response(JSON.stringify(['spells','items','forms'].flatMap(kind=>getFinderCatalog(kind as 'spells'|'items'|'forms').map(catalogRecord))),{headers:{'Content-Type':'application/json; charset=utf-8'}});
