import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test.describe("バイタル入力・便・食事", () => {
  test("(i-1) 全項目空のまま記録→拒否トースト", async ({ page }) => {
    await openApp(page, undefined, "/?tab=input");

    await page.getByTestId("vital-save").click();
    await expect(page.getByTestId("toast")).toHaveText("どれか1つ入れてね");

    // 記録は作られていない
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-vital").click();
    await expect(page.getByTestId("vital-hist-empty")).toBeVisible();
  });

  test("(i-2) 体温で人体SVGの色状態とチップが変わる", async ({ page }) => {
    await openApp(page, undefined, "/?tab=input");

    const body = page.getByTestId("body-figure");
    await expect(body).toHaveAttribute("data-fever", "none");

    await page.getByTestId("vital-temp-select").selectOption("36.5");
    await expect(body).toHaveAttribute("data-fever", "normal");
    await expect(page.getByTestId("temp-status-chip")).toHaveText("平熱");

    await page.getByTestId("vital-temp-select").selectOption("37.2");
    await expect(body).toHaveAttribute("data-fever", "mild");
    await expect(page.getByTestId("temp-status-chip")).toHaveText("微熱");

    await page.getByTestId("vital-temp-select").selectOption("38.5");
    await expect(body).toHaveAttribute("data-fever", "high");
    await expect(page.getByTestId("temp-status-chip")).toHaveText("高熱");
  });

  test("(i-3) バイタル保存→直近表示・入力クリア・履歴反映・なおすシート", async ({
    page,
  }) => {
    await openApp(page, undefined, "/?tab=input");

    await page.getByTestId("vital-temp-select").selectOption("38.5");
    await page.getByTestId("vital-bp-sys").fill("126");
    await page.getByTestId("vital-bp-dia").fill("80");
    await page.getByTestId("vital-pulse").fill("76");
    await page.getByTestId("vital-save").click();

    await expect(page.getByTestId("toast")).toHaveText("バイタルをきろくしました");
    // 直近表示（体温・血圧・脈拍の3項目分）と入力クリア
    await expect(page.getByText("15時の記録")).toHaveCount(3);
    await expect(page.getByTestId("vital-temp-select")).toHaveValue("");
    await expect(page.getByTestId("vital-bp-sys")).toHaveValue("");

    // 履歴>バイタル: 15時行にサマリ表示
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-vital").click();
    await expect(page.getByTestId("vital-hour-row-15")).toContainText("38.5℃");
    await expect(page.getByTestId("vital-hour-row-15")).toContainText("126/80");

    // なおすシートで体温を36.9へ変更
    await page.getByTestId("vital-hour-row-15").click();
    await page
      .getByTestId("vital-item")
      .first()
      .getByRole("button", { name: "なおす" })
      .click();
    await expect(page.getByTestId("edit-sheet")).toBeVisible();
    await page.getByTestId("sheet-temp").selectOption("36.9");
    await page.getByTestId("sheet-save").click();
    await expect(page.getByTestId("toast")).toHaveText("なおしました");
    await expect(page.getByTestId("vital-hour-row-15")).toContainText("36.9℃");
  });

  test("(h) 便・食事の複数回記録と1件だけ削除", async ({ page }) => {
    await openApp(page, undefined, "/?tab=input");

    await page.getByTestId("add-stool").click();
    await page.getByTestId("add-stool").click();
    await page.getByTestId("add-meal").click();

    await expect(page.getByTestId("add-stool")).toContainText("便があった（2回）");
    await expect(page.getByTestId("add-meal")).toContainText("食事をした（1回）");

    // 履歴>バイタル: 15時行に💩2回・🍴1回
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-vital").click();
    await expect(page.getByTestId("vital-hour-row-15")).toContainText("2回");
    await page.getByTestId("vital-hour-row-15").click();
    await expect(page.getByTestId("flag-item")).toHaveCount(3);

    // 1件だけ削除
    await page
      .getByTestId("flag-item")
      .first()
      .getByRole("button", { name: "けす" })
      .click();
    await expect(page.getByTestId("toast")).toHaveText("けしました");
    await expect(page.getByTestId("flag-item")).toHaveCount(2);

    // inputタブのカウントも減っている
    await page.getByTestId("nav-input").click();
    await expect(page.getByTestId("add-stool")).toContainText("便があった（1回）");
  });
});
