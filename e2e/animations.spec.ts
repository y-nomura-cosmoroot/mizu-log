import { expect, test, type Locator } from "@playwright/test";
import { openApp } from "./helpers";

// CSS Modules は animation 名をモジュールスコープでハッシュ化するため、keyframes が
// 解決できないとアニメーションは「黙って」動かなくなる（グローバル keyframes を
// モジュールから参照して全アニメが止まった事故の再発防止）。
// 視覚回帰(visual)は animations:"disabled" で撮影するため動作有無を検知できない。
// ここでは Web Animations API（getAnimations / animationstart）で
// 「実際に走っている」ことを検証する。keyframes が未解決なら Animation は生成されない。

/** 要素（childSelector指定時はその子孫）上で実行中のアニメーション数 */
function runningCount(locator: Locator, childSelector: string | null = null): Promise<number> {
  return locator.evaluate((el, sel) => {
    const target = sel ? el.querySelector(sel) : el;
    if (!target) return 0;
    return target.getAnimations().filter((a) => a.playState === "running").length;
  }, childSelector);
}

test.describe("アニメーション実動作", () => {
  test("ホーム: タンクの波が両タンクとも動いている（横流し2層+ボブ2層）", async ({ page }) => {
    const waveCount = (testId: string) =>
      page.getByTestId(testId).evaluate((el) =>
        Array.from(el.querySelectorAll("*")).reduce(
          (n, node) =>
            n + node.getAnimations().filter((a) => a.playState === "running").length,
          0
        )
      );
    await openApp(page);
    await expect.poll(() => waveCount("water-tank")).toBe(4);
    await expect.poll(() => waveCount("urine-tank")).toBe(4);
  });

  test("バイタル: 心臓の拍動(heartbeat)が常時動いている", async ({ page }) => {
    await openApp(page, undefined, "/?tab=input");
    await expect
      .poll(() => runningCount(page.getByTestId("heart"), "g"))
      .toBeGreaterThan(0);
  });

  test("バイタル: 高血圧の血管点滅(vein-blink)が動いている", async ({ page }) => {
    await openApp(page, undefined, "/?tab=input");
    await page.getByTestId("vital-bp-sys").fill("150");
    await expect(page.getByTestId("bp-veins")).toBeVisible();
    await expect.poll(() => runningCount(page.getByTestId("bp-veins"))).toBeGreaterThan(0);
  });

  test("バイタル: 低血圧のめまい(dizzy-sway)が動いている", async ({ page }) => {
    await openApp(page, undefined, "/?tab=input");
    await page.getByTestId("vital-bp-sys").fill("85");
    await expect(page.getByTestId("dizzy-marks")).toBeVisible();
    await expect
      .poll(() => runningCount(page.getByTestId("dizzy-marks")))
      .toBeGreaterThan(0);
  });

  test("トースト(toastin)と並べ替え(rowpop)の一過性アニメが発火する", async ({ page }) => {
    // 一過性アニメは終わると getAnimations から消えるため、
    // animationstart イベントの発火記録で検証する
    await page.addInitScript(() => {
      const w = window as unknown as { __animStarts: string[] };
      w.__animStarts = [];
      document.addEventListener(
        "animationstart",
        (e) => {
          const t = e.target as Element | null;
          w.__animStarts.push(t?.getAttribute?.("data-testid") ?? "");
        },
        true
      );
    });
    await openApp(page);

    // toastin: 記録するとトーストがスライドインする
    await page.getByTestId("quick-water-150").click();
    await expect(page.getByTestId("toast")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __animStarts: string[] }).__animStarts)
      )
      .toContain("toast");

    // rowpop: マスタ編集でタイミングを並べ替えると行がポップする
    await page.getByTestId("nav-meds").click();
    await page.getByTestId("toggle-master").click();
    await page.getByTestId("timing-up-昼").click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __animStarts: string[] }).__animStarts)
      )
      .toContain("timing-master-row-昼");
  });
});
