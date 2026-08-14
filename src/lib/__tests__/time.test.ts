import { describe, expect, it } from "vitest";
import {
  addDays,
  band,
  formatDateLabel,
  getRecordDate,
  HOUR_CYCLE,
  hourOf,
  hourOrder,
  minuteOf,
  targetMinute,
  toRecordedAt,
} from "../time";

describe("getRecordDate（記録日は14時起点）", () => {
  it("14:00ちょうどは当日", () => {
    expect(getRecordDate(new Date(2026, 7, 14, 14, 0))).toBe("2026-08-14");
  });
  it("13:59は前日", () => {
    expect(getRecordDate(new Date(2026, 7, 14, 13, 59))).toBe("2026-08-13");
  });
  it("0:30は前日", () => {
    expect(getRecordDate(new Date(2026, 7, 14, 0, 30))).toBe("2026-08-13");
  });
  it("23:59は当日", () => {
    expect(getRecordDate(new Date(2026, 7, 14, 23, 59))).toBe("2026-08-14");
  });
  it("月初の0時は前月末日", () => {
    expect(getRecordDate(new Date(2026, 8, 1, 3, 0))).toBe("2026-08-31");
  });
  it("元日の0時は前年の大晦日", () => {
    expect(getRecordDate(new Date(2027, 0, 1, 5, 0))).toBe("2026-12-31");
  });
});

describe("band（8時間×3帯）", () => {
  it("帯1: 14時〜21時", () => {
    expect(band(14)).toBe(1);
    expect(band(21)).toBe(1);
  });
  it("帯2: 22時〜翌5時", () => {
    expect(band(22)).toBe(2);
    expect(band(23)).toBe(2);
    expect(band(0)).toBe(2);
    expect(band(5)).toBe(2);
  });
  it("帯3: 翌6時〜翌13時", () => {
    expect(band(6)).toBe(3);
    expect(band(13)).toBe(3);
  });
  it("境界: 5/6, 13/14, 21/22", () => {
    expect(band(5)).toBe(2);
    expect(band(6)).toBe(3);
    expect(band(13)).toBe(3);
    expect(band(14)).toBe(1);
    expect(band(21)).toBe(1);
    expect(band(22)).toBe(2);
  });
});

describe("HOUR_CYCLE / hourOrder", () => {
  it("HOUR_CYCLEは14..23,0..13の24要素", () => {
    expect(HOUR_CYCLE).toHaveLength(24);
    expect(HOUR_CYCLE[0]).toBe(14);
    expect(HOUR_CYCLE[9]).toBe(23);
    expect(HOUR_CYCLE[10]).toBe(0);
    expect(HOUR_CYCLE[23]).toBe(13);
  });
  it("hourOrderで記録日内の時刻順に並ぶ", () => {
    const sorted = [15, 3, 22, 14].sort((a, b) => hourOrder(a) - hourOrder(b));
    expect(sorted).toEqual([14, 15, 22, 3]);
  });
});

describe("toRecordedAt（0〜13時は記録日の翌暦日）", () => {
  it("14時以降は記録日と同じ暦日", () => {
    expect(toRecordedAt("2026-08-14", 15, 30)).toBe("2026-08-14T15:30");
    expect(toRecordedAt("2026-08-14", 23, 0)).toBe("2026-08-14T23:00");
  });
  it("0〜13時は翌暦日", () => {
    expect(toRecordedAt("2026-08-14", 0, 0)).toBe("2026-08-15T00:00");
    expect(toRecordedAt("2026-08-14", 13, 59)).toBe("2026-08-15T13:59");
  });
  it("月末を跨ぐ", () => {
    expect(toRecordedAt("2026-08-31", 3, 0)).toBe("2026-09-01T03:00");
  });
  it("年末を跨ぐ", () => {
    expect(toRecordedAt("2026-12-31", 6, 15)).toBe("2027-01-01T06:15");
  });
  it("hourOf / minuteOf で往復できる", () => {
    const at = toRecordedAt("2026-08-14", 9, 5);
    expect(hourOf(at)).toBe(9);
    expect(minuteOf(at)).toBe(5);
  });
});

describe("targetMinute", () => {
  const now = new Date(2026, 7, 14, 15, 42); // 記録日 2026-08-14, 15:42
  it("今の記録日かつ選択時刻=現在時 → 現在分", () => {
    expect(targetMinute("2026-08-14", 15, now)).toBe(42);
  });
  it("選択時刻が現在時と違う → 0分", () => {
    expect(targetMinute("2026-08-14", 14, now)).toBe(0);
  });
  it("過去の記録日 → 0分", () => {
    expect(targetMinute("2026-08-13", 15, now)).toBe(0);
  });
});

describe("addDays / formatDateLabel", () => {
  it("前日・翌日", () => {
    expect(addDays("2026-08-14", -1)).toBe("2026-08-13");
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });
  it("日付ラベル（2026-08-14は金曜）", () => {
    expect(formatDateLabel("2026-08-14")).toBe("8/14(金)");
  });
});
