import {
  BP_HIGH_SYS,
  BP_LOW_SYS,
  PULSE_HIGH_BPM,
  PULSE_LOW_BPM,
  WEIGHT_HEAVY_KG,
  WEIGHT_NORMAL_KG,
  WEIGHT_SLIM_KG,
} from "./constants";

/**
 * 人体シルエットのエフェクト判定。
 * 入力中の値が無いときは「その日の最新記録の値」を渡して判定する
 * （記録後もエフェクトを持続させるため。判定元の選択は呼び出し側で行う）。
 */

export type FeverLevel = "none" | "low" | "normal" | "mild" | "high";

/** 体温 → 発熱レベル（35℃未満=低体温、37℃以上=微熱、38℃以上=高熱） */
export function feverOf(temp: string): FeverLevel {
  const tv = parseFloat(temp);
  if (isNaN(tv)) return "none";
  if (tv >= 38) return "high";
  if (tv >= 37) return "mild";
  if (tv < 35) return "low";
  return "normal";
}

/** 発熱レベル → シルエットの色 */
export function bodyColorOf(level: FeverLevel): string {
  if (level === "high") return "#e57368";
  if (level === "mild") return "#eba53f";
  if (level === "low") return "#c3e7fa"; // 低体温=薄い水色
  return "#8ec6ec";
}

export type BuildLevel = "none" | "thin" | "normal" | "heavy";

/** 体型係数の下限（WEIGHT_SLIM_KG以下でこの値） */
export const BUILD_FACTOR_MIN = 0.7;
/** 体型係数の上限（WEIGHT_HEAVY_KG以上でこの値） */
export const BUILD_FACTOR_MAX = 1.6;

export interface BuildEffect {
  level: BuildLevel;
  /** 体型係数。1=標準。BUILD_FACTOR_MIN〜MAXの範囲で体重に応じて連続変化 */
  factor: number;
}

/**
 * 体重 → 体型（連続変化）。
 * WEIGHT_SLIM_KG以下=最細(0.7)、WEIGHT_NORMAL_KG=標準(1.0)、
 * WEIGHT_HEAVY_KG以上=最太(1.6)。間は線形補間する。
 */
export function buildEffectOf(weight: string): BuildEffect {
  const wv = parseFloat(weight);
  if (isNaN(wv)) return { level: "none", factor: 1 };

  let factor: number;
  if (wv <= WEIGHT_SLIM_KG) {
    factor = BUILD_FACTOR_MIN;
  } else if (wv <= WEIGHT_NORMAL_KG) {
    factor =
      BUILD_FACTOR_MIN +
      ((wv - WEIGHT_SLIM_KG) / (WEIGHT_NORMAL_KG - WEIGHT_SLIM_KG)) *
        (1 - BUILD_FACTOR_MIN);
  } else if (wv <= WEIGHT_HEAVY_KG) {
    factor =
      1 +
      ((wv - WEIGHT_NORMAL_KG) / (WEIGHT_HEAVY_KG - WEIGHT_NORMAL_KG)) *
        (BUILD_FACTOR_MAX - 1);
  } else {
    factor = BUILD_FACTOR_MAX;
  }

  const level: BuildLevel =
    Math.abs(factor - 1) < 0.001 ? "normal" : factor < 1 ? "thin" : "heavy";
  return { level, factor };
}

export type PulseLevel = "none" | "low" | "normal" | "high";

export interface PulseEffect {
  level: PulseLevel;
  /** 拍動アニメーションの周期計算に使うBPM。値が無ければnull（心臓非表示） */
  bpm: number | null;
}

/** 脈拍 → 心臓エフェクト（PULSE_LOW_BPM未満=低い、PULSE_HIGH_BPM超=高い） */
export function pulseEffectOf(pulse: string): PulseEffect {
  const pv = parseFloat(pulse);
  if (isNaN(pv) || pv <= 0) return { level: "none", bpm: null };
  const level: PulseLevel =
    pv < PULSE_LOW_BPM ? "low" : pv > PULSE_HIGH_BPM ? "high" : "normal";
  return { level, bpm: pv };
}

/** 脈拍レベル → 心臓の色（低い=青、それ以外=赤） */
export function heartColorOf(level: PulseLevel): string {
  return level === "low" ? "#4a90d9" : "#e0484f";
}

/** 1拍あたりの秒数（アニメーション周期）。極端な入力値でも破綻しないようクランプ */
export function beatDurationSec(bpm: number): number {
  const clamped = Math.min(220, Math.max(30, bpm));
  return 60 / clamped;
}

export type BpLevel = "none" | "low" | "normal" | "high";

/**
 * 血圧 → エフェクトレベル。判定は上(収縮期)のみ使用。
 * BP_HIGH_SYS以上=高血圧（腕に血管）、BP_LOW_SYS未満=低血圧（めまい）
 */
export function bpLevelOf(bpSys: string): BpLevel {
  const sv = parseFloat(bpSys);
  if (isNaN(sv) || sv <= 0) return "none";
  if (sv >= BP_HIGH_SYS) return "high";
  if (sv < BP_LOW_SYS) return "low";
  return "normal";
}
