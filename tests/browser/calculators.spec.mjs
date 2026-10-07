import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const addSpell = async (page,name) => {
  await page.getByRole('combobox',{name:'Spell',exact:true}).selectOption({label:name});
  await page.getByRole('button',{name:'Add spell',exact:true}).click();
};
const card = (page,name) => page.locator('[data-component-entry]').filter({has:page.getByRole('heading',{name,exact:true})});

test('ordinary saving throws handle both roll modes and guaranteed/impossible totals', async ({page}) => {
  await page.goto('/tools/');
  await expect(page.locator('[data-save-result]')).toHaveText('Target fails 55% · succeeds 45%');
  await page.getByRole('combobox',{name:'Target’s roll'}).selectOption('advantage');
  await expect(page.locator('[data-save-result]')).toHaveText('Target fails 30.25% · succeeds 69.75%');
  await page.getByRole('combobox',{name:'Target’s roll'}).selectOption('disadvantage');
  await expect(page.locator('[data-save-result]')).toHaveText('Target fails 79.75% · succeeds 20.25%');
  await page.getByRole('spinbutton',{name:'Save DC',exact:true}).fill('100');
  await expect(page.locator('[data-save-result]')).toHaveText('Target fails 100% · succeeds 0%');
  await page.getByRole('spinbutton',{name:'Save DC',exact:true}).fill('');
  await expect(page.locator('[data-save-result]')).toContainText('Enter a whole-number');
  await expect(page.getByRole('spinbutton',{name:'Save DC',exact:true})).toHaveAttribute('aria-invalid','true');
});

test('concentration floors damage, caps DC, and applies advantage once', async ({page}) => {
  await page.goto('/tools/');
  await expect(page.locator('[data-con-result]')).toHaveText('DC 10 · maintain 80% · lose 20%');
  await page.getByRole('spinbutton',{name:'Damage taken from one source'}).fill('59');
  await expect(page.locator('[data-con-result]')).toHaveText('DC 29 · maintain 0% · lose 100%');
  await page.getByRole('spinbutton',{name:'Damage taken from one source'}).fill('999');
  await expect(page.locator('[data-con-result]')).toHaveText('DC 30 · maintain 0% · lose 100%');
  await page.getByRole('spinbutton',{name:'Damage taken from one source'}).fill('21');
  await page.getByRole('combobox',{name:'Your roll'}).selectOption('advantage');
  await expect(page.locator('[data-con-result]')).toHaveText('DC 10 · maintain 96% · lose 4%');
  await page.getByRole('spinbutton',{name:'Damage taken from one source'}).fill('0');
  await expect(page.locator('[data-con-result]')).toContainText('Enter whole-number damage');
});

test('known save comparison leaves blanks unknown and uses the shared DC and roll mode', async ({page}) => {
  await page.goto('/tools/');
  await page.getByText('Compare known saves',{exact:true}).click();
  await expect(page.locator('[data-known-save-result="STR"]')).toHaveText('Unknown — no bonus entered');
  await expect(page.getByRole('spinbutton',{name:'STR save bonus',exact:true})).toHaveValue('');
  await page.getByRole('spinbutton',{name:'INT save bonus',exact:true}).fill('-1');
  await page.getByRole('spinbutton',{name:'WIS save bonus',exact:true}).fill('5');
  await expect(page.locator('[data-known-save-result="INT"]')).toHaveText('Fail 75% · succeed 25%');
  await expect(page.locator('[data-known-save-result="WIS"]')).toHaveText('Fail 45% · succeed 55%');
  await expect(page.locator('[data-known-save-result="CON"]')).toHaveText('Unknown — no bonus entered');
  await page.getByRole('combobox',{name:'Target’s roll'}).selectOption('advantage');
  await expect(page.locator('[data-known-save-result="INT"]')).toHaveText('Fail 56.25% · succeed 43.75%');
  await expect(page.locator('[data-known-save-result="WIS"]')).toHaveText('Fail 20.25% · succeed 79.75%');
  await page.getByRole('spinbutton',{name:'INT save bonus',exact:true}).fill('');
  await expect(page.locator('[data-known-save-result="INT"]')).toHaveText('Unknown — no bonus entered');
  await expect(page.getByRole('spinbutton',{name:'INT save bonus',exact:true})).toHaveAttribute('aria-invalid','false');
});

test('expected damage can copy a save chance and rejects invalid outcomes', async ({page}) => {
  await page.goto('/tools/');
  await expect(page.locator('[data-damage-result]')).toHaveText('15.5 expected damage per target');
  await page.getByRole('combobox',{name:'Target’s roll'}).selectOption('advantage');
  await page.getByRole('button',{name:'Use saving-throw result'}).click();
  await expect(page.getByRole('spinbutton',{name:'Chance to fail (%)'})).toHaveValue('30.25');
  await expect(page.locator('[data-damage-result]')).toHaveText('13.03 expected damage per target');
  await page.getByRole('spinbutton',{name:'Chance to fail (%)'}).fill('101');
  await expect(page.locator('[data-damage-result]')).toContainText('Enter non-negative damage');
});

