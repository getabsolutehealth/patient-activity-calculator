import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

const card = (n: 1 | 2) => `.upload-row .upload-card:nth-child(${n}) input[type=file]`;

test("upload two months → run → correct stats → download", async ({ page }) => {
  await page.goto("/");

  // Run is gated until both files are loaded + mapped.
  await expect(page.locator(".run-btn")).toBeDisabled();

  await page.setInputFiles(card(1), fixture("prior.csv"));
  await page.setInputFiles(card(2), fixture("current.csv"));

  // Patient ID column ("Chart #") auto-detected; the DOB picker no longer exists.
  await expect(page.locator(".upload-card").first()).toContainText("Patient ID");
  await expect(page.locator(".upload-card").first()).not.toContainText("Date of birth");

  const run = page.locator(".run-btn");
  await expect(run).toBeEnabled();
  await run.click();

  // Hero stat + supporting row. P101 visit row deduped; Mary's name change
  // (P103) stays active; only John (P100) churns; Amy (P104) is new.
  await expect(page.locator(".results__hero-value")).toHaveText("0"); // momentum
  const stats = page.locator(".stat-card__value");
  await expect(stats.nth(0)).toHaveText("4"); // active
  await expect(stats.nth(1)).toHaveText("1"); // inactive
  await expect(stats.nth(2)).toHaveText("25.0%"); // churn
  await expect(stats.nth(3)).toHaveText("1"); // new

  // The Active panel lists 4 unique patients and downloads a CSV.
  await expect(page.locator(".panel").first().locator(".panel__count")).toHaveText("4");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(".panel").first().locator(".panel__dl").click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^active_patients_.*\.csv$/);
});

test("a non-CSV file shows an inline error and keeps Run disabled", async ({ page }) => {
  await page.goto("/");
  await page.setInputFiles(card(1), fixture("not.txt"));
  await expect(page.locator(".upload-card__error").first()).toBeVisible();
  await expect(page.locator(".run-btn")).toBeDisabled();
});
