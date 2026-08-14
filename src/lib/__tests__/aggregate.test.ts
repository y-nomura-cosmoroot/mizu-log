import { describe, expect, it } from "vitest";
import type { FlagRecord, IntakeRecord, VitalRecord } from "@/types/records";
import {
  countFlags,
  groupIntakesByBandHour,
  groupVitalEntriesByBandHour,
  sumForBand,
  sumForDay,
  sumForHour,
} from "../aggregate";

const D = "2026-08-14";

function intake(
  kind: "water" | "urine",
  h: number,
  m: number,
  ml: number,
  date = D
): IntakeRecord {
  const calDay = h < 14 ? "2026-08-15" : date;
  return {
    id: `${kind}-${h}-${m}-${ml}`,
    kind,
    recordedAt: `${calDay}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    recordDate: date,
    ml,
  };
}

describe("sumForHour / sumForDay（同一時間内の複数回入力は合算）", () => {
  const intakes = [
    intake("water", 15, 10, 150),
    intake("water", 15, 40, 100),
    intake("water", 16, 0, 200),
    intake("urine", 15, 20, 300),
  ];
  it("同じ15時の飲水2件が合算される", () => {
    expect(sumForHour(intakes, "water", D, 15)).toBe(250);
  });
  it("尿量は独立して集計される", () => {
    expect(sumForHour(intakes, "urine", D, 15)).toBe(300);
  });
  it("日合計", () => {
    expect(sumForDay(intakes, "water", D)).toBe(450);
    expect(sumForDay(intakes, "urine", D)).toBe(300);
  });
  it("別の記録日の分は含めない", () => {
    const other = [...intakes, intake("water", 15, 0, 999, "2026-08-13")];
    expect(sumForDay(other, "water", D)).toBe(450);
  });
});

describe("sumForBand（帯別小計）", () => {
  const intakes = [
    intake("water", 14, 0, 100), // 帯1
    intake("water", 21, 30, 50), // 帯1
    intake("water", 22, 0, 200), // 帯2
    intake("water", 3, 0, 30), // 帯2（翌暦日）
    intake("water", 6, 0, 40), // 帯3（翌暦日）
    intake("water", 13, 0, 60), // 帯3（翌暦日）
  ];
  it("帯1 = 14〜21時", () => {
    expect(sumForBand(intakes, "water", D, 1)).toBe(150);
  });
  it("帯2 = 22〜翌5時", () => {
    expect(sumForBand(intakes, "water", D, 2)).toBe(230);
  });
  it("帯3 = 翌6〜13時", () => {
    expect(sumForBand(intakes, "water", D, 3)).toBe(100);
  });
  it("3帯の合計 = 日合計（隙間なし）", () => {
    const total =
      sumForBand(intakes, "water", D, 1) +
      sumForBand(intakes, "water", D, 2) +
      sumForBand(intakes, "water", D, 3);
    expect(total).toBe(sumForDay(intakes, "water", D));
  });
});

describe("groupIntakesByBandHour（履歴グルーピング）", () => {
  const intakes = [
    intake("water", 15, 40, 100),
    intake("water", 15, 10, 150),
    intake("urine", 15, 20, 300),
    intake("water", 3, 0, 50),
  ];
  const groups = groupIntakesByBandHour(intakes, D);
  it("3帯が常に返る", () => {
    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.band)).toEqual([1, 2, 3]);
  });
  it("帯1の15時に飲水250/尿量300、個別3件が分昇順", () => {
    const h15 = groups[0].hours.find((h) => h.hour === 15)!;
    expect(h15.waterSum).toBe(250);
    expect(h15.urineSum).toBe(300);
    expect(h15.items.map((i) => i.ml)).toEqual([150, 300, 100]); // 10分,20分,40分
  });
  it("帯2に翌3時の記録", () => {
    expect(groups[1].hours.map((h) => h.hour)).toEqual([3]);
    expect(groups[1].waterSum).toBe(50);
  });
  it("記録の無い帯は時間行が空", () => {
    expect(groups[2].hours).toHaveLength(0);
  });
});

function vital(h: number, m: number, patch: Partial<VitalRecord> = {}): VitalRecord {
  const calDay = h < 14 ? "2026-08-15" : D;
  return {
    id: `v-${h}-${m}`,
    recordedAt: `${calDay}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    recordDate: D,
    temp: "",
    bpSys: "",
    bpDia: "",
    pulse: "",
    weight: "",
    ...patch,
  };
}

function flag(kind: "stool" | "meal", h: number): FlagRecord {
  const calDay = h < 14 ? "2026-08-15" : D;
  return {
    id: `f-${kind}-${h}-${Math.random()}`,
    kind,
    recordedAt: `${calDay}T${String(h).padStart(2, "0")}:00`,
    recordDate: D,
  };
}

describe("groupVitalEntriesByBandHour", () => {
  it("同時間の最新バイタルが行サマリになる", () => {
    const vitals = [vital(15, 10, { temp: "36.5" }), vital(15, 50, { temp: "37.8" })];
    const groups = groupVitalEntriesByBandHour(vitals, [], D);
    const h15 = groups[0].hours.find((h) => h.hour === 15)!;
    expect(h15.latestVital?.temp).toBe("37.8");
    expect(h15.items).toHaveLength(2);
  });
  it("便・食事は件数として集計される", () => {
    const flags = [flag("stool", 9), flag("stool", 9), flag("meal", 9)];
    const groups = groupVitalEntriesByBandHour([], flags, D);
    const h9 = groups[2].hours.find((h) => h.hour === 9)!;
    expect(h9.stoolCount).toBe(2);
    expect(h9.mealCount).toBe(1);
    expect(h9.latestVital).toBeNull();
  });
  it("記録が無い帯はempty", () => {
    const groups = groupVitalEntriesByBandHour([], [flag("meal", 8)], D);
    expect(groups[0].empty).toBe(true);
    expect(groups[1].empty).toBe(true);
    expect(groups[2].empty).toBe(false);
  });
});

describe("countFlags", () => {
  it("記録日・種別で数える", () => {
    const flags = [flag("stool", 9), flag("stool", 20), flag("meal", 12)];
    expect(countFlags(flags, "stool", D)).toBe(2);
    expect(countFlags(flags, "meal", D)).toBe(1);
    expect(countFlags(flags, "stool", "2026-08-13")).toBe(0);
  });
});
