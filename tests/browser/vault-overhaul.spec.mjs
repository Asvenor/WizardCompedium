import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const vault = JSON.parse(readFileSync('src/data/vault-index.json', 'utf8'));
const note = (sourcePath) => {
  const record = vault.notes.find((entry) => entry.sourcePath === sourcePath);
  if (!record) throw new Error(`Missing imported reference: ${sourcePath}`);
  return `/library/${record.slug}/`;
};
const sourceRoutes = {
  battleFamiliar: note('003 Spells/Spell Cards/Battle Familiar - Spell.md'),
  giantApe: note('005 Creature, Minions & Forms/Creature Cards/Giant Ape - Creature.md'),
  species: note('010 Tier Lists/Species Tier List.md'),
  progression: note('002 Character/Spell Progressions/Conjurer - Spell Progression.md'),
  problem: note('001 Home/Problem Navigator.md'),
};
const comparisonRoute = `/compare/?notes=${encodeURIComponent(vault.notes.find((entry) => entry.sourcePath === '003 Spells/Spell Cards/Shield - Spell.md').slug)}`;

test('both platform search shortcuts open search and select the existing query', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Search the compendium, Ctrl+K on Windows or Command+K on Mac' })).toBeVisible();
  for (const shortcut of ['Control+k', 'Meta+k']) {
    await page.keyboard.press(shortcut);
    await expect(page).toHaveURL(/\/search\//);
    const search = page.getByRole('searchbox', { name: 'Search', exact: true });
    await search.fill('battle familiar');
    await page.getByRole('combobox', { name: 'Section', exact: true }).focus();
    await page.keyboard.press(shortcut);
    await expect(search).toBeFocused();
    expect(await search.evaluate((input) => [input.selectionStart, input.selectionEnd])).toEqual([0, 15]);
  }
});

test('full-text search reaches casting details and recovers without losing the query', async ({ page }) => {
  let fail = true;
  await page.route('**/search-index.json', async (route) => fail ? route.abort() : route.continue());
  await page.goto('/search/?q=diamond&section=spells');
  await expect(page.locator('[data-search-status]')).toContainText('Search could not load');
  await expect(page.getByRole('searchbox', { name: 'Search', exact: true })).toHaveValue('diamond');
  fail = false;
  await page.getByRole('button', { name: 'Retry search' }).click();
  await expect(page.locator('[data-search-results] a').filter({ hasText: /^Battle Familiar$/ }).first()).toBeVisible();
  await expect(page.locator('[data-search-status]')).toContainText('result');
  await page.locator(`[data-search-results] a[href="${sourceRoutes.battleFamiliar}"]`).click();
  await expect(page.locator('h1')).toHaveText('Battle Familiar');
  await expect(page.locator('[data-reference-content]')).toContainText('25+ gp');
  await expect(page.locator('[data-reference-content]')).toContainText('Temporary HP');
});

