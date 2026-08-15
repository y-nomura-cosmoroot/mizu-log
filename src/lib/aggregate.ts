import type {
  FlagKind,
  FlagRecord,
  IntakeKind,
  IntakeRecord,
  MedChecks,
  RecordDate,
  VitalRecord,
} from "@/types/records";
import { BAND_DEFS, type BandNo } from "./constants";
import { uncheckedTimings } from "./meds";
import { band, formatCalendarDate, hourOf, hourOrder, minuteOf } from "./time";

export function sumForHour(
  intakes: IntakeRecord[],
  kind: IntakeKind,
  date: RecordDate,
  h: number
): number {
  return intakes
    .filter((x) => x.kind === kind && x.recordDate === date && hourOf(x.recordedAt) === h)
    .reduce((a, x) => a + x.ml, 0);
}

export function sumForBand(
  intakes: IntakeRecord[],
  kind: IntakeKind,
  date: RecordDate,
  b: BandNo
): number {
  return intakes
    .filter(
      (x) => x.kind === kind && x.recordDate === date && band(hourOf(x.recordedAt)) === b
    )
    .reduce((a, x) => a + x.ml, 0);
}

export function sumForDay(
  intakes: IntakeRecord[],
  kind: IntakeKind,
  date: RecordDate
): number {
  return intakes
    .filter((x) => x.kind === kind && x.recordDate === date)
    .reduce((a, x) => a + x.ml, 0);
}

export interface IntakeHourGroup {
  hour: number;
  waterSum: number;
  urineSum: number;
  /** 分昇順（同分は飲水→尿量の順） */
  items: IntakeRecord[];
}

export interface IntakeBandGroup {
  band: BandNo;
  label: string;
  waterSum: number;
  urineSum: number;
  hours: IntakeHourGroup[];
}

/** 履歴(飲水量/尿量)用: 帯→時→個別記録のグルーピング */
export function groupIntakesByBandHour(
  intakes: IntakeRecord[],
  date: RecordDate
): IntakeBandGroup[] {
  const dayItems = intakes.filter((x) => x.recordDate === date);
  return BAND_DEFS.map(({ band: bn, label }) => {
    const bandItems = dayItems.filter((x) => band(hourOf(x.recordedAt)) === bn);
    const hours = [...new Set(bandItems.map((x) => hourOf(x.recordedAt)))].sort(
      (a, b) => hourOrder(a) - hourOrder(b)
    );
    return {
      band: bn,
      label,
      waterSum: bandItems
        .filter((x) => x.kind === "water")
        .reduce((a, x) => a + x.ml, 0),
      urineSum: bandItems
        .filter((x) => x.kind === "urine")
        .reduce((a, x) => a + x.ml, 0),
      hours: hours.map((h) => {
        const hourItems = bandItems.filter((x) => hourOf(x.recordedAt) === h);
        const water = hourItems.filter((x) => x.kind === "water");
        const urine = hourItems.filter((x) => x.kind === "urine");
        return {
          hour: h,
          waterSum: water.reduce((a, x) => a + x.ml, 0),
          urineSum: urine.reduce((a, x) => a + x.ml, 0),
          items: [...water, ...urine].sort(
            (a, b) => minuteOf(a.recordedAt) - minuteOf(b.recordedAt)
          ),
        };
      }),
    };
  });
}

export type VitalHistoryItem =
  | { type: "vital"; vital: VitalRecord }
  | { type: "flag"; flag: FlagRecord };

/** 時間行サマリ: 項目ごとに「その時間の最新の非空値」をマージしたもの */
export interface VitalHourSummary {
  temp: string;
  bpSys: string;
  bpDia: string;
  pulse: string;
  weight: string;
}

/**
 * バイタルは全項目任意のため、同じ時間に部分入力のレコードが複数あり得る
 * （例: 1回目=体温+体重、2回目=血圧+脈拍）。最新1レコードだけをサマリにすると
 * 先の記録の項目が消えるので、項目ごとに最新の非空値を採用する。
 * 血圧は上下をペアで扱う（上が入っているレコードの上下を採用）。
 */
function mergeVitalSummary(hourVitals: VitalRecord[]): VitalHourSummary | null {
  if (hourVitals.length === 0) return null;
  const summary: VitalHourSummary = {
    temp: "",
    bpSys: "",
    bpDia: "",
    pulse: "",
    weight: "",
  };
  // hourVitals は分昇順（同分は入力順）なので、後のレコードで上書きすれば最新値が残る
  for (const v of hourVitals) {
    if (v.temp) summary.temp = v.temp;
    if (v.bpSys) {
      summary.bpSys = v.bpSys;
      summary.bpDia = v.bpDia;
    }
    if (v.pulse) summary.pulse = v.pulse;
    if (v.weight) summary.weight = v.weight;
  }
  return summary;
}

