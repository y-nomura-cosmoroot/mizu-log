import type { DoseUnit, MedChecks, Medicine, RecordDate } from "@/types/records";
import { BAND_DEFS, type BandNo } from "./constants";
import { band, hourOrder } from "./time";

/** その記録日に未チェックのタイミング一覧（常に現在のマスタ基準で判定） */
export function uncheckedTimings(
  timings: string[],
  medChecks: MedChecks,
  date: RecordDate
): string[] {
  const checks = medChecks[date] ?? {};
  return timings.filter((t) => checks[t] == null);
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

/** タイミングの並び順で薬をソート（最小タイミングindex順、タグ無しは最後） */
export function sortMedicines(medicines: Medicine[], timings: string[]): Medicine[] {
  const ix = (m: Medicine) => {
    const idxs = m.timings
      .map((t) => timings.indexOf(t))
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

/** 履歴(おくすり)用: チェック実績を帯→時でグルーピング */
export function groupMedChecksByBandHour(
  timings: string[],
  medChecks: MedChecks,
  date: RecordDate
): MedsBandGroup[] {
  const checks = medChecks[date] ?? {};
  const entries: MedCheckEntry[] = timings
    .filter((t) => checks[t] != null)
    .map((t) => ({ timing: t, hour: checks[t] }));
  return BAND_DEFS.map(({ band: bn, label }) => {
    const bandEntries = entries.filter((e) => band(e.hour) === bn);
    const hours = [...new Set(bandEntries.map((e) => e.hour))].sort(
      (a, b) => hourOrder(a) - hourOrder(b)
    );
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
