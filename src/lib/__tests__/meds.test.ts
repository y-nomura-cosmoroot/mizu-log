import { describe, expect, it } from "vitest";
import type { MedChecks, Medicine } from "@/types/records";
import {
  groupMedChecksByBandHour,
  medsForTiming,
  parseDoseText,
  sortMedicines,
  uncheckedTimings,
} from "../meds";

const D = "2026-08-14";
const TIMINGS = ["朝", "昼", "晩"];

describe("uncheckedTimings（現行マスタ基準）", () => {
  it("チェック無しなら全タイミングが未", () => {
    expect(uncheckedTimings(TIMINGS, {}, D)).toEqual(["朝", "昼", "晩"]);
  });
  it("一部チェック済み", () => {
    const checks: MedChecks = { [D]: { 朝: 8 } };
    expect(uncheckedTimings(TIMINGS, checks, D)).toEqual(["昼", "晩"]);
  });
  it("全チェックで空配列", () => {
    const checks: MedChecks = { [D]: { 朝: 8, 昼: 12, 晩: 19 } };
    expect(uncheckedTimings(TIMINGS, checks, D)).toEqual([]);
  });
  it("マスタからタイミングを削除したら判定からも消える", () => {
    const checks: MedChecks = { [D]: { 朝: 8 } };
    expect(uncheckedTimings(["朝"], checks, D)).toEqual([]);
  });
  it("別の記録日のチェックは影響しない", () => {
    const checks: MedChecks = { "2026-08-13": { 朝: 8, 昼: 12, 晩: 19 } };
    expect(uncheckedTimings(TIMINGS, checks, D)).toEqual(["朝", "昼", "晩"]);
  });
});

const MEDICINES: Medicine[] = [
  { id: "1", name: "グラセプター", doseAmount: "1", doseUnit: "mg", timings: ["朝", "晩"] },
  { id: "2", name: "セルセプト", doseAmount: "250", doseUnit: "mg", timings: ["昼"] },
  { id: "3", name: "プレドニン", doseAmount: "2", doseUnit: "錠", timings: ["朝", "晩"] },
];

describe("medsForTiming", () => {
  it("タイミングに紐づく薬を「 ・ 」区切りで返す", () => {
    expect(medsForTiming(MEDICINES, "朝")).toBe("グラセプター 1mg ・ プレドニン 2錠");
  });
  it("薬が無ければ（くすりの登録なし）", () => {
    expect(medsForTiming(MEDICINES, "ねる前")).toBe("（くすりの登録なし）");
  });
  it("量が空なら名前のみ", () => {
    const meds: Medicine[] = [
      { id: "x", name: "テスト薬", doseAmount: "", doseUnit: "錠", timings: ["朝"] },
    ];
    expect(medsForTiming(meds, "朝")).toBe("テスト薬");
  });
});

describe("parseDoseText（v1スキーマのdose文字列の変換）", () => {
  it("数値+単位を分離する", () => {
    expect(parseDoseText("1mg")).toEqual({ doseAmount: "1", doseUnit: "mg" });
    expect(parseDoseText("250mg")).toEqual({ doseAmount: "250", doseUnit: "mg" });
    expect(parseDoseText("2錠")).toEqual({ doseAmount: "2", doseUnit: "錠" });
    expect(parseDoseText("1袋")).toEqual({ doseAmount: "1", doseUnit: "袋" });
    expect(parseDoseText("0.5g")).toEqual({ doseAmount: "0.5", doseUnit: "g" });
  });
  it("mgはgより優先して判定する", () => {
    expect(parseDoseText("10mg").doseUnit).toBe("mg");
  });
  it("解釈できない文字列は数値のみ抽出、単位は錠にフォールバック", () => {
    expect(parseDoseText("朝食後に2つ")).toEqual({ doseAmount: "2", doseUnit: "錠" });
    expect(parseDoseText("")).toEqual({ doseAmount: "", doseUnit: "錠" });
  });
});

describe("sortMedicines", () => {
  it("最小タイミングindex順、タグ無しは最後", () => {
    const meds: Medicine[] = [
      { id: "a", name: "タグ無し", doseAmount: "", doseUnit: "錠", timings: [] },
      { id: "b", name: "晩のみ", doseAmount: "", doseUnit: "錠", timings: ["晩"] },
      { id: "c", name: "朝晩", doseAmount: "", doseUnit: "錠", timings: ["晩", "朝"] },
      { id: "d", name: "昼のみ", doseAmount: "", doseUnit: "錠", timings: ["昼"] },
    ];
    expect(sortMedicines(meds, TIMINGS).map((m) => m.name)).toEqual([
      "朝晩",
      "昼のみ",
      "晩のみ",
      "タグ無し",
    ]);
  });
  it("元配列を破壊しない", () => {
    const meds = [...MEDICINES];
    sortMedicines(meds, TIMINGS);
    expect(meds).toEqual(MEDICINES);
  });
});

describe("groupMedChecksByBandHour", () => {
  it("チェック実績を帯→時でグルーピング", () => {
    const checks: MedChecks = { [D]: { 朝: 8, 昼: 12, 晩: 19 } };
    const groups = groupMedChecksByBandHour(TIMINGS, checks, D);
    expect(groups[0].hours.map((h) => h.hour)).toEqual([19]); // 帯1
    expect(groups[1].empty).toBe(true); // 帯2
    expect(groups[2].hours.map((h) => h.hour)).toEqual([8, 12]); // 帯3
  });
  it("チェック無しなら全帯empty", () => {
    const groups = groupMedChecksByBandHour(TIMINGS, {}, D);
    expect(groups.every((g) => g.empty)).toBe(true);
  });
});
