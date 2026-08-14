import type {
  FlagKind,
  FlagRecord,
  IntakeKind,
  IntakeRecord,
  RecordDate,
  VitalRecord,
} from "@/types/records";
import { BAND_DEFS, type BandNo } from "./constants";
import { band, hourOf, hourOrder, minuteOf } from "./time";

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

export interface VitalHourGroup {
  hour: number;
  /** 行サマリ用: その時間の最新バイタル（無ければnull） */
  latestVital: VitalRecord | null;
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
          latestVital: hourVitals.length ? hourVitals[hourVitals.length - 1] : null,
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
