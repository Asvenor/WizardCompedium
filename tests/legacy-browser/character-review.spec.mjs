import { test, expect } from "@playwright/test";

test("manual review updates derived levels and can exclude a mistaken spell", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await page
    .getByLabel("Character name", { exact: true })
    .fill("Review Fixture");
  await page
    .getByLabel("Classes and levels", { exact: true })
    .fill("Wizard 6 / Artificer 1");
  await expect(page.getByLabel("Character level", { exact: true })).toHaveValue(
    "7",
  );
  await page
    .getByLabel("Classes and levels", { exact: true })
    .fill("Wizard 6 / Custom 2");
  await expect(page.getByLabel("Character level", { exact: true })).toHaveValue(
    "",
  );
  await page.getByRole("button", { name: "Add a spell or cantrip" }).click();
  await page
    .getByLabel("Spell name", { exact: true })
    .fill("Fictional reading");
  await page.getByRole("button", { name: /^Exclude spell 1:/ }).click();
  await expect(page.locator("#spell-review fieldset")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add a spell or cantrip" }),
  ).toBeFocused();
});

test("returning to upload preserves the review until replacement is explicitly accepted", async ({
  page,
}) => {
  await page.goto("/play/import/");
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await page
    .getByLabel("Character name", { exact: true })
    .fill("Unsaved Fixture");
  await page.getByRole("button", { name: "Back to upload" }).click();
  await expect(
    page.getByRole("button", { name: "Return to unsaved review" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await page.getByRole("button", { name: "Return to unsaved review" }).click();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Unsaved Fixture",
  );
  await page.getByRole("button", { name: "Back to upload" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Enter character manually" }).click();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "",
  );
});

test("a link to a character from another browser explains the local-storage boundary", async ({
  page,
}) => {
  await page.goto("/play/import/?character=character.missing_fixture");
  await expect(page.locator("#import-error")).toContainText(
    "not saved in this browser",
  );
  await expect(page.locator("#import-character")).toHaveValue("");
});
