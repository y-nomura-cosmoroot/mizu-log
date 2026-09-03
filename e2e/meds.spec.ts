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
    // 追加したタイミングの曜日は既定で全曜日ON（表示先頭の月=1 と末尾の日=0 で確認）
    await expect(page.getByTestId("timing-weekday-ねる前-1")).toHaveAttribute("data-on", "true");
    await expect(page.getByTestId("timing-weekday-ねる前-0")).toHaveAttribute("data-on", "true");
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

  // T0 = 2026-08-14 は金曜（曜日索引 5）。以下の曜日テストはこれに依存する
  test("(f-4) 曜日指定: 金をOFFにした昼は当日(金)の行が薄色・分母外・バナー外になり、木曜表示では有効のまま", async ({
    page,
  }) => {
    await openApp(page, undefined, "/?tab=meds");

    // 先に昼をチェックしておく（対象外になった後も ✓ で解除だけできることを確かめる）
    await page.getByTestId("drank-btn-昼").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("1 / 3 かんりょう");

    // マスタ: 昼の曜日チップは 月火水木金土日 の順に7つ、全部ON
    await page.getByTestId("toggle-master").click();
    const lunchChips = page.locator('[data-testid^="timing-weekday-昼-"]');
    await expect(lunchChips).toHaveText(["月", "火", "水", "木", "金", "土", "日"]);
    for (const wd of [1, 2, 3, 4, 5, 6, 0]) {
      await expect(page.getByTestId(`timing-weekday-昼-${wd}`)).toHaveAttribute("data-on", "true");
    }

    // 金(5)をOFF
    await page.getByTestId("timing-weekday-昼-5").click();
    await expect(page.getByTestId("timing-weekday-昼-5")).toHaveAttribute("data-on", "false");

    // チェックモード: 昼の行は薄色・「のんだ！」なし。チェック済みなので ✓ だけ出る
    await page.getByTestId("toggle-master").click();
    const lunchRow = page.getByTestId("timing-row-昼");
    await expect(lunchRow).toHaveAttribute("data-inactive", "true");
    // 「きょうは 金よう日だから のまない日」+ マスタと同じチップ（金=OFF・表示中の日、他はON）
    const lunchDay = page.getByTestId("timing-day-label-昼");
    await expect(lunchDay).toContainText("きょうは");
    await expect(lunchDay).toContainText("金よう日");
    await expect(lunchDay).toContainText("のまない日");
    await expect(lunchDay).toHaveAttribute("data-on", "false");
    await expect(page.getByTestId("timing-row-weekday-昼-5")).toHaveAttribute("data-on", "false");
    await expect(page.getByTestId("timing-row-weekday-昼-5")).toHaveAttribute(
      "data-today",
      "true"
    );
    await expect(page.getByTestId("timing-row-weekday-昼-1")).toHaveAttribute("data-on", "true");
    await expect(page.locator('[data-testid^="timing-row-weekday-昼-"]')).toHaveText([
      "月",
      "火",
      "水",
      "木",
      "金",
      "土",
      "日",
    ]);
    // 毎日のタイミング（朝）: 「まいにちのむ」だけを出し、全部ONのチップは出さない
    await expect(page.getByTestId("timing-day-label-朝")).toHaveText("まいにちのむ");
    await expect(page.getByTestId("timing-day-label-朝")).toHaveAttribute("data-on", "true");
    await expect(page.locator('[data-testid^="timing-row-weekday-朝-"]')).toHaveCount(0);
    await expect(page.getByTestId("drank-btn-昼")).toHaveCount(0);
    await expect(page.getByTestId("timing-check-昼")).toBeVisible();
    await expect(page.getByTestId("timing-check-昼")).toHaveText("✓");

    // ✓ で解除 → 未チェックかつ対象外なのでボタンは何も出ない。分母は 朝・晩 の2つ
    await page.getByTestId("timing-check-昼").click();
    await expect(lunchRow).toHaveAttribute("data-inactive", "true");
    await expect(page.getByTestId("timing-check-昼")).toHaveCount(0);
    await expect(page.getByTestId("drank-btn-昼")).toHaveCount(0);
    await expect(page.getByTestId("meds-progress")).toHaveText("0 / 2 かんりょう");

    // home: バナーは 朝・晩 だけ（昼は飲み忘れ判定から外れる）
    await page.getByTestId("nav-home").click();
    await expect(page.getByTestId("med-alert-banner")).toContainText("朝・晩 がまだです");

    // ‹ で 8/13(木): 昼は有効のまま → 0 / 3
    await page.getByTestId("prev-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/13(木)");
    await page.getByTestId("nav-meds").click();
    await expect(page.getByTestId("timing-row-昼")).toHaveAttribute("data-inactive", "false");
    await expect(page.getByTestId("drank-btn-昼")).toBeVisible();
    await expect(page.getByTestId("meds-progress")).toHaveText("0 / 3 かんりょう");
    // 木曜は対象なので「木よう日だから のむ日」。きょう(8/14)ではないので「きょうは」は付かない
    await expect(page.getByTestId("timing-day-label-昼")).toContainText("木よう日");
    await expect(page.getByTestId("timing-day-label-昼")).toContainText("のむ日");
    await expect(page.getByTestId("timing-day-label-昼")).not.toContainText("きょうは");
    await expect(page.getByTestId("timing-day-label-昼")).toHaveAttribute("data-on", "true");
    await expect(page.getByTestId("timing-row-weekday-昼-4")).toHaveAttribute("data-today", "true");
    await expect(page.getByTestId("timing-row-weekday-昼-4")).toHaveAttribute("data-on", "true");

    // › で 8/14(金) に戻り 朝・晩 をチェック → 2 / 2
    await page.getByTestId("next-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await page.getByTestId("drank-btn-朝").click();
    await page.getByTestId("drank-btn-晩").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("2 / 2 かんりょう");

    // home のバナーが消える
    await page.getByTestId("nav-home").click();
    await expect(page.getByTestId("water-day-total")).toBeVisible();
    await expect(page.getByTestId("med-alert-banner")).toHaveCount(0);

    // 履歴>おくすり: 飲み忘れなし。月ごと一覧の 8/14 行は記録あり扱いだが ⚠️ は付かない
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-meds").click();
    await expect(page.getByTestId("meds-result-card")).toHaveAttribute("data-ok", "true");
    await page.getByTestId("toggle-monthly").click();
    const dayRow = page.getByTestId("month-row-2026-08-14");
    await expect(dayRow).toBeVisible();
    await expect(dayRow).not.toContainText("記録なし");
    await expect(dayRow).not.toContainText("⚠️");

    // localStorage: version 3、昼の weekdays から 5 だけ抜けている（昇順）
    const raw = await page.evaluate(() => localStorage.getItem("mizu-log"));
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(3);
    expect(parsed.state.timings[1]).toEqual({ name: "昼", weekdays: [0, 1, 2, 3, 4, 6] });

    // リロード後も維持。金をONに戻すと昼が対象に復帰して 2 / 3
    await page.reload();
    await expect(page.getByTestId("date-label")).toBeVisible();
    await page.getByTestId("nav-meds").click();
    await page.getByTestId("toggle-master").click();
    await expect(page.getByTestId("timing-weekday-昼-5")).toHaveAttribute("data-on", "false");
    await page.getByTestId("timing-weekday-昼-5").click();
    await expect(page.getByTestId("timing-weekday-昼-5")).toHaveAttribute("data-on", "true");
    await page.getByTestId("toggle-master").click();
    await expect(page.getByTestId("drank-btn-昼")).toBeVisible();
    await expect(page.getByTestId("meds-progress")).toHaveText("2 / 3 かんりょう");
  });

  test("(f-5) 飲むタイミングが無い日: 朝昼晩の金をOFF → 空の日メッセージ・0 / 0・バナーなし・履歴カード「のむおくすりの ない日」", async ({
    page,
  }) => {
    await openApp(page, undefined, "/?tab=meds");

    // マスタで 朝・昼・晩 すべての金(5)をOFF（各6曜日残るので下限には触れない）
    await page.getByTestId("toggle-master").click();
    for (const name of ["朝", "昼", "晩"]) {
      await page.getByTestId(`timing-weekday-${name}-5`).click();
      await expect(page.getByTestId(`timing-weekday-${name}-5`)).toHaveAttribute("data-on", "false");
    }

    // チェックモード: 空の日メッセージ・0 / 0・全行が対象外
    await page.getByTestId("toggle-master").click();
    await expect(page.getByTestId("meds-empty-note")).toBeVisible();
    await expect(page.getByTestId("meds-empty-note")).toContainText("のむおくすりが ありません");
    await expect(page.getByTestId("meds-progress")).toHaveText("0 / 0 かんりょう");
    for (const name of ["朝", "昼", "晩"]) {
      await expect(page.getByTestId(`timing-day-label-${name}`)).toContainText("金よう日");
      await expect(page.getByTestId(`timing-day-label-${name}`)).toContainText("のまない日");
      await expect(page.getByTestId(`timing-row-${name}`)).toHaveAttribute("data-inactive", "true");
      await expect(page.getByTestId(`drank-btn-${name}`)).toHaveCount(0);
    }

    // home: 飲み忘れバナーは出ない
    await page.getByTestId("nav-home").click();
    await expect(page.getByTestId("water-day-total")).toBeVisible();
    await expect(page.getByTestId("med-alert-banner")).toHaveCount(0);

    // 履歴>おくすり: 🎉 ではなく「のむおくすりの ない日」（data-ok は true のまま）
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-meds").click();
    const card = page.getByTestId("meds-result-card");
    await expect(card).toHaveAttribute("data-ok", "true");
    await expect(card).toContainText("のむおくすりの ない日");
    await expect(card).toContainText("この日は のむおくすりが ありません");
  });

  test("(f-6) 曜日は最低1つ: 最後の曜日はOFFにできずトーストが出る", async ({ page }) => {
    await openApp(page, undefined, "/?tab=meds");
    await page.getByTestId("toggle-master").click();

    // 朝の 金(5) 以外を全部OFF
    for (const wd of [1, 2, 3, 4, 6, 0]) {
      await page.getByTestId(`timing-weekday-朝-${wd}`).click();
      await expect(page.getByTestId(`timing-weekday-朝-${wd}`)).toHaveAttribute("data-on", "false");
    }
    await expect(page.getByTestId("timing-weekday-朝-5")).toHaveAttribute("data-on", "true");

    // 最後の 金 をタップしても外れず、理由がトーストで出る
    await page.getByTestId("timing-weekday-朝-5").click();
    await expect(page.getByTestId("toast")).toContainText("1つ以上");
    await expect(page.getByTestId("timing-weekday-朝-5")).toHaveAttribute("data-on", "true");

    // 当日(金)は朝が有効のままなので分母は変わらない
    await page.getByTestId("toggle-master").click();
    await expect(page.getByTestId("timing-row-朝")).toHaveAttribute("data-inactive", "false");
    await expect(page.getByTestId("meds-progress")).toHaveText("0 / 3 かんりょう");
  });
});
