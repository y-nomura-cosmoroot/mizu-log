import { expect, test } from "@playwright/test";
import { T0 } from "./helpers";
import { ALL_CHECKED_SEED, openSeeded } from "./visual-helpers";

// インラインstyle→CSSデザイントークン+CSS Modules 移行の視覚回帰スイート。
// ベースラインは移行前のHEADで生成し、各移行バッチ後に差分ゼロを確認する。
// 実行: npx playwright test --project=visual
// ベースライン更新: npx playwright test --project=visual --update-snapshots

test.describe("視覚回帰: home", () => {
  test("home-seeded", async ({ page }) => {
    await openSeeded(page);
    await expect(page).toHaveScreenshot("home-seeded.png", { fullPage: true });
  });

  test("home-empty", async ({ page }) => {
    await openSeeded(page, "/", null);
    await expect(page).toHaveScreenshot("home-empty.png", { fullPage: true });
  });

  test("home-hour-dropdown", async ({ page }) => {
    await openSeeded(page);
    await page.getByTestId("sel-hour-toggle").click();
    await expect(page.getByTestId("hour-dropdown")).toBeVisible();
    await expect(page).toHaveScreenshot("home-hour-dropdown.png", { fullPage: true });
  });

  test("home-calendar", async ({ page }) => {
    await openSeeded(page);
    await page.getByTestId("date-label").click();
    await expect(page.getByTestId("calendar-popup")).toBeVisible();
    await expect(page).toHaveScreenshot("home-calendar.png", { fullPage: true });
  });

  test("home-toast", async ({ page }) => {
    await openSeeded(page);
    // トーストが自然消滅しないよう偽クロックを停止してから記録する。
    // install(T0)後もクロックは実時間で進むため、確実に未来になる1分後で止める
    await page.clock.pauseAt(new Date(T0.getTime() + 60_000));
    await page.getByTestId("quick-water-150").click();
    await expect(page.getByTestId("toast")).toBeVisible();
    await expect(page).toHaveScreenshot("home-toast.png");
  });
});

test.describe("視覚回帰: input", () => {
  test("input-seeded", async ({ page }) => {
    await openSeeded(page, "/?tab=input");
    await expect(page).toHaveScreenshot("input-seeded.png", { fullPage: true });
  });

  test("input-empty", async ({ page }) => {
    await openSeeded(page, "/?tab=input", null);
    await expect(page).toHaveScreenshot("input-empty.png", { fullPage: true });
  });

  test("input-variant-normal", async ({ page }) => {
    await openSeeded(page, "/?tab=input", null);
    await page.getByTestId("vital-temp-select").selectOption("36.5");
    await expect(page.getByTestId("temp-status-chip")).toHaveText("平熱");
    await expect(page).toHaveScreenshot("input-variant-normal.png", { fullPage: true });
  });

  test("input-variant-mild", async ({ page }) => {
    await openSeeded(page, "/?tab=input", null);
    await page.getByTestId("vital-temp-select").selectOption("37.2");
    await expect(page.getByTestId("temp-status-chip")).toHaveText("微熱");
    await expect(page).toHaveScreenshot("input-variant-mild.png", { fullPage: true });
  });

  test("input-variant-low", async ({ page }) => {
    await openSeeded(page, "/?tab=input", null);
    await page.getByTestId("vital-temp-select").selectOption("34.0");
    await page.getByTestId("vital-bp-sys").fill("85");
    await page.getByTestId("vital-pulse").fill("50");
    await page.getByTestId("vital-weight").fill("40");
    await expect(page.getByTestId("temp-status-chip")).toHaveText("低体温");
    await expect(page).toHaveScreenshot("input-variant-low.png", { fullPage: true });
  });
});

test.describe("視覚回帰: meds", () => {
  test("meds-seeded", async ({ page }) => {
    await openSeeded(page, "/?tab=meds");
    await expect(page).toHaveScreenshot("meds-seeded.png", { fullPage: true });
  });

  test("meds-master", async ({ page }) => {
    await openSeeded(page, "/?tab=meds");
    await page.getByTestId("toggle-master").click();
    await expect(page.getByTestId("add-medicine")).toBeVisible();
    await expect(page).toHaveScreenshot("meds-master.png", { fullPage: true });
  });
});

test.describe("視覚回帰: history", () => {
  test("history-water", async ({ page }) => {
    await openSeeded(page, "/?tab=history&sub=water");
    await expect(page).toHaveScreenshot("history-water.png", { fullPage: true });
  });

  test("history-water-open", async ({ page }) => {
    await openSeeded(page, "/?tab=history&sub=water");
    await page.getByTestId("hour-row-15").click();
    await expect(page.getByTestId("intake-item").first()).toBeVisible();
    await expect(page).toHaveScreenshot("history-water-open.png", { fullPage: true });
  });

  test("history-vital-open", async ({ page }) => {
    await openSeeded(page, "/?tab=history&sub=vital");
    await page.getByTestId("vital-hour-row-15").click();
    await expect(page.getByTestId("vital-item").first()).toBeVisible();
    await expect(page).toHaveScreenshot("history-vital-open.png", { fullPage: true });
  });

  test("history-vital-empty", async ({ page }) => {
    await openSeeded(page, "/?tab=history&sub=vital", null);
    await expect(page.getByTestId("vital-hist-empty")).toBeVisible();
    await expect(page).toHaveScreenshot("history-vital-empty.png", { fullPage: true });
  });

  test("history-meds-ng", async ({ page }) => {
    await openSeeded(page, "/?tab=history&sub=meds");
    await page.getByTestId("meds-hour-row-8").click();
    await expect(page.getByTestId("med-check-item").first()).toBeVisible();
    await expect(page).toHaveScreenshot("history-meds-ng.png", { fullPage: true });
  });

  test("history-meds-ok", async ({ page }) => {
    await openSeeded(page, "/?tab=history&sub=meds", ALL_CHECKED_SEED);
    await expect(page.getByTestId("meds-result-card")).toHaveAttribute("data-ok", "true");
    await expect(page).toHaveScreenshot("history-meds-ok.png", { fullPage: true });
  });
});

test.describe("視覚回帰: シート", () => {
  test("edit-sheet-ml", async ({ page }) => {
    await openSeeded(page, "/?tab=history&sub=water");
    await page.getByTestId("hour-row-15").click();
    await page
      .getByTestId("intake-item")
      .nth(0)
      .getByRole("button", { name: "なおす" })
      .click();
    await expect(page.getByTestId("edit-sheet")).toBeVisible();
    await expect(page).toHaveScreenshot("edit-sheet-ml.png");
  });

  test("edit-sheet-vital", async ({ page }) => {
    await openSeeded(page, "/?tab=history&sub=vital");
    await page.getByTestId("vital-hour-row-15").click();
    await page
      .getByTestId("vital-item")
      .nth(0)
      .getByRole("button", { name: "なおす" })
      .click();
    await expect(page.getByTestId("edit-sheet")).toBeVisible();
    await expect(page).toHaveScreenshot("edit-sheet-vital.png");
  });
});
