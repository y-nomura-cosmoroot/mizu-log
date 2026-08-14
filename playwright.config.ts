import { defineConfig, devices } from "@playwright/test";

// E2Eはポート3100を使う。3000はユーザが `npm run dev` で使用しているため触らない
// （CLAUDE.md「ポートとサーバーの扱い」参照）。
// また、Next.js 16は同一プロジェクトで2つ目のdevサーバーを起動できないため、
// E2Eは常に本番ビルドを別ディレクトリ(.next-e2e)に作って `next start` で実行する。
// これによりユーザのdevサーバー(.next / 3000)と完全に分離される。
const E2E_PORT = 3100;
const BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 430, height: 940 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 940 } },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${E2E_PORT}`,
    url: BASE_URL,
    env: { NEXT_DIST_DIR: ".next-e2e" },
    // 前回の実行が残したサーバーを誤って再利用しない（古いビルドをテストする事故を防ぐ）。
    // ポートが塞がっていたらエラーで止まるので、勝手にkillせずユーザに確認する
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
