import { describe, expect, it } from "vitest";
import { buildCalendarCells, formatCalendarLabel, ymOf } from "../calendar";

describe("buildCalendarCells", () => {
  // 2026年8月: 8/1は土曜(dow=6)、31日まで
  const cells = buildCalendarCells(2026, 7, "2026-08-12", "2026-08-14");

  it("月初の曜日分の空セル+日数分のセル", () => {
    expect(cells).toHaveLength(6 + 31);
    expect(cells[0].label).toBe("");
    expect(cells[6].label).toBe("1");
  });
  it("未来日（今日の記録日より後）はdisabled", () => {
    const d15 = cells.find((c) => c.date === "2026-08-15")!;
    const d14 = cells.find((c) => c.date === "2026-08-14")!;
    expect(d15.disabled).toBe(true);
    expect(d14.disabled).toBe(false);
  });
  it("今日と選択日のフラグ", () => {
    expect(cells.find((c) => c.date === "2026-08-14")!.isToday).toBe(true);
    expect(cells.find((c) => c.date === "2026-08-12")!.selected).toBe(true);
  });
});

describe("formatCalendarLabel / ymOf", () => {
  it("年月ラベル", () => {
    expect(formatCalendarLabel(2026, 7)).toBe("2026年8月");
  });
  it("RecordDateから年月を取り出す", () => {
    expect(ymOf("2026-08-14")).toEqual({ year: 2026, month0: 7 });
  });
});
