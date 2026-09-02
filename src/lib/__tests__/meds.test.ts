import { describe, expect, it } from "vitest";
import type { MedChecks, Medicine, Timing, Weekday } from "@/types/records";
import { ALL_WEEKDAYS } from "../constants";
import {
  activeTimings,
  groupMedChecksByBandHour,
  isTimingActiveOn,
  makeTiming,
  medsForTiming,
  parseDoseText,
  sortMedicines,
  timingNames,
  uncheckedTimings,
} from "../meds";

const D = "2026-08-14"; // 金(5)
const TIMINGS: Timing[] = [makeTiming("朝"), makeTiming("昼"), makeTiming("晩")];
const NAMES = ["朝", "昼", "晩"];

describe("makeTiming", () => {
  it("曜日を省略すると全曜日（0=日 … 6=土）", () => {
    expect(makeTiming("朝")).toEqual({ name: "朝", weekdays: [0, 1, 2, 3, 4, 5, 6] });
  });
  it("曜日を指定するとそのまま保持する", () => {
    expect(makeTiming("昼", [1, 3, 5])).toEqual({ name: "昼", weekdays: [1, 3, 5] });
  });
  it("weekdays はコピー（結果を変更しても ALL_WEEKDAYS は変わらない）", () => {
    const t = makeTiming("朝");
    expect(t.weekdays).not.toBe(ALL_WEEKDAYS);
    t.weekdays.push(0);
    t.weekdays.splice(0, 1);
    expect(ALL_WEEKDAYS).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(makeTiming("昼").weekdays).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it("指定した曜日配列もコピーされる（呼び出し元の配列を共有しない）", () => {
    const src: Weekday[] = [1, 3];
    const t = makeTiming("昼", src);
    t.weekdays.push(5);
    expect(src).toEqual([1, 3]);
  });
});

describe("timingNames", () => {
  it("マスタ順の名前配列を返す", () => {
    expect(timingNames(TIMINGS)).toEqual(NAMES);
    expect(timingNames([makeTiming("晩"), makeTiming("朝")])).toEqual(["晩", "朝"]);
  });
  it("空なら空配列", () => {
    expect(timingNames([])).toEqual([]);
  });
});

describe("isTimingActiveOn", () => {
  it("全曜日なら常に対象", () => {
    expect(isTimingActiveOn(makeTiming("朝"), D)).toBe(true);
    expect(isTimingActiveOn(makeTiming("朝"), "2026-08-16")).toBe(true); // 日
  });
  it("月水金指定: 8/14(金)・8/10(月) は対象、8/13(木) は対象外", () => {
    const t = makeTiming("昼", [1, 3, 5]);
    expect(isTimingActiveOn(t, D)).toBe(true);
    expect(isTimingActiveOn(t, "2026-08-13")).toBe(false);
    expect(isTimingActiveOn(t, "2026-08-10")).toBe(true);
  });
  it("日曜のみ指定: 8/16(日) は対象、8/14(金) は対象外", () => {
    const t = makeTiming("晩", [0]);
    expect(isTimingActiveOn(t, "2026-08-16")).toBe(true);
    expect(isTimingActiveOn(t, D)).toBe(false);
  });
});

describe("activeTimings", () => {
  it("その曜日に飲む対象だけをマスタ順で返す", () => {
    const timings: Timing[] = [
      makeTiming("朝"),
      makeTiming("昼", [1, 3]), // 月水 → 金は対象外
      makeTiming("晩", [5]), // 金
    ];
    expect(activeTimings(timings, D).map((t) => t.name)).toEqual(["朝", "晩"]);
  });
  it("先頭が対象外でも残りの順序は保つ", () => {
    const timings: Timing[] = [makeTiming("朝", [1]), makeTiming("昼"), makeTiming("晩")];
    expect(activeTimings(timings, D).map((t) => t.name)).toEqual(["昼", "晩"]);
  });
  it("Timing オブジェクトそのものを返す（名前配列ではない）", () => {
    expect(activeTimings(TIMINGS, D)).toEqual(TIMINGS);
  });
  it("対象が無ければ空配列", () => {
    const timings: Timing[] = [makeTiming("朝", [1]), makeTiming("昼", [3])];
    expect(activeTimings(timings, D)).toEqual([]);
    expect(activeTimings([], D)).toEqual([]);
  });
});

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
    expect(uncheckedTimings([makeTiming("朝")], checks, D)).toEqual([]);
  });
  it("別の記録日のチェックは影響しない", () => {
    const checks: MedChecks = { "2026-08-13": { 朝: 8, 昼: 12, 晩: 19 } };
    expect(uncheckedTimings(TIMINGS, checks, D)).toEqual(["朝", "昼", "晩"]);
  });
  it("曜日対象外は未チェックでも含めない", () => {
    const timings: Timing[] = [makeTiming("朝"), makeTiming("昼", [1, 3]), makeTiming("晩")];
    expect(uncheckedTimings(timings, {}, D)).toEqual(["朝", "晩"]);
  });
  it("曜日対象外のチェック実績は結果に影響しない", () => {
    const timings: Timing[] = [makeTiming("朝"), makeTiming("昼", [1]), makeTiming("晩")];
    const checks: MedChecks = { [D]: { 昼: 12 } };
    expect(uncheckedTimings(timings, checks, D)).toEqual(["朝", "晩"]);
  });
  it("全て対象外なら空配列", () => {
    const timings: Timing[] = [makeTiming("朝", [1]), makeTiming("昼", [3]), makeTiming("晩", [0])];
    expect(uncheckedTimings(timings, {}, D)).toEqual([]);
  });
  it("hour 0 のチェックはチェック済み（falsy でも未チェック扱いにしない）", () => {
    const checks: MedChecks = { [D]: { 朝: 0 } };
    const result = uncheckedTimings(TIMINGS, checks, D);
    expect(result).not.toContain("朝");
    expect(result).toEqual(["昼", "晩"]);
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
    expect(sortMedicines(meds, NAMES).map((m) => m.name)).toEqual([
      "朝晩",
      "昼のみ",
      "晩のみ",
      "タグ無し",
    ]);
  });
  it("timingNames の結果をそのまま渡せる", () => {
    expect(sortMedicines(MEDICINES, timingNames(TIMINGS)).map((m) => m.id)).toEqual([
      "1",
      "3",
      "2",
    ]);
  });
  it("元配列を破壊しない", () => {
    const meds = [...MEDICINES];
    sortMedicines(meds, NAMES);
    expect(meds).toEqual(MEDICINES);
  });
});