export interface VitalHourGroup {
  hour: number;
  /** 行サマリ（その時間にバイタルが無ければnull） */
  summary: VitalHourSummary | null;
  stoolCount: number;
  mealCount: number;
  items: VitalHistoryItem[];
}

export interface VitalBandGroup {
  band: BandNo;
  label: string;
  empty: boolean;
  hours: VitalHourGroup[];
}

/** 履歴(バイタル)用: バイタル+便・食事を帯→時でグルーピング */
export function groupVitalEntriesByBandHour(
  vitals: VitalRecord[],
  flags: FlagRecord[],
  date: RecordDate
): VitalBandGroup[] {
  const dayVitals = vitals.filter((v) => v.recordDate === date);
  const dayFlags = flags.filter((f) => f.recordDate === date);
  return BAND_DEFS.map(({ band: bn, label }) => {
    const bandVitals = dayVitals.filter((v) => band(hourOf(v.recordedAt)) === bn);
    const bandFlags = dayFlags.filter((f) => band(hourOf(f.recordedAt)) === bn);
    const hours = [
      ...new Set([
        ...bandVitals.map((v) => hourOf(v.recordedAt)),
        ...bandFlags.map((f) => hourOf(f.recordedAt)),
      ]),
    ].sort((a, b) => hourOrder(a) - hourOrder(b));
    return {
      band: bn,
      label,
      empty: hours.length === 0,
      hours: hours.map((h) => {
        const hourVitals = bandVitals
          .filter((v) => hourOf(v.recordedAt) === h)
          .sort((a, b) => minuteOf(a.recordedAt) - minuteOf(b.recordedAt));
        const hourFlags = bandFlags.filter((f) => hourOf(f.recordedAt) === h);
        const items: VitalHistoryItem[] = [
          ...hourVitals.map((vital) => ({ type: "vital" as const, vital })),
          ...hourFlags.map((flag) => ({ type: "flag" as const, flag })),
        ];
        return {
          hour: h,
          summary: mergeVitalSummary(hourVitals),
          stoolCount: hourFlags.filter((f) => f.kind === "stool").length,
          mealCount: hourFlags.filter((f) => f.kind === "meal").length,
          items,
        };
      }),
    };
  });
}

export function countFlags(
  flags: FlagRecord[],
  kind: FlagKind,
  date: RecordDate
): number {
  return flags.filter((f) => f.kind === kind && f.recordDate === date).length;
}

/** 月ごと一覧の1日分サマリ */
export interface MonthlyDaySummary {
  date: RecordDate;
  day: number;
  waterMl: number;
  urineMl: number;
  stoolCount: number;
  mealCount: number;
  /** 何かしらの記録（飲水/尿・バイタル・便食事・内服チェック）がある日か */
  hasRecords: boolean;
  /** 飲み忘れ表示。記録がない日は判定しない（アプリ利用前の日が全部⚠️になるのを防ぐ） */
  medsMissed: boolean;
}

/**
 * 月ごと表示用: 指定月の1日〜末日（今日の記録日より後は除く）を日別サマリにする。
 * 未来月を指定した場合は空配列。
 */
export function buildMonthlySummary(
  intakes: IntakeRecord[],
  vitals: VitalRecord[],
  flags: FlagRecord[],
  medChecks: MedChecks,
  timings: string[],
  year: number,
  month0: number,
  todayRecordDate: RecordDate
): MonthlyDaySummary[] {
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  const out: MonthlyDaySummary[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const date = formatCalendarDate(new Date(year, month0, d));
    if (date > todayRecordDate) break;
    const waterMl = sumForDay(intakes, "water", date);
    const urineMl = sumForDay(intakes, "urine", date);
    const stoolCount = countFlags(flags, "stool", date);
    const mealCount = countFlags(flags, "meal", date);
    const hasVital = vitals.some((v) => v.recordDate === date);
    const hasCheck = Object.keys(medChecks[date] ?? {}).length > 0;
    const hasRecords =
      waterMl > 0 || urineMl > 0 || stoolCount > 0 || mealCount > 0 || hasVital || hasCheck;
    const medsMissed =
      hasRecords && uncheckedTimings(timings, medChecks, date).length > 0;
    out.push({
      date,
      day: d,
      waterMl,
      urineMl,
      stoolCount,
      mealCount,
      hasRecords,
      medsMissed,
    });
  }
  return out;
}
