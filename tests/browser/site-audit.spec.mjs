import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync } from "node:fs";
import path from "node:path";

test("every generated page opens with a heading and no uncaught browser errors", async ({
  page,
}) => {
  const collectPages = (directory) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? collectPages(path.join(directory, entry.name))
        : entry.name.endsWith(".html")
          ? [path.join(directory, entry.name)]
          : [],
    );
  const pages = collectPages("dist");
  expect(pages.length).toBeGreaterThan(0);
  const errors = [];
  page.on("pageerror", (error) =>
    errors.push({ url: page.url(), message: error.message }),
  );
  for (const file of pages) {
    const route = "/" + path.relative("dist", file).replace(/index\.html$/, "");
    const response = await page.goto(route);
    expect(response.status(), route).toBe(200);
    await expect(page.locator("h1"), route).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

const routes = [
  "/",
  "/compendium/",
  "/spells/",
  "/spells/compare/",
  "/tools/",
  "/play/",
  "/prepare/",
  "/search/?q=shield",
  "/builds/compare/",
  "/learn/",
  "/wizard/level-up/",
  "/chapters/11-wizard-spell-master-table-and-research-bank/",
];
for (const width of [390, 1440]) {
  test(`site navigation, accessibility and layout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const findings = [];
    for (const route of routes) {
      const errors = [];
      const collect = (e) => errors.push(e.message);
      page.on("pageerror", collect);
      const response = await page.goto(route);
      expect(response.status(), route).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth > innerWidth + 1,
        elements: [...document.querySelectorAll("main *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              r.width &&
              r.right > innerWidth + 1 &&
              !el.closest(
                ".table-wrap,.chapter-directory-wrap,.quick-reference-wrap,.component-table-wrap",
              )
            );
          })
          .slice(0, 4)
          .map((el) => `${el.tagName}.${el.className}`),
      }));
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      if (overflow.page || errors.length || axe.violations.length)
        findings.push({
          route,
          overflow,
          errors,
          violations: axe.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes
              .slice(0, 3)
              .map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        });
      page.off("pageerror", collect);
      if (["/", "/compendium/", "/spells/"].includes(route))
        await page.screenshot({
          path: `test-results/audit-${route.replaceAll("/", "") || "home"}-${width}.png`,
        });
    }
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });
}
