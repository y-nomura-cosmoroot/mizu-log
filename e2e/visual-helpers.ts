import type { Page } from "@playwright/test";
import { openApp, T0 } from "./helpers";

// 形式の正は src/stores/useAppStore.ts の persist 設定（partialize + version: 2）。
// localStorage キー "mizu-log" に {state, version} エンベロープで保存される。
// recordedAt は "YYYY-MM-DDTHH:mm"（ローカルnaive・秒なし）、0〜13時は記録日の翌暦日。

/** T0(2026-08-14T15:00+09:00) の記録日 */
const RD = "2026-08-14";

const SEED_STATE = {
  intakes: [
    // 帯1(14〜21時)
    { id: "vw1", kind: "water", ml: 150, recordDate: RD, recordedAt: "2026-08-14T15:10" },
    { id: "vw2", kind: "water", ml: 200, recordDate: RD, recordedAt: "2026-08-14T16:00" },
    // 帯2(22〜翌5時)
    { id: "vw3", kind: "water", ml: 300, recordDate: RD, recordedAt: "2026-08-14T22:00" },
    // 帯3(翌6〜13時、翌暦日)
    { id: "vw4", kind: "water", ml: 120, recordDate: RD, recordedAt: "2026-08-15T06:00" },
    { id: "vu1", kind: "urine", ml: 100, recordDate: RD, recordedAt: "2026-08-14T15:30" },
    // 前日分（カレンダーの非選択日セルに合計を出すため）
    { id: "vp1", kind: "water", ml: 500, recordDate: "2026-08-13", recordedAt: "2026-08-13T18:00" },
    { id: "vp2", kind: "urine", ml: 150, recordDate: "2026-08-13", recordedAt: "2026-08-13T20:00" },
  ],
  vitals: [
    // 全エフェクト同時発火: 高熱(赤) + 高血圧(血管点滅) + 頻脈(効果線) + 太め体型
    {
      id: "vv1",
      recordDate: RD,
      recordedAt: "2026-08-14T15:00",
      temp: "38.5",
      bpSys: "150",
      bpDia: "95",
      pulse: "120",
      weight: "70",
    },
    // 部分記録（履歴の時間行サマリ統合表示の確認用）
    {
      id: "vv2",
      recordDate: RD,
      recordedAt: "2026-08-14T16:00",
      temp: "",
      bpSys: "119",
      bpDia: "75",
      pulse: "",
      weight: "",
    },
  ],
  flags: [
    { id: "vf1", kind: "stool", recordDate: RD, recordedAt: "2026-08-14T15:00" },
    { id: "vf2", kind: "meal", recordDate: RD, recordedAt: "2026-08-14T16:00" },
  ],
  // 朝のみチェック済 → 未チェック行 + ホームの飲み忘れバナー + 履歴の⚠️カード
  medChecks: { [RD]: { 朝: 8 } },
  timings: ["朝", "昼", "晩", "ねる前"],
  medicines: [
    { id: "vm1", name: "タケキャブ", doseAmount: "1", doseUnit: "錠", timings: ["朝", "晩"] },
    { id: "vm2", name: "マグミット", doseAmount: "2", doseUnit: "錠", timings: ["朝", "昼", "晩"] },
    // 未入力プレースホルダの描画確認用
    { id: "vm3", name: "", doseAmount: "", doseUnit: "錠", timings: [] },
  ],
};

/** 標準シード（飲水/尿・バイタル・便食事・薬・一部チェック済） */
export const SEED = { state: SEED_STATE, version: 2 };

/** 全タイミングチェック済（履歴おくすりの🎉カード用） */
export const ALL_CHECKED_SEED = {
  state: {
    ...SEED_STATE,
    medChecks: { [RD]: { 朝: 8, 昼: 12, 晩: 19, ねる前: 21 } },
  },
  version: 2,
};

/**
 * シードを localStorage に注入してからアプリを開く。
 * seed=null でシードなし（空の状態）で開く。
 */
export async function openSeeded(
  page: Page,
  path = "/",
  seed: object | null = SEED
) {
  if (seed) {
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k, v),
      ["mizu-log", JSON.stringify(seed)] as const
    );
  }
  await openApp(page, T0, path);
  // next/font(Noto Sans JP)のロード完了までスクショを撮らない
  await page.evaluate(() => document.fonts.ready);
}