describe("groupMedChecksByBandHour", () => {
  it("チェック実績を帯→時でグルーピング（0〜7 / 8〜15 / 16〜23）", () => {
    const checks: MedChecks = { [D]: { 朝: 8, 昼: 12, 晩: 19 } };
    const groups = groupMedChecksByBandHour(TIMINGS, checks, D);
    expect(groups.map((g) => g.band)).toEqual([1, 2, 3]);
    expect(groups[0].empty).toBe(true); // 帯1: 0〜7時
    expect(groups[1].hours.map((h) => h.hour)).toEqual([8, 12]); // 帯2: 8〜15時
    expect(groups[2].hours.map((h) => h.hour)).toEqual([19]); // 帯3: 16〜23時
    expect(groups[1].empty).toBe(false);
    expect(groups[2].empty).toBe(false);
  });
  it("帯の境界: 7時は帯1・8時は帯2・15時は帯2・16時は帯3", () => {
    const timings: Timing[] = [
      makeTiming("a"),
      makeTiming("b"),
      makeTiming("c"),
      makeTiming("d"),
    ];
    const checks: MedChecks = { [D]: { a: 7, b: 8, c: 15, d: 16 } };
    const groups = groupMedChecksByBandHour(timings, checks, D);
    expect(groups[0].hours.map((h) => h.hour)).toEqual([7]);
    expect(groups[1].hours.map((h) => h.hour)).toEqual([8, 15]);
    expect(groups[2].hours.map((h) => h.hour)).toEqual([16]);
  });
  it("チェック無しなら全帯empty", () => {
    const groups = groupMedChecksByBandHour(TIMINGS, {}, D);
    expect(groups).toHaveLength(3);
    expect(groups.every((g) => g.empty)).toBe(true);
    expect(groups.every((g) => g.hours.length === 0)).toBe(true);
  });
  it("曜日対象外でもチェック実績は履歴に出る", () => {
    const timings: Timing[] = [makeTiming("朝"), makeTiming("昼", [1]), makeTiming("晩")];
    const checks: MedChecks = { [D]: { 昼: 12 } };
    const groups = groupMedChecksByBandHour(timings, checks, D);
    expect(groups[1].hours.map((h) => h.hour)).toEqual([12]);
    expect(groups[1].hours[0].entries).toEqual([{ timing: "昼", hour: 12 }]);
  });
  it("マスタに無いタイミングの実績は出ない", () => {
    const checks: MedChecks = { [D]: { ねる前: 21 } };
    const groups = groupMedChecksByBandHour(TIMINGS, checks, D);
    expect(groups.every((g) => g.empty)).toBe(true);
  });
  it("別の記録日の実績は出ない", () => {
    const checks: MedChecks = { "2026-08-13": { 朝: 8 } };
    const groups = groupMedChecksByBandHour(TIMINGS, checks, D);
    expect(groups.every((g) => g.empty)).toBe(true);
  });
  it("hour 0 は帯1（falsy でも実績として残る）", () => {
    const checks: MedChecks = { [D]: { 朝: 0 } };
    const groups = groupMedChecksByBandHour(TIMINGS, checks, D);
    expect(groups[0].hours.map((h) => h.hour)).toEqual([0]);
    expect(groups[0].hours[0].entries).toEqual([{ timing: "朝", hour: 0 }]);
  });
  it("帯内の時は昇順（マスタ順ではない）", () => {
    const checks: MedChecks = { [D]: { 朝: 9, 昼: 8 } };
    const groups = groupMedChecksByBandHour(TIMINGS, checks, D);
    expect(groups[1].hours.map((h) => h.hour)).toEqual([8, 9]);
  });
  it("同じ時のチェックは1つの時にまとまり、entries はマスタ順", () => {
    const checks: MedChecks = { [D]: { 晩: 8, 朝: 8 } };
    const groups = groupMedChecksByBandHour(TIMINGS, checks, D);
    expect(groups[1].hours).toHaveLength(1);
    expect(groups[1].hours[0].entries).toEqual([
      { timing: "朝", hour: 8 },
      { timing: "晩", hour: 8 },
    ]);
  });
});