test('spell filters combine, restore on reload and compare distinct rule fields', async ({ page }) => {
  await page.goto('/spells/');
  await expect(page.locator('[data-catalog-count]')).toHaveText('208 spells');
  await page.getByRole('combobox', { name: 'Spell use', exact: true }).selectOption('reaction');
  await expect(page.getByRole('checkbox', { name: 'Compare Shield', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Compare Fireball', exact: true })).toBeHidden();
  await page.getByText('More filters', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption('2024 core');
  await expect(page.getByRole('checkbox', { name: 'Compare Silvery Barbs', exact: true })).toBeHidden();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Spell use', exact: true })).toHaveValue('reaction');
  await expect(page.getByRole('checkbox', { name: 'Compare Shield', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Compare Silvery Barbs', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('[data-catalog-count]')).toHaveText('208 spells');
  await page.getByText('More filters', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Enemy saving throw', exact: true }).selectOption('INT');
  await expect(page.getByRole('checkbox', { name: 'Compare Mind Sliver', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Compare Contact Other Plane', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Compare Shield', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Compare Absorb Elements', exact: true }).check();
  await page.getByRole('button', { name: 'Read rows', exact: true }).click();
  await page.screenshot({ path: 'test-results/vault-spells-rows-1440.png', fullPage: false });
  await page.locator('[data-compare-link]').click();
  await expect(page.locator('[data-comparison-status]')).toHaveText('2 entries compared');
  await expect(page.getByRole('columnheader', { name: 'Shield', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Absorb Elements', exact: true })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Components', exact: true })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Access', exact: true })).toBeVisible();
});

test('item attunement filters distinguish a reusable item from an attuned one', async ({ page }) => {
  await page.goto('/items/');
  await expect(page.locator('[data-catalog-count]')).toHaveText('51 items');
  await page.getByRole('combobox', { name: 'Attunement', exact: true }).selectOption('false');
  await expect(page.getByRole('checkbox', { name: 'Compare Tome of Clear Thought', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Compare Mind Sharpener', exact: true })).toBeHidden();
  await page.getByRole('combobox', { name: 'Attunement', exact: true }).selectOption('true');
  await expect(page.getByRole('checkbox', { name: 'Compare Mind Sharpener', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Compare Tome of Clear Thought', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('[data-catalog-count]')).toHaveText('51 items');
});

test('form route, movement and CR filters keep natural familiar gates separate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/forms/');
  await expect(page.locator('[data-catalog-count]')).toHaveText('20 forms');
  await page.getByRole('combobox', { name: 'Candidate route', exact: true }).selectOption('find_familiar');
  await page.getByRole('combobox', { name: 'Movement', exact: true }).selectOption('fly');
  await page.getByRole('spinbutton', { name: 'Maximum CR', exact: true }).fill('0.25');
  await expect(page.locator('[data-catalog-count]')).toHaveText('2 forms');
  await expect(page.getByRole('checkbox', { name: 'Compare Owl', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Compare Bat', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Compare Giant Bat', exact: true })).toBeHidden();
  await expect(page.getByRole('checkbox', { name: 'Compare Giant Ape', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Read rows', exact: true }).click();
  await expect(page.locator('[data-catalog-row]:visible')).toHaveCount(2);
  await expect(page.locator('.catalog-wrap')).toHaveClass(/table-row-view/);
  await page.screenshot({ path: 'test-results/vault-forms-rows-390.png', fullPage: false });
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('[data-catalog-count]')).toHaveText('20 forms');
});

test('build matrix gives seven equal subclass routes and the separate optional configuration', async ({ page }) => {
  await page.goto('/builds/');
  const matrix = page.getByRole('region', { name: 'Subclass and class structure progressions' });
  await expect(matrix.locator('tbody th')).toHaveText(['Abjurer', 'Bladesinger', 'Chronurgy', 'Conjurer', 'Diviner', 'Illusionist', 'Necromancer']);
  await expect(matrix.getByRole('link')).toHaveCount(35);
  expect(new Set(await matrix.getByRole('link').evaluateAll((links) => links.map((link) => link.href))).size).toBe(35);
  await expect(page.getByRole('link', { name: 'Optional Illusion Adept configuration', exact: true })).toBeVisible();
  await matrix.getByRole('link', { name: 'Necromancer: Fighter 2 progression', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Fighter 2 dip with Necromancer — Spell Progression');
  await expect(page.locator('[data-reference-content]')).toContainText('Fighter 2 / Wizard 18');
});

test('level progression preserves separate ordinary, Savant and prepared benefits', async ({ page }) => {
  await page.goto(sourceRoutes.progression);
  await expect(page.locator('h1')).toHaveText('Conjurer — Spell Progression');
  const acquisitions = page.locator('[data-reference-content] table').filter({ has: page.getByRole('columnheader', { name: 'Learn normally', exact: true }) });
  await expect(acquisitions.getByRole('columnheader', { name: 'Extra book spells', exact: true })).toBeVisible();
  await expect(acquisitions.getByRole('columnheader', { name: 'Always prepared gained', exact: true })).toBeVisible();
  await expect(acquisitions.locator('tbody tr')).toHaveCount(20);
  await expect(page.locator('[data-reference-content]')).toContainText('44 ordinary spells + 9 distinct Savant spells');
  await expect(page.locator('[data-reference-content]')).toContainText('If components are unaffordable');
});

test('conditional tier labels survive and reader tables switch between rows and columns', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(sourceRoutes.species);
  const table = page.locator('[data-reference-content] table').first();
  await expect(table.getByText('A+', { exact: true }).first()).toBeVisible();
  await expect(table.getByText('B/A, flight route', { exact: true })).toBeVisible();
  const cells = table.locator('td.tier-cell');
  await expect(cells).toHaveCount(10);
  const backgrounds = await cells.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor));
  expect(new Set(backgrounds).size).toBeGreaterThan(1);
  const wrapper = page.getByRole('region', { name: 'Scrollable reference table: Tier, Species', exact: true });
  const toggle = page.getByRole('button', { name: 'Read rows', exact: true }).first();
  await toggle.click();
  await expect(wrapper).toHaveClass(/table-row-view/);
  await expect(page.getByRole('button', { name: 'Compare columns', exact: true }).first()).toHaveAttribute('aria-pressed', 'true');
  await expect(table.getByText('B/A, flight route', { exact: true })).toBeVisible();
  await table.locator('tbody tr').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/vault-tiers-rows-390.png', fullPage: false });
  await page.getByRole('button', { name: 'Compare columns', exact: true }).first().click();
  await expect(wrapper).not.toHaveClass(/table-row-view/);
});

test('linked source block anchors and original creature images remain usable', async ({ page }) => {
  await page.goto(sourceRoutes.problem);
  await page.getByRole('link', { name: 'How to attune optimal?', exact: true }).click();
  await expect(page).toHaveURL(/magic-item-attunement\/#block-ccfbec$/);
  await expect(page.locator('#block-ccfbec')).toBeAttached();
  await page.goto(sourceRoutes.giantApe);
  const image = page.locator('[data-reference-content] img').first();
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(page.locator('[data-reference-content]')).toContainText('Candidate — apply remaining spell requirements');
  await expect(page.locator('[data-reference-content]')).toContainText('Boulder Toss recharges on 6');
});

test('saved references persist on this device and can be removed', async ({ page }) => {
  await page.goto(sourceRoutes.battleFamiliar);
  await page.getByRole('button', { name: 'Save reference', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved · remove', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Saved · remove', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Saved · remove', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save reference', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-save-status]')).toContainText('Removed');
});

test('mobile navigation opens, follows a destination and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  const close = page.getByRole('button', { name: 'Close navigation', exact: true });
  await expect(close).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#primary-navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('#primary-navigation').getByRole('link', { name: 'Library', exact: true }).click();
  await expect(page).toHaveURL(/\/library\//);
  await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toHaveAttribute('aria-expanded', 'false');
});

for (const width of [390, 1440]) {
  test(`core references are readable, accessible and free of browser errors at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const findings = [];
    for (const route of ['/', '/library/', '/guide/', '/play/', comparisonRoute, '/search/?q=shield', '/spells/', '/items/', '/forms/', '/builds/', '/tiers/', ...Object.values(sourceRoutes)]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('h1'), route).toHaveCount(1);
      if (route === comparisonRoute) await expect(page.locator('[data-comparison-result]')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      const duplicateIds = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
        return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
      });
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      if (overflow || duplicateIds.length || axe.violations.length) findings.push({ route, overflow, duplicateIds, violations: axe.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.slice(0, 3).map((node) => node.target) })) });
      if (route === sourceRoutes.progression || route === sourceRoutes.species) await page.locator('[data-reference-content] table tbody tr').first().scrollIntoViewIfNeeded();
      if (route === '/' || route === '/spells/' || route === sourceRoutes.progression || route === sourceRoutes.species) await page.screenshot({ path: `test-results/vault-${route === '/' ? 'home' : route === '/spells/' ? 'spells' : route === sourceRoutes.progression ? 'progression' : 'tiers'}-${width}.png`, fullPage: false });
      if (route === sourceRoutes.progression && width === 390) {
        await page.getByRole('button', { name: 'Read rows', exact: true }).first().click();
        await page.locator('[data-reference-content] table tbody tr').first().scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'test-results/vault-progression-rows-390.png', fullPage: false });
      }
    }
    expect(errors).toEqual([]);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });
}
