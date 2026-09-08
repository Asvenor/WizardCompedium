import { test, expect } from "@playwright/test";

test('phone readers reach chapters without scrolling through all shortcuts', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/compendium/');
  await expect(page.locator('.directory-shortcuts')).not.toHaveAttribute('open', '');
  await expect(page.getByLabel('Find a chapter', {exact: true})).toBeInViewport();
  await page.locator('.directory-shortcuts summary').click();
  await expect(page.getByRole('link', {name: 'Tier Color Key', exact: true})).toBeVisible();
});

test("component calculator updates quantities, keeps partial costs honest and clears cleanly", async ({
  page,
}) => {
  await page.goto("/tools/#component-cost");
  const calculator = page.locator("[data-component-calculator]");
  await calculator
    .getByRole("checkbox", { name: "Find Familiar", exact: true })
    .check();
  await expect(calculator.locator("[data-consumed-total]")).toHaveText("10 gp");
  await calculator
    .getByLabel("Find Familiar sets needed", { exact: true })
    .fill("3");
  await expect(calculator.locator("[data-consumed-total]")).toHaveText("30 gp");
  await calculator
    .getByRole("checkbox", { name: "Identify", exact: true })
    .check();
  await expect(calculator.locator("[data-required-total]")).toHaveText(
    "100 gp",
  );
  await calculator
    .getByRole("checkbox", { name: "Magic Circle", exact: true })
    .check();
  await expect(calculator.locator("[data-component-note]")).toContainText(
    "Partial totals",
  );
  await calculator
    .getByLabel("Magic Circle price in gp", { exact: true })
    .fill("100");
  await expect(calculator.locator("[data-consumed-total]")).toHaveText(
    "130 gp",
  );
  await expect(calculator.locator("[data-component-note]")).not.toContainText(
    "Partial totals",
  );
  await calculator
    .getByLabel("Find Familiar sets needed", { exact: true })
    .fill("");
  await expect(calculator.locator("[data-component-note]")).toContainText(
    "Partial totals",
  );
  await calculator
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await expect(calculator.locator("[data-consumed-total]")).toHaveText("0 gp");
  await expect(calculator.locator("[data-required-total]")).toHaveText("0 gp");
  await expect(calculator.locator("[data-component-output]")).toBeHidden();
});

test("chapter directory has each chapter once and filters both layouts", async ({
  page,
}) => {
  await page.goto("/compendium/");
  const rows = page.locator(".chapter-directory-table tbody tr");
  await expect(rows).toHaveCount(61);
  const links = await rows
    .locator("a")
    .evaluateAll((entries) =>
      entries.map((entry) => entry.getAttribute("href")),
    );
  expect(new Set(links).size).toBe(61);
  await page
    .getByLabel("Find a chapter", { exact: true })
    .fill("emergency wizard");
  await expect(page.locator("[data-directory-count]")).toHaveText("1 chapter");
  await expect(rows.locator("a:visible")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".chapter-directory-mobile a:visible")).toHaveCount(
    1,
  );
  await page
    .getByLabel("Find a chapter", { exact: true })
    .fill("no-such-chapter-fixture");
  await expect(page.locator("[data-directory-empty]")).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator(".chapter-directory-mobile a:visible")).toHaveCount(
    61,
  );
  await expect(
    page.getByLabel("Find a chapter", { exact: true }),
  ).toBeFocused();
});

test("search retries a failed index without losing the query or category", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("**/search-index.json", async (route) => {
    if (++attempts === 1)
      await route.fulfill({ status: 503, body: "unavailable" });
    else await route.continue();
  });
  await page.goto("/search/?q=shield&kind=Spell");
  await expect(
    page.getByRole("button", { name: "Retry search" }),
  ).toBeVisible();
  await expect(page.locator("[data-search-input]")).toHaveValue("shield");
  await page.getByRole("button", { name: "Retry search" }).click();
  await expect(
    page.locator(".search-result").first().getByRole("link"),
  ).toHaveText("Shield");
  await expect(page.locator("[data-search-kind]")).toHaveValue("Spell");
  expect(await page.locator(".search-result-meta").allTextContents()).toEqual(
    expect.arrayContaining([expect.stringMatching(/^Spell/)]),
  );
  for (const modifier of ["Control", "Meta"]) {
    await page.locator("[data-search-kind]").focus();
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.locator("[data-search-input]")).toBeFocused();
    await expect(page.locator("[data-search-input]")).toHaveValue("shield");
    await expect(page).toHaveURL(/q=shield&kind=Spell/);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".mobile-nav summary").click();
  await expect(page.locator(".mobile-nav")).toHaveAttribute("open", "");
  await page.keyboard.press("Control+k");
  await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open", "");
  await expect(page.locator("[data-search-input]")).toBeFocused();
});

test("search uses the latest text when the index finishes loading", async ({
  page,
}) => {
  let release;
  const loaded = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/search-index.json", async (route) => {
    await loaded;
    await route.continue();
  });
  await page.goto("/search/?q=shield", { waitUntil: "domcontentloaded" });
  await page.locator("[data-search-input]").fill("fireball");
  await expect(page.locator("[data-search-status]")).toContainText("Loading");
  release();
  await expect(
    page.locator(".search-result").first().getByRole("link"),
  ).toHaveText("Fireball");
  await expect(page.locator("[data-search-status]")).toContainText("fireball");
});

test("unranked spells have an explicit neutral badge and a working filter", async ({
  page,
}) => {
  await page.goto("/spells/");
  await page.getByLabel("Tier", { exact: true }).selectOption("unranked");
  const cards = page.locator("[data-spell-card]:visible");
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBe(
    await page.locator('[data-spell-card][data-tier="unranked"]').count(),
  );
  await expect(
    cards.first().getByText("No fixed tier", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-spell-card][data-tier="s"]:visible'),
  ).toHaveCount(0);
});
