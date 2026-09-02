import type {
  DoseUnit,
  MedChecks,
  Medicine,
  RecordDate,
  Timing,
  Weekday,
} from "@/types/records";
import { ALL_WEEKDAYS, BAND_DEFS, type BandNo } from "./constants";
import { band, weekdayIndexOf } from "./time";

/** タイミング1件を作る（既定=全曜日。store初期値・addTiming・migrateで共用） */
export function makeTiming(name: string, weekdays: readonly Weekday[] = ALL_WEEKDAYS): Timing {
  return { name, weekdays: [...weekdays] };
}

/** 名前だけの配列（Reactキー・薬タグ・sortMedicines用） */
export function timingNames(timings: Timing[]): string[] {
  return timings.map((t) => t.name);
}

/** その記録日の曜日に飲む対象か */
export function isTimingActiveOn(t: Timing, date: RecordDate): boolean {
  return t.weekdays.includes(weekdayIndexOf(date));
}

/** その記録日に飲む対象のタイミング（マスタ順） */
export function activeTimings(timings: Timing[], date: RecordDate): Timing[] {
  return timings.filter((t) => isTimingActiveOn(t, date));
}

/** その日のチェック表にタイミング名が own property として存在するか（"toString" 等の名前で prototype を拾わない） */
export function hasCheck(dayChecks: Record<string, number>, timing: string): boolean {
  return Object.prototype.hasOwnProperty.call(dayChecks, timing) && dayChecks[timing] != null;
}

/**
 * その記録日に未チェックのタイミング名（常に現在のマスタ基準で判定）。
 * その日の曜日に飲まないタイミングは判定しない（飲み忘れ扱いにしない）
 */
export function uncheckedTimings(
  timings: Timing[],
  medChecks: MedChecks,
  date: RecordDate
): string[] {
  const checks = medChecks[date] ?? {};
  return activeTimings(timings, date)
    .filter((t) => !hasCheck(checks, t.name))
    .map((t) => t.name);
}

/** 薬1件の量表示（"1錠" "250mg" 等。未入力なら空文字） */
export function doseLabel(m: Pick<Medicine, "doseAmount" | "doseUnit">): string {
  return m.doseAmount ? `${m.doseAmount}${m.doseUnit}` : "";
}

/** タイミングに紐づく薬の表示文字列 */
export function medsForTiming(medicines: Medicine[], timing: string): string {
  const list = medicines
    .filter((m) => m.timings.includes(timing))
    .map((m) => (doseLabel(m) ? `${m.name} ${doseLabel(m)}` : m.name));
  return list.length ? list.join(" ・ ") : "（くすりの登録なし）";
}

/**
 * 旧スキーマ(v1)の自由入力 dose 文字列を数値+単位に変換する（persistのmigrate用）。
 * 例: "1mg"→{1, mg}, "2錠"→{2, 錠}, 解釈できない部分は数値のみ/デフォルト単位「錠」
 */
export function parseDoseText(dose: string): { doseAmount: string; doseUnit: DoseUnit } {
  const amountMatch = dose.match(/([0-9]+(?:\.[0-9]+)?)/);
  const doseAmount = amountMatch ? amountMatch[1] : "";
  // "mg" は "g" を部分文字列に含むため先に判定する
  const doseUnit: DoseUnit = dose.includes("mg")
    ? "mg"
    : dose.includes("g")
      ? "g"
      : dose.includes("袋")
        ? "袋"
        : "錠";
  return { doseAmount, doseUnit };
}

/** タイミング名の並び順で薬をソート（最小タイミングindex順、タグ無しは最後） */
export function sortMedicines(medicines: Medicine[], names: string[]): Medicine[] {
  const ix = (m: Medicine) => {
    const idxs = m.timings
      .map((t) => names.indexOf(t))
      .filter((i) => i >= 0);
    return idxs.length ? Math.min(...idxs) : Number.MAX_SAFE_INTEGER;
  };
  return [...medicines].sort((a, b) => ix(a) - ix(b));
}

export interface MedCheckEntry {
  timing: string;
  hour: number;
}

export interface MedsHourGroup {
  hour: number;
  entries: MedCheckEntry[];
}

export interface MedsBandGroup {
  band: BandNo;
  label: string;
  empty: boolean;
  hours: MedsHourGroup[];
}

/**
 * 履歴(おくすり)用: チェック実績を帯→時でグルーピング。
 * 実績は曜日に関係なく全タイミングを対象にする（対象外の曜日に付けたチェックも事実として残す）
 */
export function groupMedChecksByBandHour(
  timings: Timing[],
  medChecks: MedChecks,
  date: RecordDate
): MedsBandGroup[] {
  const checks = medChecks[date] ?? {};
  const entries: MedCheckEntry[] = timingNames(timings)
    .filter((t) => hasCheck(checks, t))
    .map((t) => ({ timing: t, hour: checks[t] }));
  return BAND_DEFS.map(({ band: bn, label }) => {
    const bandEntries = entries.filter((e) => band(e.hour) === bn);
    const hours = [...new Set(bandEntries.map((e) => e.hour))].sort((a, b) => a - b);
    return {
      band: bn,
      label,
      empty: hours.length === 0,
      hours: hours.map((h) => ({
        hour: h,
        entries: bandEntries.filter((e) => e.hour === h),
      })),
    };
  });
}
