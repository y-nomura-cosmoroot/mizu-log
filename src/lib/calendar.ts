import type { RecordDate } from "@/types/records";
import { formatCalendarDate, pad2 } from "./time";

export interface CalendarCell {
  key: string;
  /** 空文字は月初前の空セル */
  label: string;
  date: RecordDate | null;
  disabled: boolean;
  selected: boolean;
  isToday: boolean;
}

/**
 * 月カレンダーのセルを生成する。
 * 未来日（今日の記録日より後）は disabled。
 */
export function buildCalendarCells(
  year: number,
  month0: number,
  viewDate: RecordDate,
  todayRecordDate: RecordDate
): CalendarCell[] {
  const startDow = new Date(year, month0, 1).getDay();
  const nDays = new Date(year, month0 + 1, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({
      key: `blank-${i}`,
      label: "",
      date: null,
      disabled: true,
      selected: false,
      isToday: false,
    });
  }
  for (let d = 1; d <= nDays; d++) {
    const date = formatCalendarDate(new Date(year, month0, d));
    cells.push({
      key: date,
      label: String(d),
      date,
      disabled: date > todayRecordDate,
      selected: date === viewDate,
      isToday: date === todayRecordDate,
    });
  }
  return cells;
}

/** '2026年8月' 形式のカレンダー見出し */
export function formatCalendarLabel(year: number, month0: number): string {
  return `${year}年${month0 + 1}月`;
}

/** RecordDate から年・月(0始まり)を取り出す */
export function ymOf(date: RecordDate): { year: number; month0: number } {
  const [y, m] = date.split("-").map(Number);
  return { year: y, month0: m - 1 };
}

export { pad2 };
