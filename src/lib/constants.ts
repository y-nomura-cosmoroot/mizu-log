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

/** 体重エフェクト: この値以下でシルエットが最も細くなる(kg) */
export const WEIGHT_SLIM_KG = 40;

/** 体重エフェクト: この値で標準体型(kg) */
export const WEIGHT_NORMAL_KG = 55;

/** 体重エフェクト: この値以上でシルエットが最も太くなる(kg) */
export const WEIGHT_HEAVY_KG = 90;

/** 血圧エフェクト: 上(収縮期)がこの値以上で「高血圧」(腕に血管が浮き出る) */
export const BP_HIGH_SYS = 140;

/** 血圧エフェクト: 上(収縮期)がこの値未満で「低血圧」(めまいエフェクト) */
export const BP_LOW_SYS = 90;

/** 脈拍が未入力・記録なしのときに心臓の拍動に使うBPM（通常の心拍） */
export const DEFAULT_PULSE_BPM = 70;

/** 脈拍エフェクト: この値未満で「低い」(心臓が青くなる) */
export const PULSE_LOW_BPM = 60;

/** 脈拍エフェクト: この値超で「高い」(効果線を表示) */
export const PULSE_HIGH_BPM = 100;

export type BandNo = 1 | 2 | 3;

/** 小計帯の定義（記録日は14時起点、8時間×3帯） */
export const BAND_DEFS: ReadonlyArray<{ band: BandNo; label: string }> = [
  { band: 1, label: "14〜21時" },
  { band: 2, label: "22〜翌5時" },
  { band: 3, label: "翌6〜13時" },
];
