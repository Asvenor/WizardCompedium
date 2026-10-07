import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('a natural spell-count question exposes a direct source answer and relevant reference',async({page})=>{
  await page.goto('/search/?q='+encodeURIComponent('How many spells should I have at each level?'));
  await expect(page.locator('[data-search-status]')).not.toHaveText('Searching…');
  const answers=page.locator('[data-answer-results]');
  await expect(answers).toContainText(/spellbook/i);
  await expect(answers).toContainText(/prepared/i);
  await expect(answers.locator('a').filter({hasText:'Read the exact reference'}).first()).toHaveAttribute('href',/level-progression-planner\/#wizard-level-table/);
  const urls=await page.locator('[data-search-results] h2 a').evaluateAll(links=>links.slice(0,5).map(link=>link.getAttribute('href')));
  expect(urls.some(url=>url.includes('/level-progression-planner/'))).toBe(true);
  await answers.locator('a').filter({hasText:'Read the exact reference'}).first().click();
  await expect(page).toHaveURL(/level-progression-planner\/#wizard-level-table/);
  await expect(page.locator('#wizard-level-table')).toBeVisible();
});

test('quick answers respect section filters and unknown questions do not invent answers',async({page})=>{
  await page.goto('/search/?q='+encodeURIComponent('how many spells can I prepare')+'&section=items');
  await expect(page.locator('[data-search-answers]')).toBeHidden();
  await page.goto('/search/?q=unrecordedzigzagwizardtopic');
  await expect(page.locator('[data-search-answers]')).toBeHidden();
  await expect(page.locator('[data-search-results]')).toContainText('No reference matches');
  await expect(page.locator('[data-search-results] a')).toHaveAttribute('href','/questions/');
});

test('a numbered question offers the matching level-up view without assuming a multiclass route',async({page})=>{
  await page.goto('/search/?q='+encodeURIComponent('how many spells can I prepare at level 9'));
  await expect(page.getByRole('link',{name:'Check level 9 · choose your class route',exact:true}).first()).toHaveAttribute('href','/level-up/?basis=character&level=9');
  await expect(page.locator('[data-answer-results] > article')).toHaveCount(1);
  await expect(page.locator('[data-answer-results] details')).not.toHaveAttribute('open');
});

test('quick answers keep concentration polarity and explicit rule editions separate',async({page})=>{
  await page.goto('/search/?q='+encodeURIComponent('spells with concentration'));
  await expect(page.locator('[data-search-status]')).not.toHaveText('Searching…');
  await expect(page.locator('[data-search-answers]')).toBeHidden();
  await page.goto('/search/?q='+encodeURIComponent('spells without concentration'));
  await expect(page.locator('[data-answer-results] [data-answer-id="no-concentration-spells"]')).toBeVisible();
  for(const query of ['2014 how many spells can I prepare at level 9','2014 how does Counterspell work']){
    await page.goto('/search/?q='+encodeURIComponent(query));
    await expect(page.locator('[data-search-status]')).not.toHaveText('Searching…');
    await expect(page.locator('[data-search-answers]')).toBeHidden();
    // A legacy-only numeric question may have no source match; it must still
    // finish ordinary search and never substitute a current-edition answer.
    await expect(page.locator('[data-search-results]')).toBeVisible();
    await expect(page.locator('[data-search-status]')).not.toContainText('could not');
  }
});

test('close spell-name typos offer an explicit suggestion without inventing an answer',async({page})=>{
  await page.goto('/search/?q=hypontic+pattern');
  await expect(page.locator('[data-search-answers]')).toBeHidden();
  await expect(page.locator('[data-search-suggestions]')).toContainText('Did you mean');
  await expect(page.locator('[data-search-suggestions] a').first()).toHaveText('Hypnotic Pattern');
  await page.locator('[data-search-suggestions] a').first().click();
  await expect(page).toHaveURL(/hypnotic-pattern-spell\//);
});

test('question centre filters, resets, and restores a shared question URL',async({page})=>{
  await page.goto('/questions/');
  const count=await page.locator('[data-questions] [data-answer-id]:visible').count();
  expect(count).toBeGreaterThan(8);
  await page.getByRole('searchbox',{name:'Find a common question'}).fill('concentration');
  await expect(page.locator('[data-question-empty]')).toBeHidden();
  expect(await page.locator('[data-questions] [data-answer-id]:visible').count()).toBeGreaterThan(1);
  await page.getByRole('searchbox',{name:'Find a common question'}).fill('spellbook totals');
  await expect(page.locator('[data-question-count]')).toContainText('search everything');
  expect(await page.locator('[data-questions] [data-answer-id]:visible').count()).toBeLessThan(count);
  await page.reload();
  await expect(page.getByRole('searchbox',{name:'Find a common question'})).toHaveValue('spellbook totals');
  await expect(page.locator('[data-questions]')).toContainText(/spellbook/i);
  await page.getByRole('button',{name:'Clear filters'}).click();
  await expect(page.locator('[data-questions] [data-answer-id]:visible')).toHaveCount(count);
  await page.getByRole('searchbox',{name:'Find a common question'}).fill('unrecordedzigzagwizardtopic');
  await expect(page.locator('[data-question-empty]')).toBeVisible();
  await expect(page.locator('[data-question-search]')).toHaveAttribute('href',/q=unrecordedzigzagwizardtopic/);
});

test('common answers remain readable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  try{const page=await context.newPage();await page.goto('/questions/');
    expect(await page.locator('[data-answer-id]:visible').count()).toBeGreaterThan(8);
    await expect(page.locator('a[href="/level-up/"]').first()).toBeVisible();
  }finally{await context.close();}
});

test('search and exact reference section links can be copied',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/search/?q=spellbook+minimum');
  await page.getByRole('button',{name:'Copy search link'}).click();
  await expect(page.locator('[data-copy-status]')).toHaveText('Search link copied.');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('/search/?q=spellbook+minimum');
  await page.goto('/library/character/level-progression-planner/');
  await page.getByRole('button',{name:'Copy link to Wizard level table',exact:true}).click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('/level-progression-planner/#wizard-level-table');
  await expect(page.locator('.section-share-status')).toContainText('copied');
});

test('question-first pages fit mobile and have no serious accessibility violations',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const url of ['/questions/','/search/?q=how+many+spells+per+level','/']){
    await page.goto(url);
    if(url.includes('/search/'))await expect(page.locator('[data-search-status]')).not.toHaveText('Searching…');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const results=await new AxeBuilder({page}).analyze();
    expect(results.violations.filter(issue=>['serious','critical'].includes(issue.impact))).toEqual([]);
  }
  await page.goto('/search/?q='+encodeURIComponent('how many spells should I have at each level'));
  await expect(page.locator('[data-search-answers]')).toBeVisible();
  await page.screenshot({path:'test-results/question-search-mobile.png'});
});
