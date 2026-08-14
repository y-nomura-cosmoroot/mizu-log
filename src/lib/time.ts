import type { RecordDate } from "@/types/records";
import type { BandNo } from "./constants";

/** 記録日の開始時刻。この時刻より前は前日の記録日に属する */
export const RECORD_DAY_START_HOUR = 14;

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** ローカルDateの暦日を 'YYYY-MM-DD' に整形 */
export function formatCalendarDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 実時刻が属する記録日（14時未満は前暦日） */
export function getRecordDate(now: Date): RecordDate {
  const d = new Date(now);
  if (d.getHours() < RECORD_DAY_START_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  return formatCalendarDate(d);
}

/** 時(0-23)が属する小計帯 */
export function band(h: number): BandNo {
  if (h >= 14 && h <= 21) return 1;
  if (h >= 22 || h <= 5) return 2;
  return 3;
}

/** 記録日の24時間を先頭から並べた配列 [14..23, 0..13] */
export const HOUR_CYCLE: ReadonlyArray<number> = [
  ...Array.from({ length: 10 }, (_, i) => i + 14),
  ...Array.from({ length: 14 }, (_, i) => i),
];

/** 記録日内の時刻順ソートキー（14時→0, 13時→23） */
export function hourOrder(h: number): number {
  return (h + 10) % 24;
}

/** 記録日+時+分 → 'YYYY-MM-DDTHH:mm'（0〜13時は記録日の翌暦日） */
export function toRecordedAt(recordDate: RecordDate, h: number, m: number): string {
  const [y, mo, d] = recordDate.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  if (h < RECORD_DAY_START_HOUR) {
    date.setDate(date.getDate() + 1);
  }
  return `${formatCalendarDate(date)}T${pad2(h)}:${pad2(m)}`;
}

export function hourOf(recordedAt: string): number {
  return Number(recordedAt.slice(11, 13));
}

export function minuteOf(recordedAt: string): number {
  return Number(recordedAt.slice(14, 16));
}

/** 'H:MM' 表示（履歴の個別記録用） */
export function formatTime(recordedAt: string): string {
  return `${hourOf(recordedAt)}:${recordedAt.slice(14, 16)}`;
}

/**
 * 記録に使う分。「今の記録日を表示中かつ選択時刻=現在時」なら現在分、それ以外は0分
 * （モックの targetWhen と同じ挙動）
 */
export function targetMinute(viewDate: RecordDate, selHour: number, now: Date): number {
  return viewDate === getRecordDate(now) && selHour === now.getHours()
    ? now.getMinutes()
    : 0;
}

export function addDays(recordDate: RecordDate, n: number): RecordDate {
  const [y, mo, d] = recordDate.split("-").map(Number);
  return formatCalendarDate(new Date(y, mo - 1, d + n));
}

const YOBI = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** '8/14(木)' 形式の日付ラベル */
export function formatDateLabel(recordDate: RecordDate): string {
  const [y, mo, d] = recordDate.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  return `${mo}/${d}(${YOBI[date.getDay()]})`;
}
