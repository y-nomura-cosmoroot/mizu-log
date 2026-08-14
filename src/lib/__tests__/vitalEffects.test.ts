import { describe, expect, it } from "vitest";
import {
  BP_HIGH_SYS,
  BP_LOW_SYS,
  PULSE_HIGH_BPM,
  PULSE_LOW_BPM,
  WEIGHT_HEAVY_KG,
  WEIGHT_NORMAL_KG,
  WEIGHT_SLIM_KG,
} from "../constants";
import {
  beatDurationSec,
  bodyColorOf,
  bpLevelOf,
  BUILD_FACTOR_MAX,
  BUILD_FACTOR_MIN,
  buildEffectOf,
  feverOf,
  heartColorOf,
  pulseEffectOf,
} from "../vitalEffects";

describe("feverOf（体温 → 発熱レベル）", () => {
  it("未入力・数値でない場合は none", () => {
    expect(feverOf("")).toBe("none");
    expect(feverOf("abc")).toBe("none");
  });
  it("35℃未満は低体温（境界値）", () => {
    expect(feverOf("34.0")).toBe("low");
    expect(feverOf("34.9")).toBe("low");
    expect(feverOf("35.0")).toBe("normal");
  });
  it("35℃以上37℃未満は平熱", () => {
    expect(feverOf("35.0")).toBe("normal");
    expect(feverOf("36.5")).toBe("normal");
    expect(feverOf("36.9")).toBe("normal");
  });
  it("37℃以上は微熱、38℃以上は高熱（境界値）", () => {
    expect(feverOf("37.0")).toBe("mild");
    expect(feverOf("37.9")).toBe("mild");
    expect(feverOf("38.0")).toBe("high");
    expect(feverOf("41.0")).toBe("high");
  });
});

describe("bodyColorOf", () => {
  it("高熱=赤、微熱=オレンジ、低体温=薄い水色、それ以外=青", () => {
    expect(bodyColorOf("high")).toBe("#e57368");
    expect(bodyColorOf("mild")).toBe("#eba53f");
    expect(bodyColorOf("low")).toBe("#c3e7fa");
    expect(bodyColorOf("normal")).toBe("#8ec6ec");
    expect(bodyColorOf("none")).toBe("#8ec6ec");
  });
});

describe("buildEffectOf（体重 → 体型。連続変化）", () => {
  it("未入力・数値でない場合は none / 係数1", () => {
    expect(buildEffectOf("")).toEqual({ level: "none", factor: 1 });
    expect(buildEffectOf("abc")).toEqual({ level: "none", factor: 1 });
  });
  it(`${WEIGHT_SLIM_KG}kg以下は最細係数(${BUILD_FACTOR_MIN})に張り付く`, () => {
    expect(buildEffectOf(String(WEIGHT_SLIM_KG)).factor).toBe(BUILD_FACTOR_MIN);
    expect(buildEffectOf("30").factor).toBe(BUILD_FACTOR_MIN);
    expect(buildEffectOf("30").level).toBe("thin");
  });
  it(`${WEIGHT_NORMAL_KG}kgはちょうど標準(係数1)`, () => {
    expect(buildEffectOf(String(WEIGHT_NORMAL_KG))).toEqual({
      level: "normal",
      factor: 1,
    });
  });
  it(`${WEIGHT_HEAVY_KG}kg以上は最太係数(${BUILD_FACTOR_MAX})に張り付く`, () => {
    expect(buildEffectOf(String(WEIGHT_HEAVY_KG)).factor).toBe(BUILD_FACTOR_MAX);
    expect(buildEffectOf("120").factor).toBe(BUILD_FACTOR_MAX);
    expect(buildEffectOf("120").level).toBe("heavy");
  });
  it("しきい値の間は線形補間で連続的に変化する", () => {
    // 細い側の中間: 40〜55の中点47.5 → 0.7と1.0の中点0.85
    expect(buildEffectOf("47.5").factor).toBeCloseTo(0.85, 5);
    expect(buildEffectOf("47.5").level).toBe("thin");
    // 太い側の中間: 55〜90の中点72.5 → 1.0と1.6の中点1.3
    expect(buildEffectOf("72.5").factor).toBeCloseTo(1.3, 5);
    expect(buildEffectOf("72.5").level).toBe("heavy");
    // 単調増加
    expect(buildEffectOf("60").factor).toBeGreaterThan(buildEffectOf("56").factor);
    expect(buildEffectOf("50").factor).toBeGreaterThan(buildEffectOf("45").factor);
  });
});

