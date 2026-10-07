import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('all navigation destinations fit at the desktop breakpoint and remain reachable on mobile',async({page})=>{
  for(const width of [390,1059,1060,1440]){
    await page.setViewportSize({width,height:900});await page.goto('/');
    if(width<1060)await page.getByRole('button',{name:'Open navigation',exact:true}).click();
    const navigation=page.getByRole('navigation',{name:'Main navigation',exact:true});
    for(const name of ['Items','Forms','Tools'])await expect(navigation.getByRole('link',{name,exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width>=1060){
      const boxes=await page.locator('.site-brand,.primary-navigation,.header-actions').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right}}));
      expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].left);
      expect(boxes[1].right).toBeLessThanOrEqual(boxes[2].left);
    }
  }
});

test('catalogue search ignores apostrophes and creature senses can be filtered and compared',async({page})=>{
  await page.goto('/spells/?q=tashas+mind+whip');
  await expect(page.locator('[data-catalog-count]')).toHaveText('1 spell');
  await expect(page.getByRole('checkbox',{name:"Compare Tasha's Mind Whip",exact:true})).toBeVisible();
  await page.getByRole('searchbox',{name:'Search spells',exact:true}).fill('dragons breath');
  await expect(page.locator('[data-catalog-count]')).toHaveText('1 spell');
  await expect(page.getByRole('checkbox',{name:"Compare Dragon's Breath",exact:true})).toBeVisible();
  await page.goto('/forms/?review=metadata-checked&q=darkvision');
  await expect(page.locator('[data-catalog-count]')).toHaveText('8 forms');
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await page.locator('[data-catalog] .filter-more summary').click();
  await page.getByRole('combobox',{name:'Review status',exact:true}).selectOption('metadata-checked');
  await page.getByRole('combobox',{name:'Senses',exact:true}).selectOption('blindsight');
  await expect(page.locator('[data-catalog-count]')).toHaveText('7 forms');
  await page.getByRole('checkbox',{name:'Compare Bat',exact:true}).check();
  await page.locator('[data-compare-link]').click();
  await expect(page.getByRole('rowheader',{name:'Senses',exact:true})).toBeVisible();
  await expect(page.getByRole('cell',{name:'Blindsight 60 ft.; Passive Perception 11',exact:true})).toBeVisible();
});

test('reader has finder return links, clarified titles and Obsidian-specific guidance',async({page})=>{
  for(const [route,label,href] of [
    ['/library/spells/spell-cards/shield-spell/','Back to spell finder','/spells/'],
    ['/library/creatures/creature-cards/giant-ape-creature/','Back to form finder','/forms/'],
  ]){
    await page.goto(route);const link=page.getByRole('link',{name:new RegExp(label)});await expect(link).toHaveAttribute('href',href);
  }
  for(const [route,title] of [['home/quick-finder','Quick Finder'],['tactics/spell-tactics','Spell Tactics'],['tiers/polymorph-friendly-hostile-tier-list','Friendly & Hostile Polymorph Forms Tier List']]){
    await page.goto(`/library/${route}/`);await expect(page.locator('h1')).toHaveText(title);
  }
  await page.goto('/library/home/vault-guide/');
  await expect(page.getByRole('heading',{name:'This guide is for Obsidian',exact:true})).toBeVisible();
  await page.locator('.context-notice').getByRole('link',{name:'website guide',exact:true}).click();
  await expect(page).toHaveURL(/\/guide\//);await expect(page.getByText('Latest vault snapshot:',{exact:false})).toBeVisible();
});

test('gallery-only creatures can be searched, opened and compared without invented spell gates',async({page})=>{
  await page.goto('/forms/?q=succubus&movement=fly');
  await expect(page.locator('[data-catalog-row]:visible')).toContainText('true form');
  await page.goto('/forms/?q=mammoth');
  await expect(page.locator('[data-catalog-count]')).toHaveText('1 form');
  await page.getByRole('checkbox',{name:'Compare Mammoth',exact:true}).check();
  await page.locator('[data-compare-link]').click();
  await expect(page.locator('[data-comparison-status]')).toHaveText('1 entry compared');
  const image=page.getByRole('img',{name:'Mammoth stat block',exact:true}).first();
  await expect.poll(()=>image.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await page.getByRole('columnheader',{name:'Mammoth',exact:true}).getByRole('link').click();
  await expect(page).toHaveURL(/\/forms\/gallery\/mammoth\//);
  await expect(page.locator('h1')).toHaveText('Mammoth');
  await expect(page.getByRole('link',{name:/Back to form finder/})).toBeVisible();
  const issues=await new AxeBuilder({page}).analyze();expect(issues.violations).toEqual([]);
});