test('component shopping multiplies consumed casts but keeps reusable sets once', async ({page}) => {
  await page.goto('/tools/');
  await addSpell(page,'Find Familiar');
  await card(page,'Find Familiar').getByRole('spinbutton',{name:'Find Familiar: planned castings',exact:true}).fill('3');
  await addSpell(page,'Identify');
  await card(page,'Identify').getByRole('spinbutton',{name:'Identify: planned castings',exact:true}).fill('5');
  await expect(page.locator('[data-consumed-total]')).toHaveText('30 GP');
  await expect(page.locator('[data-reusable-total]')).toHaveText('100 GP');
  await expect(page.locator('[data-shopping-total]')).toHaveText('130 GP');
  await card(page,'Identify').getByRole('spinbutton',{name:'Identify, material 1: sets to acquire',exact:true}).fill('2');
  await expect(page.locator('[data-shopping-total]')).toHaveText('230 GP');
  await card(page,'Identify').getByRole('spinbutton',{name:'Identify, material 1: price per set (GP)',exact:true}).fill('125');
  await expect(page.locator('[data-shopping-total]')).toHaveText('280 GP');
  await page.getByRole('button',{name:'Remove Identify',exact:true}).click();
  await expect(page.locator('[data-shopping-total]')).toHaveText('30 GP');
  await page.getByRole('button',{name:'Clear list',exact:true}).click();
  await expect(page.locator('[data-component-entry]')).toHaveCount(0);
  await expect(page.locator('[data-shopping-total]')).toHaveText('0 GP');
  await expect(page.getByRole('button',{name:'Clear list',exact:true})).toBeDisabled();
});

test('mixed and per-target component sets retain the source accounting', async ({page}) => {
  await page.goto('/tools/');
  await addSpell(page,'Legend Lore');
  await card(page,'Legend Lore').getByRole('spinbutton',{name:'Legend Lore: planned castings',exact:true}).fill('3');
  await expect(page.locator('[data-consumed-total]')).toHaveText('750 GP');
  await expect(page.locator('[data-reusable-total]')).toHaveText('200 GP');
  await expect(page.locator('[data-shopping-total]')).toHaveText('950 GP');
  await addSpell(page,'Clone');
  await expect(page.locator('[data-shopping-total]')).toHaveText('3,950 GP');
  await addSpell(page,'Astral Projection');
  await card(page,'Astral Projection').getByRole('spinbutton',{name:'Astral Projection: planned castings',exact:true}).fill('2');
  await card(page,'Astral Projection').getByRole('spinbutton',{name:'Astral Projection: targets per casting (include caster)',exact:true}).fill('4');
  await expect(page.locator('[data-consumed-total]')).toHaveText('10,550 GP');
  await expect(page.locator('[data-shopping-total]')).toHaveText('12,750 GP');
});

test('special costs and unknown prices never masquerade as free/reusable materials', async ({page}) => {
  await page.goto('/tools/');
  await addSpell(page,'Magic Jar');
  await expect(card(page,'Magic Jar')).toContainText('destroyed when the spell ends');
  await addSpell(page,"Drawmij's Instant Summons");
  await card(page,"Drawmij's Instant Summons").getByRole('spinbutton',{name:"Drawmij's Instant Summons: planned castings",exact:true}).fill('3');
  await expect(page.locator('[data-special-total]')).toHaveText('3,500 GP');
  await expect(page.locator('[data-reusable-total]')).toHaveText('0 GP');
  await addSpell(page,'Dark Star');
  await expect(page.locator('[data-component-status]')).toContainText('Partial total');
  await expect(page.locator('[data-component-status]')).toContainText('Unknown is not zero');
  await card(page,'Dark Star').getByRole('spinbutton',{name:'Dark Star, material 1: price per set (GP)',exact:true}).fill('42');
  await card(page,'Dark Star').getByRole('spinbutton',{name:'Dark Star: planned castings',exact:true}).fill('2');
  await expect(page.locator('[data-consumed-total]')).toHaveText('84 GP');
  await expect(page.locator('[data-shopping-total]')).toHaveText('3,584 GP');
  await expect(page.locator('[data-component-status]')).not.toContainText('Partial');
  await addSpell(page,'Dark Star');
  await expect(page.locator('[data-component-add-status]')).toContainText('already in your list');
  await expect(page.locator('[data-component-entry]')).toHaveCount(3);
});

test('ordinary materials and all 208 spell choices remain explicit and source-linked', async ({page}) => {
  await page.goto('/tools/');
  await expect(page.locator('[data-component-spell] option')).toHaveCount(209);
  await addSpell(page,'Fireball');
  await expect(card(page,'Fireball')).toContainText('V, S, M (a ball of bat guano and sulfur)');
  await expect(card(page,'Fireball')).toContainText('not a quoted price of zero');
  await expect(card(page,'Fireball').getByRole('link',{name:'Fireball',exact:true})).toHaveAttribute('href','/library/spells/spell-cards/fireball-spell/');
  await expect(page.locator('[data-shopping-total]')).toHaveText('0 GP');
  await addSpell(page,'Gentle Repose');
  await expect(page.locator('[data-shopping-total]')).toHaveText('0.02 GP');
});

test('calculator controls stay accessible and fit a mobile viewport', async ({page}) => {
  await page.setViewportSize({width:390,height:900});
  await page.goto('/tools/');
  await addSpell(page,'Clone');
  const result=await new AxeBuilder({page}).include('#main-content').analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('#component-cost').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/calculators-mobile.png',fullPage:false});
});
