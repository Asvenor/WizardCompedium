import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readNumber, saveProbability, concentrationDc, expectedSaveDamage, parseSpellComponents, componentTotals} from '../src/lib/calculators.ts';

const vault = JSON.parse(readFileSync(new URL('../src/data/vault-index.json', import.meta.url), 'utf8'));
const spells = vault.notes.filter(n => n.type === 'spell' && n.section === 'spells');
const component = name => {
  const note = spells.find(n => n.title === name);
  assert.ok(note, `Missing source spell: ${name}`);
  return parseSpellComponents(note.title, note.metadata.components);
};
const approximately = (actual, expected) => assert.ok(Math.abs(actual-expected) < 1e-12, `${actual} ≠ ${expected}`);

test('ordinary saving throw odds match all d20 faces and both two-die modes', () => {
  for (let dc=1;dc<=50;dc++) for(let bonus=-10;bonus<=15;bonus++) {
    const success=Array.from({length:20},(_,i)=>i+1+bonus>=dc).filter(Boolean).length/20;
    assert.equal(saveProbability(dc,bonus),success);
    let advantage=0,disadvantage=0;
    for(let a=1;a<=20;a++) for(let b=1;b<=20;b++) { advantage+=Number(Math.max(a,b)+bonus>=dc); disadvantage+=Number(Math.min(a,b)+bonus>=dc); }
    approximately(saveProbability(dc,bonus,'advantage'),advantage/400);
    approximately(saveProbability(dc,bonus,'disadvantage'),disadvantage/400);
  }
  assert.equal(saveProbability(100,0),0); // Natural 20 is not an automatic save success.
  assert.equal(saveProbability(1,20),1); // Natural 1 is not an automatic save failure.
  assert.throws(()=>saveProbability(10.5,0),RangeError);
  assert.throws(()=>saveProbability(10,0,'unknown'),RangeError);
});

test('2024 concentration floors odd damage and caps damage DC at 30', () => {
  for (const [damage,dc] of [[0,10],[1,10],[20,10],[21,10],[22,11],[59,29],[60,30],[61,30],[1000,30]]) assert.equal(concentrationDc(damage),dc);
  assert.throws(()=>concentrationDc(-1),RangeError);
  assert.throws(()=>concentrationDc(1.5),RangeError);
  assert.equal(saveProbability(concentrationDc(20),5),.8);
  approximately(saveProbability(concentrationDc(20),5,'advantage'),.96);
});

test('expected damage weighs the supplied final outcomes without inventing modifiers', () => {
  assert.equal(expectedSaveDamage(.55,20,10),15.5);
  assert.equal(expectedSaveDamage(.3025,20,10),13.025);
  assert.equal(expectedSaveDamage(0,20,10),10);
  assert.equal(expectedSaveDamage(1,20,10),20);
  assert.equal(expectedSaveDamage(.5,0,0),0);
  assert.throws(()=>expectedSaveDamage(1.01,20,10),RangeError);
  assert.throws(()=>expectedSaveDamage(.5,-1,10),RangeError);
});

test('every selected spell retains its exact component source line', () => {
  assert.equal(spells.length,208);
  for (const note of spells) {
    const record=parseSpellComponents(note.title,note.metadata.components);
    assert.equal(record.raw,note.metadata.components,`${note.title} source line changed`);
    for(const item of record.items) assert.ok(item.gpCost===null||Number.isFinite(item.gpCost)&&item.gpCost>=0,`${note.title} invalid price`);
  }
  assert.equal(component('Fireball').kind,'ordinary');
  assert.equal(component('Shield').kind,'none');
  assert.equal(component('Dark Star').items[0].gpCost,null);
  assert.equal(component('Dark Star').items[0].consumption,'consumed');
});

test('consumed materials multiply castings while retained components count acquired sets', () => {
  const familiar=component('Find Familiar').items[0];
  const identify=component('Identify').items[0];
  assert.equal(familiar.gpCost,10); assert.equal(familiar.consumption,'consumed');
  assert.equal(identify.gpCost,100); assert.equal(identify.consumption,'reusable');
  const result=componentTotals([{...familiar,quantity:3},{...identify,quantity:1}]);
  assert.deepEqual(result,{consumed:30,reusable:100,special:0,shopping:130,incomplete:0});
  assert.equal(component('Forcecage').items[0].consumption,'consumed');
  assert.equal(component('Battle Familiar').items[0].consumption,'reusable');
});

test('mixed source components keep Clone, Legend Lore and per-target Astral Projection distinct', () => {
  assert.deepEqual(component('Clone').items.map(i=>[i.gpCost,i.consumption]),[[1000,'consumed'],[2000,'reusable']]);
  const legend=component('Legend Lore').items;
  assert.deepEqual(legend.map(i=>[i.gpCost,i.consumption]),[[250,'consumed'],[200,'reusable']]);
  assert.equal(componentTotals([{...legend[0],quantity:3},{...legend[1],quantity:1}]).shopping,950);
  const astral=component('Astral Projection').items[0];
  assert.equal(astral.gpCost,1100); assert.equal(astral.perTarget,true);
  assert.equal(componentTotals([{...astral,quantity:2*4}]).consumed,8800);
});

test('end-of-effect and activation costs are not falsely counted as indefinitely reusable', () => {
  const jar=component('Magic Jar').items[0], summons=component("Drawmij's Instant Summons").items[0];
  assert.equal(jar.consumption,'special'); assert.equal(jar.quantityKind,'sets');
  assert.equal(summons.consumption,'special'); assert.equal(summons.quantityKind,'casts');
  assert.deepEqual(componentTotals([{...jar,quantity:1},{...summons,quantity:3}]),{consumed:0,reusable:0,special:3500,shopping:3500,incomplete:0});
});

test('coin values and uncertainty remain explicit; unknown prices never become free', () => {
  assert.equal(component('Gentle Repose').items[0].gpCost,.02);
  assert.equal(component('Detect Thoughts').items[0].gpCost,.01);
  assert.equal(component('True Strike').items[0].gpCost,.01);
  assert.equal(parseSpellComponents('Unknown',null).kind,'unknown');
  assert.equal(parseSpellComponents('Unrecognized mixed spell','V, M (a 100 GP gem and 20 GP dust)').items[0].gpCost,null);
  const known=component('Find Familiar').items[0], unknown=component('Dark Star').items[0];
  assert.deepEqual(componentTotals([{...known,quantity:2},{...unknown,quantity:3}]),{consumed:20,reusable:0,special:0,shopping:20,incomplete:1});
  assert.equal(componentTotals([{gpCost:10,consumption:'unknown',quantity:1}]).incomplete,1);
  assert.equal(componentTotals([{gpCost:10,consumption:'reusable',quantity:0}]).shopping,0);
});

test('input validation rejects blanks, invalid ranges, fractions where integers are required', () => {
  assert.equal(readNumber('',0,100),null);
  assert.equal(readNumber(' ',0,100),null);
  assert.equal(readNumber('NaN',0,100),null);
  assert.equal(readNumber('Infinity',0,100),null);
  assert.equal(readNumber('-1',0,100),null);
  assert.equal(readNumber('101',0,100),null);
  assert.equal(readNumber('1.5',0,100),null);
  assert.equal(readNumber('1.5',0,100,false),1.5);
  assert.equal(readNumber('0',0,100),0);
});
