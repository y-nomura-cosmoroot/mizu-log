/** 水タンクの満タン基準量（固定・ユーザー確認済み） */
export const GOAL_ML = 2000;

/** クイックボタンの量（飲水・尿量共通、モックの画面表示のまま） */
export const QUICK_AMOUNTS = [50, 100, 150, 200];

/** 自由入力の初期値 */
export const DEFAULT_CUSTOM_ML = 500;

/** localStorage キー */
export const STORAGE_KEY = "mizu-log";

/** トースト表示時間(ms) */
export const TOAST_MS = 2200;

/** タイミングマスタの初期値 */
export const DEFAULT_TIMINGS = ["朝", "昼", "晩"];

/** 薬の量の単位の選択肢 */
export const DOSE_UNITS = ["錠", "袋", "mg", "g"] as const;

export type BandNo = 1 | 2 | 3;

/** 小計帯の定義（記録日は14時起点、8時間×3帯） */
export const BAND_DEFS: ReadonlyArray<{ band: BandNo; label: string }> = [
  { band: 1, label: "14〜21時" },
  { band: 2, label: "22〜翌5時" },
  { band: 3, label: "翌6〜13時" },
];
