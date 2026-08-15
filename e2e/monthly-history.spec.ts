import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test.describe("りれき: 月ごとに見る", () => {
  test("トグルで月一覧・日別集計・飲み忘れ⚠️・月ナビ・月ピッカー・トグル解除", async ({
    page,
  }) => {
    await openApp(page);

    // データ投入: 飲水150+尿100(15時)、便1回、朝だけチェック
    await page.getByTestId("quick-water-150").click();
    await page.getByTestId("quick-urine-100").click();
    await page.getByTestId("nav-input").click();
    await page.getByTestId("add-stool").click();
    await page.getByTestId("nav-meds").click();
    await page.getByTestId("drank-btn-朝").click();

    await page.getByTestId("nav-history").click();
    // デフォルトはオフ（サブタブが見えている）。サブタブをバイタルにしてからONにする
    await expect(page.getByTestId("hist-sub-water")).toBeVisible();
    await page.getByTestId("hist-sub-vital").click();
    await page.getByTestId("toggle-monthly").click();

    // 月ラベルに切り替わり、サブタブと「今日に戻る」は消える
    await expect(page.getByTestId("date-label")).toContainText("2026年8月");
    await expect(page.getByTestId("hist-sub-water")).toHaveCount(0);
    await expect(page.getByTestId("go-today")).toHaveCount(0);

    // 当日行: 飲水/尿の合計・便アイコン+回数・飲み忘れ⚠️（昼・晩が未チェック）
    const row = page.getByTestId("month-row-2026-08-14");
    await expect(row).toContainText("飲水 150ml ・ 尿 100ml");
    await expect(row).toContainText("💩1回");
    await expect(row).toContainText("⚠️");

    // 記録なしの日はその旨表示、未来日の行は出ない
    await expect(page.getByTestId("month-row-2026-08-01")).toContainText("記録なし");
    await expect(page.getByTestId("month-row-2026-08-15")).toHaveCount(0);

    // 月ナビ: ‹で前月（末日まで表示）、›で今月へ、今月より先へは進めない
    await page.getByTestId("prev-day").click();
    await expect(page.getByTestId("date-label")).toContainText("2026年7月");
    await expect(page.getByTestId("month-row-2026-07-31")).toContainText("記録なし");
    await page.getByTestId("next-day").click();
    await expect(page.getByTestId("date-label")).toContainText("2026年8月");
    await page.getByTestId("next-day").click();
    await expect(page.getByTestId("date-label")).toContainText("2026年8月");

    // 月ラベル押下で月ピッカー: 未来月は選べず、過去月を選ぶと移動する
    await page.getByTestId("date-label").click();
    await expect(page.getByTestId("month-picker")).toBeVisible();
    await expect(page.getByTestId("pick-month-2026-09")).toBeDisabled();
    await page.getByTestId("pick-month-2026-07").click();
    await expect(page.getByTestId("month-picker")).toHaveCount(0);
    await expect(page.getByTestId("date-label")).toContainText("2026年7月");
    await page.getByTestId("next-day").click();
    await expect(page.getByTestId("date-label")).toContainText("2026年8月");

    // 日行クリックで月ごとが解除され、その日の（日ごと）りれきへ移動する。
    // サブタブは「飲水量/尿量」に戻る（day-total-waterは水分サブタブでのみ表示される）
    await page.getByTestId("month-row-2026-08-01").click();
    await expect(page.getByTestId("date-label")).toContainText("8/1(土)");
    await expect(page.getByTestId("toggle-monthly")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("hist-sub-water")).toBeVisible();
    await expect(page.getByTestId("day-total-water")).toHaveText("0ml");

    // 「今日に戻る」で今日の日ごと表示へ
    await page.getByTestId("go-today").click();
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await expect(page.getByTestId("day-total-water")).toHaveText("150ml");
  });
});

test.describe("りれき: 月ごとに見る（スクロール復帰）", () => {
  // 標準の940pxでは月一覧がほぼ収まってしまうため、低いviewportで確実にスクロールさせる
  test.use({ viewport: { width: 430, height: 480 } });

  test("日行クリックで先頭までスクロールが戻る", async ({ page }) => {
    await openApp(page);
    await page.getByTestId("quick-water-150").click();
    await page.getByTestId("nav-history").click();
    await page.getByTestId("toggle-monthly").click();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await page.getByTestId("month-row-2026-08-14").click();
    await expect(page.getByTestId("date-label")).toContainText("8/14(金)");
    await expect(page.getByTestId("day-total-water")).toHaveText("150ml");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
