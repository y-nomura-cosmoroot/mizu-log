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

    // ドロップダウンから翌日側の3時を選択 → 帯2に計上される
    await page.getByTestId("sel-hour-toggle").click();
    await expect(page.getByTestId("hour-dropdown")).toBeVisible();
    await expect(page.getByTestId("hour-dropdown")).toContainText("よくじつ");
    await page.getByTestId("hour-chip-3").click();
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("3時");
    await page.getByTestId("quick-water-50").click();
    await expect(page.getByTestId("subtotal-w2")).toHaveText("50"); // 3時=帯2
    await expect(page.getByTestId("subtotal-w3")).toHaveText("—");
    await expect(page.getByTestId("subtotal-w1")).toHaveText("200");
    await expect(page.getByTestId("subtotal-wt")).toHaveText("250");
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

  test("(d) 14時境界: 13:30は前日の記録日、14時を跨ぐと記録日が切り替わる", async ({
    page,
  }) => {
    // 13:30 → 記録日は 8/13
    await openApp(page, new Date("2026-08-14T13:30:00+09:00"));
    await expect(page.getByTestId("date-label")).toContainText("8/13(木)");
    await expect(page.getByTestId("sel-hour-toggle")).toContainText("13時");

    await page.getByTestId("quick-water-100").click();
    await expect(page.getByTestId("water-day-total")).toHaveText("100ml");
    await expect(page.getByTestId("subtotal-w3")).toHaveText("100"); // 13時=帯3

    // 時刻を14:05へ進めてリロード → 記録日が 8/14 に切り替わり合計はリセット
    await page.clock.setSystemTime(new Date("2026-08-14T14:05:00+09:00"));
    await page.reload();
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await expect(page.getByTestId("water-day-total")).toHaveText("0ml");

    // 前日に戻ると100mlが残っている
    await page.getByTestId("prev-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/13(木)");
    await expect(page.getByTestId("water-day-total")).toHaveText("100ml");
  });
});