describe("pulseEffectOf（脈拍 → 心臓エフェクト）", () => {
  it("未入力・数値でない・0以下は none / bpm null", () => {
    expect(pulseEffectOf("")).toEqual({ level: "none", bpm: null });
    expect(pulseEffectOf("abc")).toEqual({ level: "none", bpm: null });
    expect(pulseEffectOf("0")).toEqual({ level: "none", bpm: null });
  });
  it(`${PULSE_LOW_BPM}未満は低い（境界値）`, () => {
    expect(pulseEffectOf("59").level).toBe("low");
    expect(pulseEffectOf(String(PULSE_LOW_BPM)).level).toBe("normal");
    expect(pulseEffectOf("30").level).toBe("low");
  });
  it(`${PULSE_LOW_BPM}〜${PULSE_HIGH_BPM}は通常（境界値含む）`, () => {
    expect(pulseEffectOf("70").level).toBe("normal");
    expect(pulseEffectOf(String(PULSE_HIGH_BPM)).level).toBe("normal");
  });
  it(`${PULSE_HIGH_BPM}超は高い（境界値）`, () => {
    expect(pulseEffectOf("101").level).toBe("high");
    expect(pulseEffectOf("120").level).toBe("high");
  });
  it("bpmには入力値がそのまま入る", () => {
    expect(pulseEffectOf("72").bpm).toBe(72);
  });
});

describe("heartColorOf", () => {
  it("低い=青、それ以外=赤", () => {
    expect(heartColorOf("low")).toBe("#4a90d9");
    expect(heartColorOf("normal")).toBe("#e0484f");
    expect(heartColorOf("high")).toBe("#e0484f");
    expect(heartColorOf("none")).toBe("#e0484f");
  });
});

describe("beatDurationSec（1拍あたりの秒数）", () => {
  it("60÷BPM 秒", () => {
    expect(beatDurationSec(60)).toBe(1);
    expect(beatDurationSec(120)).toBe(0.5);
    expect(beatDurationSec(70)).toBeCloseTo(60 / 70, 5);
  });
  it("極端な値はクランプされる（30〜220）", () => {
    expect(beatDurationSec(10)).toBe(2); // 30扱い
    expect(beatDurationSec(500)).toBeCloseTo(60 / 220, 5);
  });
});

describe("bpLevelOf（血圧(上) → エフェクトレベル）", () => {
  it("未入力・数値でない・0以下は none", () => {
    expect(bpLevelOf("")).toBe("none");
    expect(bpLevelOf("abc")).toBe("none");
    expect(bpLevelOf("0")).toBe("none");
  });
  it(`${BP_LOW_SYS}未満は低血圧（境界値）`, () => {
    expect(bpLevelOf("89")).toBe("low");
    expect(bpLevelOf("85")).toBe("low");
    expect(bpLevelOf(String(BP_LOW_SYS))).toBe("normal");
  });
  it(`${BP_LOW_SYS}〜${BP_HIGH_SYS - 1}は通常`, () => {
    expect(bpLevelOf("120")).toBe("normal");
    expect(bpLevelOf("139")).toBe("normal");
  });
  it(`${BP_HIGH_SYS}以上は高血圧（境界値）`, () => {
    expect(bpLevelOf(String(BP_HIGH_SYS))).toBe("high");
    expect(bpLevelOf("150")).toBe("high");
  });
});
