import type {ComponentItem,Consumption} from './calculators.ts';

export const COMPONENT_PLAN_KEY='wizard-compendium-component-plan-v1';
export const MAX_COMPONENT_PLAN_BYTES=1024*1024;
export type PlanSpell={slug:string;title:string;raw:string;items:ComponentItem[]};
export type PlanRow={price:number|null;sets:number|null;consumption:Consumption};
export type PlanEntry={slug:string;source:string;casts:number;targets:number|null;rows:PlanRow[]};
export type ComponentPlan={format:'wizard-compendium-component-plan';version:1;entries:PlanEntry[]};
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
const local=():StorageLike|undefined=>{try{return globalThis.localStorage;}catch{return undefined;}};
const fail=(message:string):never=>{throw new Error(message);};
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const integer=(value:unknown,min:number,max:number)=>typeof value==='number'&&Number.isInteger(value)&&value>=min&&value<=max;

/** Rebuild every row against trusted current spell data; imported rules are ignored. */
export function validateComponentPlan(input:unknown,spells:PlanSpell[]):ComponentPlan {
  if(!record(input)||input.format!=='wizard-compendium-component-plan'||input.version!==1||!Array.isArray(input.entries))return fail('Choose a version-1 Wizard Compendium component-plan JSON file.');
  if(input.entries.length>spells.length)return fail('The plan has too many spell entries.');
  const seen=new Set<string>();
  const entries=input.entries.map((value:unknown):PlanEntry=>{
    if(!record(value)||typeof value.slug!=='string')return fail('A plan entry is missing its spell reference.');
    const spell=spells.find(spell=>spell.slug===value.slug);
    if(!spell)return fail('A spell in this plan is not in the current compendium. Nothing was replaced.');
    if(seen.has(spell.slug))return fail(`The plan contains ${spell.title} more than once.`);
    seen.add(spell.slug);
    if(value.source!==spell.raw)return fail(`${spell.title}'s component wording changed. Rebuild its plan from the current reference before importing.`);
    if(!integer(value.casts,1,999))return fail(`${spell.title}: use 1–999 whole planned castings.`);
    const perTarget=spell.items.some(item=>item.perTarget);
    if(perTarget?!integer(value.targets,1,9):value.targets!==null)return fail(`${spell.title}: targets must match the spell's recorded component rules.`);
    if(!Array.isArray(value.rows)||value.rows.length!==spell.items.length)return fail(`${spell.title}: material rows do not match the current source.`);
    const rows=value.rows.map((row:unknown,index:number):PlanRow=>{
      const item=spell.items[index];
      if(!record(row))return fail(`${spell.title}: invalid material row.`);
      if(row.price!==null&&(typeof row.price!=='number'||!Number.isFinite(row.price)||row.price<(item.gpCost??0)||row.price>10000000))return fail(`${spell.title}: enter a valid price at or above the source minimum, or leave it unknown.`);
      const usesSets=item.quantityKind==='sets'||item.consumption==='unknown';
      if(usesSets?!integer(row.sets,0,999):row.sets!==null)return fail(`${spell.title}: use 0–999 whole sets where required.`);
      const allowed:Consumption[]=item.consumption==='unknown'?['unknown','consumed','reusable']:[item.consumption];
      if(!allowed.includes(row.consumption as Consumption))return fail(`${spell.title}: cost handling does not match the source.`);
      return {price:row.price as number|null,sets:row.sets as number|null,consumption:row.consumption as Consumption};
    });
    return {slug:spell.slug,source:spell.raw,casts:value.casts as number,targets:value.targets as number|null,rows};
  });
  return {format:'wizard-compendium-component-plan',version:1,entries};
}

export function parseComponentPlan(text:string,spells:PlanSpell[]):ComponentPlan {
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_COMPONENT_PLAN_BYTES)fail('Component plans must be JSON files up to 1 MB.');
  let value:unknown;
  try{value=JSON.parse(text);}catch{return fail('This file is not valid JSON. The current plan is unchanged.');}
  return validateComponentPlan(value,spells);
}
export function saveComponentPlan(plan:ComponentPlan,spells:PlanSpell[],storage:StorageLike|undefined=local()):void {
  const clean=validateComponentPlan(plan,spells);
  try{if(!storage)throw new Error();storage.setItem(COMPONENT_PLAN_KEY,JSON.stringify(clean));}
  catch{fail('This browser could not save the plan. Export its JSON to keep a copy; the current list is still open.');}
}
export function loadComponentPlan(spells:PlanSpell[],storage:StorageLike|undefined=local()):ComponentPlan|null {
  let text:string|null;
  try{if(!storage)throw new Error();text=storage.getItem(COMPONENT_PLAN_KEY);}
  catch{return fail('Saved plans are unavailable in this browser. You can still import or export a JSON copy.');}
  return text===null?null:parseComponentPlan(text,spells);
}
