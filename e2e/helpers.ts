import { expect, type Page } from "@playwright/test";

/**
 * 基準時刻: 2026-08-14(金) 15:00 JST → 記録日 2026-08-14
 * （記録日=暦日。15時=帯2(8〜15時)。金曜であることに曜日テスト(meds.spec)が依存する）
 */
export const T0 = new Date("2026-08-14T15:00:00+09:00");

/** 時刻を固定してアプリを開き、初期描画を待つ */
export async function openApp(page: Page, time: Date = T0, path = "/") {
  await page.clock.install({ time });
  await page.goto(path);
  await expect(page.getByTestId("date-label")).toBeVisible();
}
