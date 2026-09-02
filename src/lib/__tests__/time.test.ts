import { describe, expect, it } from "vitest";
import {
  addDays,
  band,
  elapsedMinutesInRecordDay,
  formatDateLabel,
  getRecordDate,
  HOURS,
  hourOf,
  minuteOf,
  parseRecordedAt,
  targetMinute,
  toRecordedAt,
  WEEKDAY_LABELS,
  weekdayIndexOf,
  weekdayOf,
} from "../time";

const D = "2026-08-14";

describe("getRecordDate（記録日=暦日）", () => {
  it("0:00は当日", () => {
    expect(getRecordDate(new Date(2026, 7, 14, 0, 0))).toBe(D);
  });
  it("13:59は当日", () => {
    expect(getRecordDate(new Date(2026, 7, 14, 13, 59))).toBe(D);
  });
  it("14:00は当日（14時起点ではない）", () => {
    expect(getRecordDate(new Date(2026, 7, 14, 14, 0))).toBe(D);
  });
  it("23:59は当日", () => {
    expect(getRecordDate(new Date(2026, 7, 14, 23, 59))).toBe(D);
  });
  it("月初の未明は当月1日（前月末日にならない）", () => {
    expect(getRecordDate(new Date(2026, 8, 1, 3, 0))).toBe("2026-09-01");
  });
  it("元日の未明は元日（前年の大晦日にならない）", () => {
    expect(getRecordDate(new Date(2027, 0, 1, 5, 0))).toBe("2027-01-01");
  });
});

describe("band（0〜7 / 8〜15 / 16〜23）", () => {
  it("帯1: 0時〜7時", () => {
    expect(band(0)).toBe(1);
    expect(band(7)).toBe(1);
  });
  it("帯2: 8時〜15時", () => {
    expect(band(8)).toBe(2);
    expect(band(15)).toBe(2);
  });
  it("帯3: 16時〜23時", () => {
    expect(band(16)).toBe(3);
    expect(band(23)).toBe(3);
  });
  it("境界: 7/8, 15/16, 23/0", () => {
    expect(band(7)).toBe(1);
    expect(band(8)).toBe(2);
    expect(band(15)).toBe(2);
    expect(band(16)).toBe(3);
    expect(band(23)).toBe(3);
    expect(band(0)).toBe(1);
  });
});

describe("HOURS", () => {
  it("0..23の24要素", () => {
    expect(HOURS).toHaveLength(24);
    expect(HOURS[0]).toBe(0);
    expect(HOURS[23]).toBe(23);
  });
  it("厳密に昇順", () => {
    for (let i = 1; i < HOURS.length; i++) {
      expect(HOURS[i]).toBeGreaterThan(HOURS[i - 1]);
    }
  });
});

describe("elapsedMinutesInRecordDay（0:00起点）", () => {
  it("0:00は0分", () => {
    expect(elapsedMinutesInRecordDay(0, 0)).toBe(0);
  });
  it("15:42は942分", () => {
    expect(elapsedMinutesInRecordDay(15, 42)).toBe(942);
  });
  it("23:59は1439分", () => {
    expect(elapsedMinutesInRecordDay(23, 59)).toBe(1439);
  });
});

describe("toRecordedAt（記録日と同一暦日）", () => {
  it("0時・13時台も記録日と同じ暦日（翌暦日にならない）", () => {
    expect(toRecordedAt(D, 0, 0)).toBe("2026-08-14T00:00");
    expect(toRecordedAt(D, 13, 59)).toBe("2026-08-14T13:59");
  });
  it("23時も同じ暦日", () => {
    expect(toRecordedAt(D, 23, 0)).toBe("2026-08-14T23:00");
  });
  it("月末の未明でも月を跨がない", () => {
    expect(toRecordedAt("2026-08-31", 3, 0)).toBe("2026-08-31T03:00");
  });
  it("大晦日の未明でも年を跨がない", () => {
    expect(toRecordedAt("2026-12-31", 6, 15)).toBe("2026-12-31T06:15");
  });
  it("hourOf / minuteOf で往復できる", () => {
    const at = toRecordedAt(D, 9, 5);
    expect(at).toBe("2026-08-14T09:05");
    expect(hourOf(at)).toBe(9);
    expect(minuteOf(at)).toBe(5);
  });
});

describe("parseRecordedAt", () => {
  it("'YYYY-MM-DDTHH:mm' をローカルDateに変換する", () => {
    expect(parseRecordedAt("2026-08-14T15:10")).toEqual(new Date(2026, 7, 14, 15, 10));
  });
  it("秒以下は無視する", () => {
    expect(parseRecordedAt("2026-08-14T15:10:30")).toEqual(new Date(2026, 7, 14, 15, 10));
  });
});

describe("targetMinute", () => {
  const now = new Date(2026, 7, 14, 15, 42); // 記録日 2026-08-14, 15:42
  it("今の記録日かつ選択時刻=現在時 → 現在分", () => {
    expect(targetMinute(D, 15, now)).toBe(42);
  });
  it("選択時刻が現在時と違う → 0分", () => {
    expect(targetMinute(D, 14, now)).toBe(0);
  });
  it("過去の記録日 → 0分", () => {
    expect(targetMinute("2026-08-13", 15, now)).toBe(0);
  });
});

describe("addDays", () => {
  it("前日・翌日", () => {
    expect(addDays(D, -1)).toBe("2026-08-13");
    expect(addDays(D, 1)).toBe("2026-08-15");
  });
  it("月を跨ぐ", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });
  it("年を跨ぐ", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });
  it("複数日のマイナス（2月末を跨ぐ）", () => {
    expect(addDays("2026-03-02", -3)).toBe("2026-02-27");
  });
});

describe("formatDateLabel", () => {
  it("'M/D(曜)' 形式（2026-08-14は金曜）", () => {
    expect(formatDateLabel(D)).toBe("8/14(金)");
  });
});

describe("weekdayIndexOf（Date#getDay と同じ索引）", () => {
  it("2026-08-14（金）→ 5", () => {
    expect(weekdayIndexOf(D)).toBe(5);
  });
  it("2026-08-16（日）→ 0", () => {
    expect(weekdayIndexOf("2026-08-16")).toBe(0);
  });
  it("2026-08-10（月）→ 1", () => {
    expect(weekdayIndexOf("2026-08-10")).toBe(1);
  });
  it("2026-01-01（木）→ 4", () => {
    expect(weekdayIndexOf("2026-01-01")).toBe(4);
  });
});

describe("weekdayOf / WEEKDAY_LABELS", () => {
  const week = [
    ["2026-08-09", "日"],
    ["2026-08-10", "月"],
    ["2026-08-11", "火"],
    ["2026-08-12", "水"],
    ["2026-08-13", "木"],
    ["2026-08-14", "金"],
    ["2026-08-15", "土"],
  ] as const;
  it.each(week)("%s → %s", (date, label) => {
    expect(weekdayOf(date)).toBe(label);
  });
  it("WEEKDAY_LABELS は日曜始まりの7要素", () => {
    expect(WEEKDAY_LABELS).toEqual(["日", "月", "火", "水", "木", "金", "土"]);
  });
  it("WEEKDAY_LABELS[weekdayIndexOf(d)] と weekdayOf(d) が一致する", () => {
    for (const [date] of week) {
      expect(WEEKDAY_LABELS[weekdayIndexOf(date)]).toBe(weekdayOf(date));
    }
  });
});
