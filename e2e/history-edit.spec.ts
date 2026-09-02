import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test.describe("履歴: 編集・削除", () => {
  test("(e) なおす→±10ステッパー→全集計が更新される", async ({ page }) => {
    await openApp(page);

    await page.getByTestId("quick-water-150").click();
    await page.getByTestId("quick-water-100").click();

    await page.getByTestId("nav-history").click();
    await page.getByTestId("hour-row-15").click();

    // 1件目(150ml)を「なおす」→ +10×2 = 170
    await page
      .getByTestId("intake-item")
      .nth(0)
      .getByRole("button", { name: "なおす" })
      .click();
    await expect(page.getByTestId("edit-sheet")).toBeVisible();
    await expect(page.getByTestId("sheet-ml")).toContainText("150");
    await page.getByTestId("sheet-inc").click();
    await page.getByTestId("sheet-inc").click();
    await expect(page.getByTestId("sheet-ml")).toContainText("170");
    await page.getByTestId("sheet-save").click();

    await expect(page.getByTestId("toast")).toHaveText("なおしました");
    await expect(page.getByTestId("hour-w-15")).toHaveText("270ml");
    await expect(page.getByTestId("band-w2")).toHaveText("270ml"); // 15時=帯2
    await expect(page.getByTestId("day-total-water")).toHaveText("270ml");
  });

  test("「やめる」では値が変わらない", async ({ page }) => {
    await openApp(page);
    await page.getByTestId("quick-water-150").click();

    await page.getByTestId("nav-history").click();
    await page.getByTestId("hour-row-15").click();
    await page
      .getByTestId("intake-item")
      .nth(0)
      .getByRole("button", { name: "なおす" })
      .click();
    await page.getByTestId("sheet-inc").click();
    await page.getByTestId("sheet-cancel").click();

    await expect(page.getByTestId("edit-sheet")).toHaveCount(0);
    await expect(page.getByTestId("hour-w-15")).toHaveText("150ml");
    await expect(page.getByTestId("day-total-water")).toHaveText("150ml");
  });

  test("けす→件数と合計が再計算される", async ({ page }) => {
    await openApp(page);
    await page.getByTestId("quick-water-150").click();
    await page.getByTestId("quick-water-100").click();

    await page.getByTestId("nav-history").click();
    await page.getByTestId("hour-row-15").click();
    await page
      .getByTestId("intake-item")
      .nth(0)
      .getByRole("button", { name: "けす" })
      .click();

    await expect(page.getByTestId("toast")).toHaveText("けしました");
    await expect(page.getByTestId("intake-item")).toHaveCount(1);
    await expect(page.getByTestId("hour-row-15")).toContainText("1件");
    await expect(page.getByTestId("hour-w-15")).toHaveText("100ml");
    await expect(page.getByTestId("day-total-water")).toHaveText("100ml");
  });
});
