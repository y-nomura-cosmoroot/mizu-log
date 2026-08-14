import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test.describe("ホーム: 飲水・尿量のクイック記録", () => {
  test("(a) クイック記録がこの時間/日合計/帯小計/トーストに反映され、飲水と尿量は独立集計", async ({
    page,
  }) => {
    await openApp(page);

    // 初期状態
    await expect(page.getByTestId("water-hour-ml")).toHaveText("0ml");
    await expect(page.getByTestId("water-day-total")).toHaveText("0ml");

    // 飲水 +150
    await page.getByTestId("quick-water-150").click();
    await expect(page.getByTestId("toast")).toHaveText("飲水 +150ml をきろくしました");
    await expect(page.getByTestId("water-hour-ml")).toHaveText("150ml");
    await expect(page.getByTestId("water-day-total")).toHaveText("150ml");
    await expect(page.getByTestId("subtotal-w1")).toHaveText("150"); // 15時=帯1
    await expect(page.getByTestId("subtotal-wt")).toHaveText("150");

    // 尿量 +100（飲水側は変わらない）
    await page.getByTestId("quick-urine-100").click();
    await expect(page.getByTestId("toast")).toHaveText("尿量 +100ml をきろくしました");
    await expect(page.getByTestId("urine-hour-ml")).toHaveText("100ml");
    await expect(page.getByTestId("urine-day-total")).toHaveText("100ml");
    await expect(page.getByTestId("subtotal-u1")).toHaveText("100");
    await expect(page.getByTestId("water-day-total")).toHaveText("150ml");
  });

  test("(b) 同一時間内の複数回入力は合算表示、履歴には個別記録が残る", async ({ page }) => {
    await openApp(page);

    await page.getByTestId("quick-water-150").click();
    await page.getByTestId("quick-water-100").click();

    // 合算される
    await expect(page.getByTestId("water-hour-ml")).toHaveText("250ml");
    await expect(page.getByTestId("water-day-total")).toHaveText("250ml");

    // 履歴には個別の2件
    await page.getByTestId("nav-history").click();
    await expect(page.getByTestId("hour-w-15")).toHaveText("250ml");
    await expect(page.getByTestId("hour-row-15")).toContainText("2件");
    await page.getByTestId("hour-row-15").click();
    const items = page.getByTestId("intake-item");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("150");
    await expect(items.nth(1)).toContainText("100");
  });

  test("自由入力からも記録できる", async ({ page }) => {
    await openApp(page);

    await page.getByTestId("custom-water-input").fill("320");
    await page.getByTestId("custom-water-add").click();
    await expect(page.getByTestId("water-hour-ml")).toHaveText("320ml");
    await expect(page.getByTestId("water-day-total")).toHaveText("320ml");
  });
});
