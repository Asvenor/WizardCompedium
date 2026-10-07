import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('numeric deep link answers baseline without selecting or favoring a subclass', async ({page}) => {
  await page.goto('/level-up/?basis=character&level=9');
  await expect(page.locator('#lp-subclass')).toHaveValue('');
  await expect(page.locator('#lp-title')).toHaveText('Character 9 · Wizard 9');
  await expect(page.locator('#lp-prepared')).toHaveText('14');
  await expect(page.locator('#lp-baseline')).toHaveText('22');
  await expect(page.locator('#lp-book-total')).toHaveText('Choose a subclass');
  await expect(page.locator('#lp-acquisitions')).toBeHidden();
  await expect(page.locator('#lp-route-label')).toHaveText('Pure Wizard');
  await expect(page.locator('#lp-subclass option')).toHaveCount(8);
});

test('route totals and exact selected acquisitions distinguish Savant from non-Savant', async ({page}) => {
  await page.goto('/level-up/?subclass=diviner&route=pure&basis=character&level=20');
  await expect(page.locator('#lp-baseline')).toHaveText('44');
  await expect(page.locator('#lp-book-total')).toHaveText('53');
  await expect(page.locator('#lp-extra-total')).toHaveText('9');
  await expect(page.locator('#lp-new-features')).toContainText('Counterspell');
  await page.getByRole('combobox', {name: 'Subclass', exact: true}).selectOption('bladesinger');
  await expect(page.locator('#lp-book-total')).toHaveText('44');
  await expect(page.locator('#lp-normal a')).toHaveText(['Sleet Storm', 'Greater Invisibility']);
  await page.getByRole('checkbox', {name: 'Chosen: Sleet Storm', exact: true}).check();
  await page.getByRole('button', {name: 'Previous level'}).click();
  await expect(page.locator('#lp-title')).toHaveText('Character 19 · Wizard 19');
  await page.goBack();
  await expect(page.locator('#lp-title')).toHaveText('Character 20 · Wizard 20');
  await expect(page.getByRole('checkbox', {name: 'Chosen: Sleet Storm', exact: true})).not.toBeChecked();
  await page.reload();
  await expect(page.locator('#lp-subclass')).toHaveValue('bladesinger');
  await expect(page.locator('#lp-book-total')).toHaveText('44');
});

test('Artificer shared slots and Cleric/Fighter dip pauses never become extra Wizard spells', async ({page}) => {
  await page.goto('/level-up/?subclass=abjurer&route=artificer-1&basis=character&level=9');
  await expect(page.locator('#lp-title')).toHaveText('Character 9 · Wizard 8');
  await expect(page.locator('#lp-highest')).toHaveText('Level 4');
  await expect(page.locator('#lp-slot-list > div')).toHaveCount(5);
  await expect(page.locator('#lp-slot-list > div').last()).toHaveText('Level 51');
  await page.locator('#lp-route').selectOption('cleric-1');
  await page.locator('#lp-level').selectOption('6');
  await expect(page.locator('#lp-title')).toHaveText('Character 6 · Wizard 5');
  await expect(page.locator('#lp-prepared')).toHaveText('9');
  await expect(page.locator('#lp-normal input')).toHaveCount(0);
  await expect(page.locator('#lp-advanced')).toContainText('No new Wizard acquisitions');
  await page.locator('#lp-route').selectOption('fighter-2');
  await page.locator('#lp-level').selectOption('7');
  await expect(page.locator('#lp-title')).toHaveText('Character 7 · Wizard 5');
  await expect(page.locator('#lp-normal input')).toHaveCount(0);
  await page.locator('#lp-basis').selectOption('wizard');
  await expect(page.locator('#lp-title')).toHaveText('Character 6 · Wizard 5');
  await expect(page.locator('#lp-normal input')).toHaveCount(2);
});

test('before Wizard1 and terminal Fighter2 wizard18 are valid, bounded states', async ({page}) => {
  await page.goto('/level-up/?subclass=chronurgy&route=fighter-2&basis=wizard&level=0');
  await expect(page.locator('#lp-no-wizard')).toBeVisible();
  await expect(page.locator('#lp-prepared')).toHaveText('0');
  await expect(page.locator('#lp-book-total')).toHaveText('0');
  await expect(page.locator('#lp-slot-list > div')).toHaveCount(0);
  await expect(page.locator('#lp-previous')).toBeDisabled();
  await page.locator('#lp-level').selectOption('18');
  await expect(page.locator('#lp-title')).toHaveText('Character 20 · Wizard 18');
  await expect(page.locator('#lp-next')).toBeDisabled();
  await expect(page.locator('#lp-new-features')).toContainText('Spell Mastery');
  await expect(page.locator('#lp-always a')).toHaveText(['Magic Missile', 'Invisibility']);
  await page.locator('#lp-route').selectOption('pure');
  await expect(page.locator('#lp-level option').last()).toHaveAttribute('value', '20');
  await page.locator('#lp-level').selectOption('20');
  await page.locator('#lp-route').selectOption('fighter-2');
  await expect(page.locator('#lp-level')).toHaveValue('18');
});

test('grants remain separate and all direct source links resolve to real anchors', async ({page}) => {
  await page.goto('/level-up/?subclass=illusionist&route=pure&basis=character&level=6');
  await expect(page.locator('#lp-prepared')).toHaveText('10');
  await expect(page.locator('#lp-cantrips')).toHaveText('4');
  await expect(page.locator('#lp-always a')).toHaveText(['Summon Beast', 'Summon Fey']);
  await expect(page.locator('#lp-book-list')).not.toContainText('Summon Beast');
  await expect(page.locator('#lp-book-list')).not.toContainText('Summon Fey');
  await page.locator('#lp-route-link').click();
  await expect(page).toHaveURL(/illusionist-spell-progression\/#exact-acquisitions$/);
  await expect(page.locator('#exact-acquisitions')).toBeVisible();
});

test('malformed shared state resets visibly and never injects executable query content', async ({page}) => {
  await page.goto('/level-up/?subclass=%3Cscript%3E&route=unknown&basis=wizard&level=-3');
  await expect(page.locator('#lp-status')).toContainText('Invalid subclass was reset');
  await expect(page.locator('#lp-status')).toContainText('Level must be 1–20');
  await expect(page.locator('#lp-subclass')).toHaveValue('');
  await expect(page.locator('#lp-title')).toHaveText('Character 1 · Wizard 1');
  await expect(page.locator('#lp-status')).not.toContainText('<script>');
});

test('mobile planner has no horizontal page overflow and meets accessible form semantics', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/level-up/?subclass=necromancer&route=artificer-1&basis=character&level=7');
  await expect(page.locator('#lp-title')).toHaveText('Character 7 · Wizard 6');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({page}).include('#main-content').analyze();
  expect(audit.violations.filter(v => ['critical', 'serious'].includes(v.impact))).toEqual([]);
  await page.screenshot({path: test.info().outputPath('level-up-mobile.png'), fullPage: true});
});
