import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

const openPlanControls=async page=>{const details=page.locator('.component-plan-tools');if(await details.getAttribute('open')===null)await details.locator('summary').click();};
const addSpell=async(page,name)=>{await page.getByRole('combobox',{name:'Spell',exact:true}).selectOption({label:name});await page.getByRole('button',{name:'Add spell',exact:true}).click();};
const card=(page,name)=>page.locator('[data-component-entry]').filter({has:page.getByRole('heading',{name,exact:true})});

test('library name search shares punctuation handling and carries questions to full search',async({page})=>{
  await page.goto('/library/');
  const input=page.getByRole('searchbox',{name:'Find a reference',exact:true});
  for(const query of ['Mordenkainen’s Private Sanctum','mordenkainens private sanctum']){
    await input.fill(query);await expect(page.locator('[data-library-count]')).toHaveText('1 reference');
    await expect(page.locator('[data-library-list] article:visible')).toContainText("Mordenkainen's Private Sanctum");
  }
  await input.fill('how many spells do I prepare');
  const link=page.locator('[data-library-question]').last();
  const href=await link.getAttribute('href');expect(new URL(href,'https://wizard.example').searchParams.get('q')).toBe('how many spells do I prepare');
});

test('reader return retains filters, selection and read-rows view even when session storage is blocked',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new DOMException('Blocked','SecurityError');}}));
  await page.goto('/spells/?q=shield&school=Abjuration');
  await page.getByRole('button',{name:'Read rows',exact:true}).click();
  await page.getByRole('checkbox',{name:'Compare Shield',exact:true}).check();
  await page.locator('[data-catalog-row]:visible .table-identity a').filter({hasText:/^Shield$/}).click();
  await page.getByRole('link',{name:/Back to spell finder/}).click();
  const url=new URL(page.url());expect(url.searchParams.get('q')).toBe('shield');expect(url.searchParams.get('school')).toBe('Abjuration');expect(url.searchParams.get('view')).toBe('rows');
  await expect(page.getByRole('checkbox',{name:'Compare Shield',exact:true})).toBeChecked();
  await expect(page.getByRole('button',{name:'Compare columns',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('comparison edits the same shortlist and gallery references return to their form filters',async({page})=>{
  await page.goto('/forms/?q=mammoth&maxcr=6');
  await page.getByRole('checkbox',{name:'Compare Mammoth',exact:true}).check();
  await page.locator('[data-compare-link]').click();
  await expect(page.locator('[data-comparison-status]')).toHaveText('1 entry compared');
  await page.getByRole('link',{name:/Edit this shortlist/}).click();
  await expect(page.getByRole('checkbox',{name:'Compare Mammoth',exact:true})).toBeChecked();
  await expect(page.getByRole('searchbox',{name:'Search forms',exact:true})).toHaveValue('mammoth');
  await page.locator('[data-catalog-row]:visible .table-identity a').click();
  await page.getByRole('link',{name:/Back to form finder/}).click();
  expect(new URL(page.url()).searchParams.get('maxcr')).toBe('6');
  await expect(page.getByRole('checkbox',{name:'Compare Mammoth',exact:true})).toBeChecked();
});

test('untrusted finder-return URLs cannot turn a reader link into an external redirect',async({page})=>{
  await page.goto('/library/spells/spell-cards/shield-spell/?returnTo=https%3A%2F%2Fevil.example%2Fspells%2F');
  await expect(page.getByRole('link',{name:/Back to spell finder/})).toHaveAttribute('href','/spells/');
});

test('component plans save explicitly and restore quantities and unknown costs after reload',async({page})=>{
  await page.goto('/tools/');await addSpell(page,'Find Familiar');
  await card(page,'Find Familiar').getByRole('spinbutton',{name:'Find Familiar: planned castings',exact:true}).fill('3');
  await addSpell(page,'Dark Star');
  expect(await page.evaluate(()=>localStorage.getItem('wizard-compendium-component-plan-v1'))).toBeNull();
  await openPlanControls(page);await page.getByRole('button',{name:'Save plan to browser',exact:true}).click();
  await expect(page.locator('[data-component-plan-status]')).toContainText('saved in this browser');
  await page.reload();await expect(page.locator('[data-component-entry]')).toHaveCount(0);
  await openPlanControls(page);await page.getByRole('button',{name:'Restore saved plan',exact:true}).click();
  await expect(card(page,'Find Familiar').getByRole('spinbutton',{name:'Find Familiar: planned castings',exact:true})).toHaveValue('3');
  await expect(card(page,'Dark Star').getByRole('spinbutton',{name:'Dark Star, material 1: price per set (GP)',exact:true})).toHaveValue('');
  await expect(page.locator('[data-shopping-total]')).toHaveText('30 GP');
  await expect(page.locator('[data-component-status]')).toContainText('Partial total');
});

test('JSON plan export/import preserves null prices and rejects malformed files without replacing work',async({page})=>{
  await page.goto('/tools/');await addSpell(page,'Dark Star');await openPlanControls(page);
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export plan (JSON)',exact:true}).click();
  const download=await downloadEvent,bytes=await readFile(await download.path()),data=JSON.parse(bytes.toString());
  expect(data.entries[0].rows[0].price).toBeNull();
  await page.getByRole('button',{name:'Clear list',exact:true}).click();
  await page.getByLabel('Import plan (JSON)',{exact:true}).setInputFiles({name:'plan.json',mimeType:'application/json',buffer:bytes});
  await expect(card(page,'Dark Star')).toBeVisible();
  await expect(page.locator('[data-component-plan-status]')).toContainText('Nothing was saved automatically');
  await page.getByLabel('Import plan (JSON)',{exact:true}).setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
  await expect(page.locator('[data-component-plan-status]')).toContainText('not valid JSON');
  await expect(card(page,'Dark Star')).toBeVisible();
});

test('blocked plan storage remains usable and the expanded controls fit mobile accessibly',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Blocked','SecurityError');}}));
  await page.setViewportSize({width:390,height:900});await page.goto('/tools/');await addSpell(page,'Clone');await openPlanControls(page);
  await page.getByRole('button',{name:'Save plan to browser',exact:true}).click();
  await expect(page.locator('[data-component-plan-status]')).toContainText('could not save');
  await expect(card(page,'Clone')).toBeVisible();
  await expect(page.getByRole('button',{name:'Export plan (JSON)',exact:true})).toBeEnabled();
  const issues=await new AxeBuilder({page}).include('#main-content').analyze();expect(issues.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
