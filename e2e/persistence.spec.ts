import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test.describe("localStorage永続化とdeep-link", () => {
  test("(g) 記録→リロードで全値保持、エンベロープ形式で保存される", async ({ page }) => {
    await openApp(page);

    // 飲水・内服チェック・バイタルを記録
    await page.getByTestId("quick-water-150").click();
    await page.getByTestId("nav-meds").click();
    await page.getByTestId("drank-btn-朝").click();
    await page.getByTestId("nav-input").click();
    await page.getByTestId("vital-temp-select").selectOption("36.5");
    await page.getByTestId("vital-save").click();

    // localStorageのエンベロープ形式を検証
    const raw = await page.evaluate(() => localStorage.getItem("mizu-log"));
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.state.intakes).toHaveLength(1);
    expect(parsed.state.vitals).toHaveLength(1);
    expect(parsed.state.medChecks["2026-08-14"]["朝"]).toBe(15);

    // リロード後も全値が保持される（URLの?tab=inputが復元されるのでinputタブ表示から確認）
    await page.reload();
    await expect(page.getByTestId("date-label")).toBeVisible();
    await expect(page.getByText("15時の記録").first()).toBeVisible();
    await page.getByTestId("nav-home").click();
    await expect(page.getByTestId("water-day-total")).toHaveText("150ml");
    await page.getByTestId("nav-meds").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("1 / 3 かんりょう");
  });

  test("?tab=history&sub=vital のdeep-linkとリロード後のタブ維持", async ({ page }) => {
    await openApp(page, undefined, "/?tab=history&sub=vital");

    // バイタルサブタブが開いている（記録なしメッセージ）
    await expect(page.getByTestId("vital-hist-empty")).toBeVisible();

    // リロードしてもタブ・サブタブが維持される
    await page.reload();
    await expect(page.getByTestId("vital-hist-empty")).toBeVisible();
  });

  test("タブ切替でURLの?tab=が更新される", async ({ page }) => {
    await openApp(page);
    await page.getByTestId("nav-meds").click();
    await expect(page).toHaveURL(/\?tab=meds/);
    await page.getByTestId("nav-history").click();
    await expect(page).toHaveURL(/\?tab=history&sub=water/);
  });
});
