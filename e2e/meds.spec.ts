import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test.describe("おくすり: マスタ編集・チェック・アラート", () => {
  test("(f-1) マスタ編集: 薬追加・タグON・タイミング追加・並び替え→チェックモードに反映", async ({
    page,
  }) => {
    await openApp(page, undefined, "/?tab=meds");

    await expect(page.getByTestId("meds-progress")).toHaveText("0 / 3 かんりょう");

    // マスタ編集モードへ
    await page.getByTestId("toggle-master").click();

    // 薬を追加して名前・量(数値)・単位(プルダウン)・タイミングタグを設定
    await page.getByTestId("add-medicine").click();
    await page.getByTestId("med-name-0").fill("グラセプター");
    await page.getByTestId("med-dose-0").fill("1");
    await page.getByTestId("med-unit-0").selectOption("mg");
    await page.getByTestId("med-tag-0-朝").click();
    await page.getByTestId("med-tag-0-晩").click();

    // タイミング「ねる前」を追加して1つ上へ
    await page.getByTestId("new-timing-input").fill("ねる前");
    await page.getByTestId("add-timing").click();
    await expect(page.getByTestId("timing-master-row-ねる前")).toBeVisible();
    await page.getByTestId("timing-up-ねる前").click();

    // チェックモードへ戻る → 薬名ラベルと4タイミング
    await page.getByTestId("toggle-master").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("0 / 4 かんりょう");
    await expect(page.getByTestId("timing-row-朝")).toContainText("グラセプター 1mg");
    await expect(page.getByTestId("timing-row-晩")).toContainText("グラセプター 1mg");
    await expect(page.getByTestId("timing-row-昼")).toContainText("（くすりの登録なし）");
  });

  test("(f-2) 全チェック→バナー消灯→履歴に実績と🎉カード、解除で再点灯", async ({
    page,
  }) => {
    await openApp(page);

    // homeに飲み忘れバナー
    await expect(page.getByTestId("med-alert-banner")).toBeVisible();
    await expect(page.getByTestId("med-alert-banner")).toContainText("飲み忘れあり！");
    await expect(page.getByTestId("med-alert-banner")).toContainText(
      "朝・昼・晩 がまだです"
    );

    // バナータップでおくすりタブへ
    await page.getByTestId("med-alert-banner").click();
    await expect(page.getByTestId("meds-progress")).toBeVisible();

    // 全タイミングをチェック
    await page.getByTestId("drank-btn-朝").click();
    await page.getByTestId("drank-btn-昼").click();
    await page.getByTestId("drank-btn-晩").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("3 / 3 かんりょう");

    // homeのバナーが消える
    await page.getByTestId("nav-home").click();
    await expect(page.getByTestId("med-alert-banner")).toHaveCount(0);

    // 履歴>おくすり: 15時に実績、🎉カード
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-meds").click();
    await expect(page.getByTestId("meds-hour-row-15")).toContainText("朝 ・ 昼 ・ 晩");
    await expect(page.getByTestId("meds-result-card")).toHaveAttribute("data-ok", "true");
    await expect(page.getByTestId("meds-result-card")).toContainText("飲み忘れなし！");

    // チェック解除でアラート再点灯
    await page.getByTestId("nav-meds").click();
    await page.getByTestId("timing-check-朝").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("2 / 3 かんりょう");
    await page.getByTestId("nav-home").click();
    await expect(page.getByTestId("med-alert-banner")).toBeVisible();
    await expect(page.getByTestId("med-alert-banner")).toContainText("朝 がまだです");
  });

  test("(f-3) タイミング削除で薬のタグからも消え、判定からも外れる", async ({ page }) => {
    await openApp(page, undefined, "/?tab=meds");

    // 薬を追加して朝タグON
    await page.getByTestId("toggle-master").click();
    await page.getByTestId("add-medicine").click();
    await page.getByTestId("med-name-0").fill("テスト薬");
    await page.getByTestId("med-tag-0-朝").click();

    // タイミング「朝」を削除
    await page.getByTestId("timing-del-朝").click();
    await expect(page.getByTestId("timing-master-row-朝")).toHaveCount(0);
    // 薬のタグ一覧からも「朝」が消える
    await expect(page.getByTestId("med-tag-0-朝")).toHaveCount(0);

    // チェックモード: 朝の行が無くなり 0 / 2
    await page.getByTestId("toggle-master").click();
    await expect(page.getByTestId("timing-row-朝")).toHaveCount(0);
    await expect(page.getByTestId("meds-progress")).toHaveText("0 / 2 かんりょう");
  });
});
