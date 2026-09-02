import type { RecordDate, Weekday } from "@/types/records";
import type { BandNo } from "./constants";

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** ローカルDateの暦日を 'YYYY-MM-DD' に整形 */
export function formatCalendarDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 実時刻が属する記録日（記録日=暦日。0:00〜23:59 が1日） */
export function getRecordDate(now: Date): RecordDate {
  return formatCalendarDate(now);
}

/** 記録日開始(0:00)からの経過分 */
export function elapsedMinutesInRecordDay(h: number, m: number): number {
  return h * 60 + m;
}

/** 時(0-23)が属する小計帯（0〜7時=1 / 8〜15時=2 / 16〜23時=3） */
export function band(h: number): BandNo {
  if (h < 8) return 1;
  if (h < 16) return 2;
  return 3;
}

/** 時間セレクタが並べる記録日の24時間 [0..23] */
export const HOURS: ReadonlyArray<number> = Array.from({ length: 24 }, (_, i) => i);

/** 記録日+時+分 → 'YYYY-MM-DDTHH:mm'（記録日=暦日なので日付はそのまま） */
export function toRecordedAt(recordDate: RecordDate, h: number, m: number): string {
  return `${recordDate}T${pad2(h)}:${pad2(m)}`;
}

export function hourOf(recordedAt: string): number {
  return Number(recordedAt.slice(11, 13));
}

export function minuteOf(recordedAt: string): number {
  return Number(recordedAt.slice(14, 16));
}

/** 'YYYY-MM-DDTHH:mm' → ローカルDate（秒以下は無視） */
export function parseRecordedAt(recordedAt: string): Date {
  const [y, mo, d] = recordedAt.slice(0, 10).split("-").map(Number);
  return new Date(y, mo - 1, d, hourOf(recordedAt), minuteOf(recordedAt));
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

function toDate(recordDate: RecordDate): Date {
  const [y, mo, d] = recordDate.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

export function addDays(recordDate: RecordDate, n: number): RecordDate {
  const [y, mo, d] = recordDate.split("-").map(Number);
  return formatCalendarDate(new Date(y, mo - 1, d + n));
}

/** 曜日ラベル。index は Date#getDay と同じ（0=日 … 6=土）。チップの表示順は constants の WEEKDAY_ORDER */
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 記録日の曜日index（0=日 … 6=土） */
export function weekdayIndexOf(recordDate: RecordDate): Weekday {
  return toDate(recordDate).getDay() as Weekday;
}

/** '8/14(木)' 形式の日付ラベル */
export function formatDateLabel(recordDate: RecordDate): string {
  const [, mo, d] = recordDate.split("-").map(Number);
  return `${mo}/${d}(${WEEKDAY_LABELS[weekdayIndexOf(recordDate)]})`;
}

/** 記録日の曜日1文字（'土' 等。月ごと一覧の行メタ用） */
export function weekdayOf(recordDate: RecordDate): string {
  return WEEKDAY_LABELS[weekdayIndexOf(recordDate)];
}
