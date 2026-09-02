import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test.describe("時刻・日付ナビゲーション", () => {
  test("(c-1) 過去時刻への記録: ‹›ステップと時刻ドロップダウン、帯への計上", async ({
    page,
  }) => {
    await openApp(page); // 15時

    // ‹ で14時へ → +200
    await page.getByTestId("sel-hour-prev").click();
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("14時");
    await page.getByTestId("quick-water-200").click();
    await expect(page.getByTestId("water-hour-ml")).toHaveText("200ml");

    // › で15時へ戻すと「この時間」は0、日合計は200のまま
    await page.getByTestId("sel-hour-next").click();
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("15時");
    await expect(page.getByTestId("water-hour-ml")).toHaveText("0ml");
    await expect(page.getByTestId("water-day-total")).toHaveText("200ml");

    // ドロップダウンは 0〜23時 の1ブロック（記録日=暦日。「よくじつ」セクションは無い）
    await page.getByTestId("sel-hour-toggle").click();
    await expect(page.getByTestId("hour-dropdown")).toBeVisible();
    await expect(page.getByTestId("hour-dropdown")).toContainText("きょう");
    await expect(page.getByTestId("hour-dropdown")).not.toContainText("よくじつ");
    await expect(page.getByTestId("hour-chip-0")).toBeVisible();
    await expect(page.getByTestId("hour-chip-23")).toBeVisible();

    // 3時を選択 → 帯1に計上される（14時の200は帯2）
    await page.getByTestId("hour-chip-3").click();
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("3時");
    await page.getByTestId("quick-water-50").click();
    await expect(page.getByTestId("subtotal-w1")).toHaveText("50"); // 3時=帯1
    await expect(page.getByTestId("subtotal-w2")).toHaveText("200"); // 14時=帯2
    await expect(page.getByTestId("subtotal-w3")).toHaveText("—");
    await expect(page.getByTestId("subtotal-wt")).toHaveText("250");

    // 0時で ‹ → 同じ日の23時に回り込む（日付は変わらない）→ 帯3に計上
    await page.getByTestId("sel-hour-toggle").click();
    await page.getByTestId("hour-chip-0").click();
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("0時");
    await page.getByTestId("sel-hour-prev").click();
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("23時");
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await page.getByTestId("quick-water-100").click();
    await expect(page.getByTestId("subtotal-w3")).toHaveText("100"); // 23時=帯3
    await expect(page.getByTestId("subtotal-wt")).toHaveText("350");
  });

  test("(c-2) 過去日付への記録: ‹で前日、›で今日より先へは進めない", async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");

    // 前日へ → 記録
    await page.getByTestId("prev-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/13(木)");
    await page.getByTestId("quick-water-100").click();
    await expect(page.getByTestId("water-day-total")).toHaveText("100ml");

    // 今日へ戻る → 前日分は含まれない
    await page.getByTestId("next-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await expect(page.getByTestId("water-day-total")).toHaveText("0ml");

    // 今日より先へは進めない
    await page.getByTestId("next-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
  });

  test("(c-3) カレンダー: 未来日は選択不可、過去日は選択できる", async ({ page }) => {
    await openApp(page);

    await page.getByTestId("date-label").click();
    await expect(page.getByTestId("calendar-popup")).toBeVisible();

    // 未来日(8/15)はdisabled
    await expect(page.getByTestId("cal-day-2026-08-15")).toBeDisabled();

    // 過去日(8/12)を選択
    await page.getByTestId("cal-day-2026-08-12").click();
    await expect(page.getByTestId("date-label")).toContainText("8/12(水)");
  });

  test("(d) 0時境界: 23:30は当日の記録日、0時を跨ぐと記録日が切り替わる", async ({
    page,
  }) => {
    // 23:30 → 記録日は 8/14（暦日）
    await openApp(page, new Date("2026-08-14T23:30:00+09:00"));
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("23時");

    await page.getByTestId("quick-water-100").click();
    await expect(page.getByTestId("water-day-total")).toHaveText("100ml");
    await expect(page.getByTestId("subtotal-w3")).toHaveText("100"); // 23時=帯3

    // 時刻を翌0:05へ進めてリロード → 記録日が 8/15 に切り替わり合計はリセット
    await page.clock.setSystemTime(new Date("2026-08-15T00:05:00+09:00"));
    await page.reload();
    await expect(page.getByTestId("date-label")).toContainText("8/15(土)");
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("0時");
    await expect(page.getByTestId("water-day-total")).toHaveText("0ml");

    // 0時台の記録は帯1
    await page.getByTestId("quick-water-50").click();
    await expect(page.getByTestId("subtotal-w1")).toHaveText("50");

    // 前日に戻ると100mlが残っている
    await page.getByTestId("prev-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await expect(page.getByTestId("water-day-total")).toHaveText("100ml");
  });

  test("(e) 日付跨ぎ追従: リロードせず開いたままでも0時を跨ぐと今日が切り替わる", async ({
    page,
  }) => {
    await openApp(page, new Date("2026-08-14T23:30:00+09:00"));
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await page.getByTestId("quick-water-100").click();
    await expect(page.getByTestId("water-day-total")).toHaveText("100ml");

    // 時刻を翌0:05へ → 60秒間隔の syncDay が発火して表示日・時刻が今日へ追従する
    await page.clock.setSystemTime(new Date("2026-08-15T00:05:00+09:00"));
    await page.clock.runFor(60_000);
    await expect(page.getByTestId("date-label")).toContainText("8/15(土)");
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("0時");
    await expect(page.getByTestId("water-day-total")).toHaveText("0ml");

    // 前日の記録は残っている
    await page.getByTestId("prev-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await expect(page.getByTestId("water-day-total")).toHaveText("100ml");
  });

  test("(f) 過去日を表示中は日付跨ぎで表示日が動かない", async ({ page }) => {
    await openApp(page, new Date("2026-08-14T23:30:00+09:00"));
    await page.getByTestId("prev-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/13(木)");

    // 0時を跨いでも過去日を見ているときは表示日を動かさない
    await page.clock.setSystemTime(new Date("2026-08-15T00:05:00+09:00"));
    await page.clock.runFor(60_000);
    await expect(page.getByTestId("date-label")).toContainText("8/13(木)");
  });
});
