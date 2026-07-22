import { expect, test } from "@playwright/test";

test("investigates a validator outage", async ({ page }) => {
  await page.goto("/?filter=offline");
  await expect(
    page.getByRole("heading", {
      name: "5,000 deterministic validator records",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("offline", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /721/ }).first().click();
  await expect(
    page.getByRole("dialog", { name: "Validator details" }),
  ).toBeVisible();
});

test("inspects an abnormal oracle report", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Report OR-2481")).toBeVisible();
  await expect(
    page.getByText("Circuit-breaker threshold approached"),
  ).toBeVisible();
});

test("simulates a contract pause only after confirmation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("button", { name: "Simulate emergency pause" }).click();
  const simulate = page.getByRole("button", { name: /Run simulation/ });
  await expect(simulate).toBeDisabled();
  await page.getByPlaceholder("SIMULATE PAUSE").fill("SIMULATE PAUSE");
  await simulate.click();
  await expect(page.getByText("Simulation completed")).toBeVisible();
  await expect(
    page.getByText("No transaction will be broadcast"),
  ).toBeVisible();
});

test("models withdrawal stress without a transaction", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Liquidity scenario")).toBeVisible();
  const demand = page.getByRole("slider").first();
  await demand.fill("220");
  await expect(page.getByText("220%", { exact: true })).toBeVisible();
});

test("pauses and reconnects the event stream", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause simulation" }).click();
  await expect(page.getByText("Stream paused")).toBeVisible();
  await page.getByRole("button", { name: "Normal simulation speed" }).click();
  await expect(page.getByText(/Stream (connecting|live)/)).toBeVisible();
});
