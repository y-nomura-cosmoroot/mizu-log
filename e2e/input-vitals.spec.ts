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

    await page.getByTestId("vital-temp-select").selectOption("34.0");
    await expect(body).toHaveAttribute("data-fever", "low");
    await expect(page.getByTestId("temp-status-chip")).toHaveText("低体温");

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

  test("(i-5) 体重で人体SVGの体型が変わる（45kg以下=細い/65kg以上=太い）", async ({
    page,
  }) => {
    await openApp(page, undefined, "/?tab=input");

    const body = page.getByTestId("body-figure");
    await expect(body).toHaveAttribute("data-build", "none");

    await page.getByTestId("vital-weight").fill("40");
    await expect(body).toHaveAttribute("data-build", "thin");

    await page.getByTestId("vital-weight").fill("55");
    await expect(body).toHaveAttribute("data-build", "normal");

    await page.getByTestId("vital-weight").fill("70");
    await expect(body).toHaveAttribute("data-build", "heavy");
  });

  test("(i-6) エフェクトは記録後も持続する（その日の最新記録の値で判定）", async ({
    page,
  }) => {
    await openApp(page, undefined, "/?tab=input");
    const body = page.getByTestId("body-figure");

    // 高熱+太い体重を記録 → 入力欄はクリアされるがエフェクトは持続
    await page.getByTestId("vital-temp-select").selectOption("38.5");
    await page.getByTestId("vital-weight").fill("70");
    await page.getByTestId("vital-save").click();
    await expect(page.getByTestId("vital-temp-select")).toHaveValue("");
    await expect(body).toHaveAttribute("data-fever", "high");
    await expect(body).toHaveAttribute("data-build", "heavy");
    // チップもシルエット同様、その日の最新記録から持続表示される
    await expect(page.getByTestId("temp-status-chip")).toHaveText("高熱");

    // リロードしても持続（localStorageの記録から判定）
    await page.reload();
    await expect(body).toHaveAttribute("data-fever", "high");
    await expect(body).toHaveAttribute("data-build", "heavy");

    // 入力中の値は記録より優先される
    await page.getByTestId("vital-temp-select").selectOption("36.5");
    await expect(body).toHaveAttribute("data-fever", "normal");

    // 記録の無い前日に移動するとデフォルトに戻る
    await page.getByTestId("vital-temp-select").selectOption("");
    await page.getByTestId("prev-day").click();
    await expect(body).toHaveAttribute("data-fever", "none");
    await expect(body).toHaveAttribute("data-build", "none");
  });

  test("(i-7) 脈拍で心臓が変化する（常時表示・高い=効果線・低い=青・持続）", async ({
    page,
  }) => {
    await openApp(page, undefined, "/?tab=input");

    const body = page.getByTestId("body-figure");
    const heart = page.getByTestId("heart");

    // 未入力でも心臓は表示され、通常の心拍で拍動（レベルはnone・効果線なし・赤）
    await expect(heart).toBeVisible();
    await expect(body).toHaveAttribute("data-pulse", "none");
    await expect(page.getByTestId("heart-effect-lines")).toHaveCount(0);
    expect(await heart.locator("path").getAttribute("fill")).toBe("#e0484f");

    // 高い(100超): 効果線が出る
    await page.getByTestId("vital-pulse").fill("120");
    await expect(body).toHaveAttribute("data-pulse", "high");
    await expect(page.getByTestId("heart-effect-lines")).toBeVisible();

    // 低い(60未満): 心臓が青くなり効果線は消える
    await page.getByTestId("vital-pulse").fill("50");
    await expect(body).toHaveAttribute("data-pulse", "low");
    await expect(page.getByTestId("heart-effect-lines")).toHaveCount(0);
    expect(await heart.locator("path").getAttribute("fill")).toBe("#4a90d9");

    // 通常(60〜100): 赤に戻る
    await page.getByTestId("vital-pulse").fill("70");
    await expect(body).toHaveAttribute("data-pulse", "normal");
    expect(await heart.locator("path").getAttribute("fill")).toBe("#e0484f");

    // 記録後も持続し、リロードしても保たれる
    await page.getByTestId("vital-pulse").fill("120");
    await page.getByTestId("vital-save").click();
    await expect(page.getByTestId("vital-pulse")).toHaveValue("");
    await expect(body).toHaveAttribute("data-pulse", "high");
    await page.reload();
    await expect(body).toHaveAttribute("data-pulse", "high");

    // 記録の無い前日ではnoneに戻る（心臓自体は表示されたまま）
    await page.getByTestId("prev-day").click();
    await expect(body).toHaveAttribute("data-pulse", "none");
    await expect(heart).toBeVisible();
  });

  test("(i-8) 血圧で腕の血管とめまいエフェクトが変化する", async ({ page }) => {
    await openApp(page, undefined, "/?tab=input");

    const body = page.getByTestId("body-figure");
    await expect(body).toHaveAttribute("data-bp", "none");
    await expect(page.getByTestId("bp-veins")).toHaveCount(0);
    await expect(page.getByTestId("dizzy-marks")).toHaveCount(0);

    // 高血圧(140以上): 腕に血管が浮き出る（点滅）
    await page.getByTestId("vital-bp-sys").fill("150");
    await expect(body).toHaveAttribute("data-bp", "high");
    await expect(page.getByTestId("bp-veins")).toBeVisible();
    await expect(page.getByTestId("dizzy-marks")).toHaveCount(0);

    // 低血圧(90未満): めまいの渦巻きマーク
    await page.getByTestId("vital-bp-sys").fill("85");
    await expect(body).toHaveAttribute("data-bp", "low");
    await expect(page.getByTestId("dizzy-marks")).toBeVisible();
    await expect(page.getByTestId("bp-veins")).toHaveCount(0);

    // 通常(90〜139): どちらも消える
    await page.getByTestId("vital-bp-sys").fill("120");
    await expect(body).toHaveAttribute("data-bp", "normal");
    await expect(page.getByTestId("bp-veins")).toHaveCount(0);
    await expect(page.getByTestId("dizzy-marks")).toHaveCount(0);

    // 記録後も持続し、リロードしても保たれる
    await page.getByTestId("vital-bp-sys").fill("150");
    await page.getByTestId("vital-bp-dia").fill("95");
    await page.getByTestId("vital-save").click();
    await expect(page.getByTestId("vital-bp-sys")).toHaveValue("");
    await expect(body).toHaveAttribute("data-bp", "high");
    await page.reload();
    await expect(body).toHaveAttribute("data-bp", "high");
    await expect(page.getByTestId("bp-veins")).toBeVisible();

    // 記録の無い前日ではnoneに戻る
    await page.getByTestId("prev-day").click();
    await expect(body).toHaveAttribute("data-bp", "none");
  });

  test("(i-4) 部分入力を複数回記録しても、履歴の時間行に全項目が統合表示される（バグ報告の再現）", async ({
    page,
  }) => {
    await openApp(page, undefined, "/?tab=input");

    // 1回目: 体温 + 体重 だけ記録
    await page.getByTestId("vital-temp-select").selectOption("34.0");
    await page.getByTestId("vital-weight").fill("68");
    await page.getByTestId("vital-save").click();

    // 2回目: 血圧 + 脈拍 だけ記録
    await page.getByTestId("vital-bp-sys").fill("119");
    await page.getByTestId("vital-bp-dia").fill("75");
    await page.getByTestId("vital-pulse").fill("77");
    await page.getByTestId("vital-save").click();

    // 履歴>バイタル: 時間行サマリに4項目すべてが統合表示される
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-vital").click();
    const row = page.getByTestId("vital-hour-row-15");
    await expect(row).toContainText("34.0℃");
    await expect(row).toContainText("68kg");
    await expect(row).toContainText("119/75");
    await expect(row).toContainText("77");
    await expect(row).toContainText("2件");

    // 展開すると個別の2レコードが残っている
    await row.click();
    await expect(page.getByTestId("vital-item")).toHaveCount(2);

    // さらに体温だけ記録 → サマリの体温は最新値に更新、他項目は維持される
    await page.getByTestId("nav-input").click();
    await page.getByTestId("vital-temp-select").selectOption("36.5");
    await page.getByTestId("vital-save").click();
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-vital").click();
    await expect(row).toContainText("36.5℃");
    await expect(row).not.toContainText("34.0℃");
    await expect(row).toContainText("68kg");
    await expect(row).toContainText("119/75");
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
