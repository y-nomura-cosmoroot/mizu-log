import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./helpers";

// 1x1のPNG(内容はダミー。/api/ocrのレスポンス自体をモックするため画像の中身は問わない)
const DUMMY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

async function openCameraSheet(page: Page) {
  await openApp(page, undefined, "/?tab=meds");
  await page.getByTestId("toggle-master").click();
  await page.getByTestId("add-medicine-camera").click();
  await expect(page.getByTestId("camera-sheet")).toBeVisible();
}

async function pickPhoto(page: Page) {
  await page.getByTestId("camera-file-input").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: DUMMY_PNG,
  });
}

test.describe("おくすり: カメラからOCRで追加", () => {
  test("(g-1) OCRが失敗したら「これでOK」は出ず、別の写真で撮り直して追加できる", async ({
    page,
  }) => {
    let calls = 0;
    await page.route("**/api/ocr", (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({ status: 502, json: { error: "Groq API error" } });
      }
      return route.fulfill({ status: 200, json: { names: ["テスト薬"] } });
    });
    await openCameraSheet(page);
    await pickPhoto(page);

    await expect(page.getByTestId("camera-error")).toContainText("読み取れませんでした");
    // 確定する内容が無いので「これでOK」は表示されない
    await expect(page.getByTestId("camera-confirm")).toHaveCount(0);

    // 別の写真で撮り直す→camera状態に戻り、再度写真を選ぶと2回目のモック応答(成功)になる
    await page.getByTestId("camera-retake").click();
    await expect(page.getByTestId("camera-pick-photo")).toBeVisible();
    await pickPhoto(page);

    await expect(page.getByTestId("camera-draft-name-0")).toHaveValue("テスト薬");
    await page.getByTestId("camera-draft-dose-0").fill("1");
    await page.getByTestId("camera-draft-unit-0").selectOption("錠");
    await page.getByTestId("camera-confirm").click();

    await expect(page.getByTestId("camera-sheet")).toHaveCount(0);
    await expect(page.getByTestId("med-name-0")).toHaveValue("テスト薬");
    await expect(page.getByTestId("med-dose-0")).toHaveValue("1");
    await expect(page.getByTestId("med-unit-0")).toHaveValue("錠");
  });

  test("(g-2) やめるボタンでキャンセルすると薬は追加されない", async ({ page }) => {
    await openCameraSheet(page);
    await page.getByTestId("camera-cancel").click();
    await expect(page.getByTestId("camera-sheet")).toHaveCount(0);
    await expect(page.getByTestId("med-card-0")).toHaveCount(0);
  });

  test("(g-3) 1枚の写真から複数の薬名を読み取り、量・単位を選んでそれぞれ別の薬として追加できる", async ({
    page,
  }) => {
    await page.route("**/api/ocr", (route) =>
      route.fulfill({ status: 200, json: { names: ["セルセプト", "プレドニン"] } })
    );
    await openCameraSheet(page);
    await pickPhoto(page);

    await expect(page.getByTestId("camera-status-recognizing")).toHaveCount(0);
    await expect(page.getByTestId("camera-draft-name-0")).toHaveValue("セルセプト");
    await expect(page.getByTestId("camera-draft-name-1")).toHaveValue("プレドニン");

    // 読み取った薬の量・単位もここで選択できる
    await page.getByTestId("camera-draft-dose-0").fill("250");
    await page.getByTestId("camera-draft-unit-0").selectOption("mg");
    await page.getByTestId("camera-draft-dose-1").fill("2");

    await page.getByTestId("camera-confirm").click();
    await expect(page.getByTestId("camera-sheet")).toHaveCount(0);
    await expect(page.getByTestId("med-name-0")).toHaveValue("セルセプト");
    await expect(page.getByTestId("med-dose-0")).toHaveValue("250");
    await expect(page.getByTestId("med-unit-0")).toHaveValue("mg");
    await expect(page.getByTestId("med-name-1")).toHaveValue("プレドニン");
    await expect(page.getByTestId("med-dose-1")).toHaveValue("2");
  });

  test("(g-4) 読み取り結果のうち不要な1件を「これでOK」の前に削除できる", async ({ page }) => {
    await page.route("**/api/ocr", (route) =>
      route.fulfill({ status: 200, json: { names: ["セルセプト", "プレドニン"] } })
    );
    await openCameraSheet(page);
    await pickPhoto(page);
    await expect(page.getByTestId("camera-draft-name-1")).toHaveValue("プレドニン");

    // 1件目(セルセプト)を削除→プレドニンが繰り上がる
    await page.getByTestId("camera-draft-del-0").click();
    await expect(page.getByTestId("camera-draft-name-0")).toHaveValue("プレドニン");
    await expect(page.getByTestId("camera-draft-name-1")).toHaveCount(0);

    await page.getByTestId("camera-confirm").click();
    await expect(page.getByTestId("med-name-0")).toHaveValue("プレドニン");
    await expect(page.getByTestId("med-card-1")).toHaveCount(0);
  });

  test("(g-5) 失敗後「もう一度読み取る」で同じ写真を再度読み取れる", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/ocr", (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({ status: 502, json: { error: "Groq API error" } });
      }
      return route.fulfill({ status: 200, json: { names: ["セルセプト"] } });
    });
    await openCameraSheet(page);
    await pickPhoto(page);
    await expect(page.getByTestId("camera-error")).toBeVisible();

    await page.getByTestId("camera-retry").click();
    await expect(page.getByTestId("camera-status-recognizing")).toHaveCount(0);
    await expect(page.getByTestId("camera-error")).toHaveCount(0);
    await expect(page.getByTestId("camera-draft-name-0")).toHaveValue("セルセプト");
    expect(calls).toBe(2);

    await page.getByTestId("camera-confirm").click();
    await expect(page.getByTestId("med-name-0")).toHaveValue("セルセプト");
  });
});
