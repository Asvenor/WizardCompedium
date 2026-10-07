import {test,expect} from '@playwright/test';

test('all matches can be reached and the displayed range survives reload and browser Back',async({page})=>{
  await page.goto('/search/?q=concentration&section=spells');
  await expect(page.locator('[data-search-status]')).toContainText('showing 20 of');
  const total=Number((await page.locator('[data-search-status]').textContent()).match(/^\d+/)[0]);
  expect(total).toBeGreaterThan(100);
  const results=page.locator('[data-search-results] article');
  await expect(results).toHaveCount(20);
  await page.getByRole('button',{name:'Show more results',exact:true}).click();
  await expect(results).toHaveCount(40);
  await expect(page).toHaveURL(/page=2/);
  await page.getByRole('button',{name:'Show more results',exact:true}).click();
  await expect(results).toHaveCount(60);
  await page.goBack();
  await expect(results).toHaveCount(40);
  await expect(page).toHaveURL(/page=2/);
  while(await page.getByRole('button',{name:'Show more results',exact:true}).isVisible()){
    const count=await results.count();
    await page.getByRole('button',{name:'Show more results',exact:true}).click();
    await expect.poll(()=>results.count()).toBeGreaterThan(count);
  }
  await expect(results).toHaveCount(total);
  expect(new Set(await results.locator('h2 a').evaluateAll(links=>links.map(link=>link.href))).size).toBe(total);
  await page.reload();
  await expect(results).toHaveCount(total);
  await expect(page.locator('[data-search-status]')).toContainText(`showing ${total} of ${total}`);
});

test('query and section changes reset the loaded range and remove its URL state',async({page})=>{
  await page.goto('/search/?q=concentration&section=spells&page=3');
  await expect(page.locator('[data-search-results] article')).toHaveCount(60);
  await page.getByRole('searchbox',{name:'Search',exact:true}).fill('battle familiar');
  await expect(page.locator('[data-search-status]')).toContainText('results');
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.locator('[data-search-results] h2 a').filter({hasText:/^Battle Familiar$/})).toHaveCount(1);
  await page.getByRole('combobox',{name:'Section',exact:true}).selectOption('items');
  await expect(page).not.toHaveURL(/page=/);
  await expect(page).toHaveURL(/section=items/);
  await expect(page.locator('[data-search-results] h2 a').filter({hasText:/^Battle Familiar$/})).toHaveCount(0);
  const links=await page.locator('[data-search-results] h2 a').evaluateAll(elements=>elements.map(element=>element.getAttribute('href')));
  expect(links.every(href=>href.startsWith('/library/items/'))).toBe(true);
});

test('known vault filenames find renamed references and redirects do not duplicate canonical cards',async({page})=>{
  for(const[query,href]of [['spell tactics','/library/tactics/spell-tactics/'],['quick finder','/library/home/quick-finder/'],['battle familiar','/library/spells/spell-cards/battle-familiar-spell/']]){
    await page.goto(`/search/?q=${encodeURIComponent(query)}`);
    await expect(page.locator('[data-search-results] h2 a').first()).toHaveAttribute('href',href);
    if(query==='battle familiar')await expect(page.locator('[data-search-results] h2 a').filter({hasText:/^Battle Familiar$/})).toHaveCount(1);
  }
});

test('retry preserves a deep search range and clearing the query resets it',async({page})=>{
  let fail=true;
  await page.route('**/search-index.json',route=>fail?route.abort():route.continue());
  await page.goto('/search/?q=concentration&section=spells&page=3');
  await expect(page.locator('[data-search-status]')).toContainText('Search could not load');
  await expect(page.getByRole('searchbox',{name:'Search',exact:true})).toHaveValue('concentration');
  fail=false;
  await page.getByRole('button',{name:'Retry search',exact:true}).click();
  await expect(page.locator('[data-search-results] article')).toHaveCount(60);
  await expect(page).toHaveURL(/page=3/);
  await page.getByRole('searchbox',{name:'Search',exact:true}).fill('!!!');
  await expect(page.locator('[data-search-status]')).toHaveText('Enter a name or phrase to begin.');
  await expect(page.locator('[data-search-results] article')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Show more results',exact:true})).toBeHidden();
  await expect(page).not.toHaveURL(/page=/);
});

test('a changed query supersedes an earlier search waiting for the index',async({page})=>{
  await page.route('**/search-index.json',async route=>{
    await new Promise(resolve=>setTimeout(resolve,350));
    await route.continue();
  });
  await page.goto('/search/?q=concentration');
  await page.getByRole('searchbox',{name:'Search',exact:true}).fill('quick finder');
  await expect(page.locator('[data-search-results] h2 a').first()).toHaveAttribute('href','/library/home/quick-finder/');
  await expect(page.locator('[data-search-status]')).not.toContainText('Searching');
  await expect(page).toHaveURL(/q=quick\+finder/);
});
