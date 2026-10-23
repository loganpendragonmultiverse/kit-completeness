import { test, expect } from "@playwright/test";
import { example, APP } from "../src/core.js";
const key = `${APP}:v1`;
test("quantities persist, reset is confirmed and undo restores the exact previous counts", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  await expect(page.locator("#preview")).toContainText("4");
  await page.getByLabel("Present quantity", { exact: true }).first().fill("12");
  await page.getByRole("button", { name: "Save kit", exact: true }).click();
  await page.reload();
  await expect(
    page.getByLabel("Present quantity", { exact: true }).first(),
  ).toHaveValue("12");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: "Reset all present counts to zero",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Present quantity", { exact: true }).first(),
  ).toHaveValue("0");
  await page
    .getByRole("button", { name: "Undo last deletion / reset", exact: true })
    .click();
  await expect(
    page.getByLabel("Present quantity", { exact: true }).first(),
  ).toHaveValue("12");
  expect(errors).toEqual([]);
});
test("import cancel and explicit corrupt recovery do not silently replace saved data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  const before = await page.evaluate((k) => localStorage.getItem(k), key);
  await page.locator("#import").setInputFiles({
    name: "empty.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ app: APP, version: 1, data: { kits: [] } }),
    ),
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel import", exact: true })
    .click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(before);
  await page.evaluate((k) => localStorage.setItem(k, "broken original"), key);
  await page.reload();
  await expect(page.locator("#recover")).toBeVisible();
  await page.locator("#import").setInputFiles({
    name: "good.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ app: APP, version: 1, data: example() }),
    ),
  });
  await page
    .getByRole("button", { name: "Apply replacement", exact: true })
    .click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
    "broken original",
  );
  await page.locator("#replace-confirm").check();
  await page
    .getByRole("button", { name: "Apply replacement", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("stale and quota failures keep saved data; narrow and print views keep missing quantities", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  const second = await context.newPage();
  await second.goto("/");
  await page.getByLabel("Kit name", { exact: true }).fill("Fresh kit");
  await page.getByRole("button", { name: "Save kit", exact: true }).click();
  await second.getByLabel("Kit name", { exact: true }).fill("Stale kit");
  await second.getByRole("button", { name: "Save kit", exact: true }).click();
  await expect(second.locator("#message")).toContainText(
    /another tab|Another tab/,
  );
  await second.close();
  const raw = await page.evaluate((k) => localStorage.getItem(k), key);
  await page.evaluate(
    () =>
      (Storage.prototype.setItem = function () {
        throw new DOMException("quota", "QuotaExceededError");
      }),
  );
  await page.getByLabel("Kit name", { exact: true }).fill("Quota draft");
  await page.getByRole("button", { name: "Save kit", exact: true }).click();
  await expect(page.locator("#message")).toContainText("rejected the save");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(raw);
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#print-sheet")).toBeVisible();
  await expect(page.locator("#print-sheet")).toContainText("2 missing");
});
