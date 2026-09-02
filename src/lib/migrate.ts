/**
 * localStorage(zustand persist)データの移行・正規化。React/store に依存しない純粋関数群。
 *
 * 絶対に守ること:
 * - migratePersisted / healAppData は **絶対に throw しない**。persist の migrate/merge が例外を投げると
 *   onRehydrateStorage が (undefined, error) で呼ばれ setHasHydrated(true) に到達せず、AppShell が永久に白画面になる
 * - rebucketLegacyMedChecks は冪等ではない（v3 データにかけると毎朝のチェックが翌日へずれる）。
 *   version 1|2 からの移行経路でのみ呼ぶ
 * - タイミング名は結合キー（medChecks のキー・Medicine.timings・testid）。trim も含めて書き換えない
 * - hour 0 は正当な値。falsy 判定（`!hour` / `hour || x` / `filter(Boolean)`）は禁止
 *
 * 版の履歴:
 * - v1: Medicine.dose が自由入力文字列（"1mg" 等）
 * - v2: dose → doseAmount + doseUnit。記録日は14時起点（0〜13時の記録は recordDate の翌暦日の recordedAt を持つ）
 * - v3: 記録日=暦日（recordDate は recordedAt の暦日部分と常に一致）。timings が {name, weekdays} に。
 *       medChecks の 0〜13時のチェックは翌暦日へ移動
 */
import type {
  AppData,
  DoseUnit,
  FlagRecord,
  IntakeRecord,
  MedChecks,
  Medicine,
  Timing,
  VitalRecord,
  Weekday,
} from "@/types/records";
import { ALL_WEEKDAYS, DEFAULT_TIMINGS, DOSE_UNITS } from "./constants";
import { newId } from "./id";
import { makeTiming, parseDoseText } from "./meds";
import { addDays } from "./time";

export const PERSIST_VERSION = 3;

/** 旧モデル(v2以前)の記録日開始時刻。移行専用。time.ts には存在しない */
const LEGACY_DAY_START_HOUR = 14;

const RECORD_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** 秒付き('…T15:10:00')も前方一致で許容（hourOf/minuteOf は固定位置 slice なので無害） */
const RECORDED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

type Raw = Record<string, unknown>;

function isPlainObject(v: unknown): v is Raw {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isWeekday(v: unknown): v is Weekday {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 6;
}

function isHour(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 23;
}

/** 文字列化。JSON 由来でも toString が壊れたオブジェクトは変換で throw しうるので握って "" にする */
function str(v: unknown): string {
  if (v == null) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

/** 数値化（throw しない）。変換できなければ NaN */
function num(v: unknown): number {
  try {
    return Number(v);
  } catch {
    return NaN;
  }
}

function idOf(v: unknown): string {
  return typeof v === "string" && v ? v : newId();
}

/** 初期データ（毎回新しい配列を返す） */
export function initialAppData(): AppData {
  return {
    intakes: [],
    vitals: [],
    flags: [],
    medChecks: {},
    timings: DEFAULT_TIMINGS.map((n) => makeTiming(n)),
    medicines: [],
  };
}

// ---------------------------------------------------------------------------
// タイミング
// ---------------------------------------------------------------------------

/** weekdays を整形（整数0..6のみ・重複除去・昇順）。非配列/空になったら全曜日（曜日指定なし=毎日） */
export function normalizeWeekdays(v: unknown): Weekday[] {
  if (!Array.isArray(v)) return [...ALL_WEEKDAYS];
  const days = [...new Set(v.filter(isWeekday))].sort((a, b) => a - b);
  return days.length ? days : [...ALL_WEEKDAYS];
}

/** 旧形式の文字列 → 全曜日のタイミング、オブジェクト → weekdays 整形。名前は書き換えない */
export function normalizeTiming(v: unknown): Timing | null {
  if (typeof v === "string") return v ? makeTiming(v) : null;
  if (isPlainObject(v) && typeof v.name === "string" && v.name) {
    return { name: v.name, weekdays: normalizeWeekdays(v.weekdays) };
  }
  return null;
}

/** 非配列（キー欠損）→ 初期タイミング。配列 → 各要素を整形し名前重複は先勝ち。`[]` は `[]` のまま */
export function normalizeTimings(v: unknown): Timing[] {
  if (!Array.isArray(v)) return DEFAULT_TIMINGS.map((n) => makeTiming(n));
  const seen = new Set<string>();
  const out: Timing[] = [];
  for (const item of v) {
    const t = normalizeTiming(item);
    if (t && !seen.has(t.name)) {
      seen.add(t.name);
      out.push(t);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 形状のみの正規化（冪等・非破壊。persist の merge で毎回実行される）
// ---------------------------------------------------------------------------

/**
 * 欠損キーを既定値で埋め、timings を {name, weekdays} に揃える。
 * レコードの内容は検査しない（1件も捨てない）。配列中のオブジェクトでない要素だけ除く。
 * 日付2項目だけは文字列に揃える（欠けていると hourOf() の slice が描画中に throw するため）
 */
export function healAppData(raw: unknown): AppData {
  if (!isPlainObject(raw)) return initialAppData();
  const objs = <T>(v: unknown): T[] => (Array.isArray(v) ? (v.filter(isPlainObject) as T[]) : []);
  const dated = <T extends { recordedAt: string; recordDate: string }>(v: unknown): T[] =>
    objs<Raw>(v).map(
      (o) =>
        ({
          ...o,
          recordedAt: typeof o.recordedAt === "string" ? o.recordedAt : "",
          recordDate: typeof o.recordDate === "string" ? o.recordDate : "",
        }) as unknown as T
    );
  return {
    intakes: dated<IntakeRecord>(raw.intakes),
    vitals: dated<VitalRecord>(raw.vitals),
    flags: dated<FlagRecord>(raw.flags),
    medChecks: isPlainObject(raw.medChecks) ? (raw.medChecks as MedChecks) : {},
    timings: normalizeTimings(raw.timings),
    medicines: objs<Medicine>(raw.medicines),
  };
}

// ---------------------------------------------------------------------------
// 内容まで検査する正規化（migrate 内でのみ使う。型不正なレコードは除く）
// ---------------------------------------------------------------------------

/**
 * recordedAt が正しければ recordDate はその暦日に再導出（v3 の不変条件）。
 * recordedAt が不正でも recordDate が正しければ据え置き。両方不正なら null（どの画面にも出せない）
 */
function resolveDates(v: Raw): { recordedAt: string; recordDate: string } | null {
  const recordedAt = typeof v.recordedAt === "string" ? v.recordedAt : "";
  const recordDate = typeof v.recordDate === "string" ? v.recordDate : "";
  if (RECORDED_AT_RE.test(recordedAt)) return { recordedAt, recordDate: recordedAt.slice(0, 10) };
  if (RECORD_DATE_RE.test(recordDate)) return { recordedAt, recordDate };
  return null;
}

export function normalizeIntake(v: unknown): IntakeRecord | null {
  if (!isPlainObject(v)) return null;
  const dates = resolveDates(v);
  if (!dates) return null;
  if (v.kind !== "water" && v.kind !== "urine") return null;
  const ml = num(v.ml);
  if (!Number.isFinite(ml)) return null;
  return { id: idOf(v.id), kind: v.kind, ml, ...dates };
}

export function normalizeVital(v: unknown): VitalRecord | null {
  if (!isPlainObject(v)) return null;
  const dates = resolveDates(v);
  if (!dates) return null;
  return {
    id: idOf(v.id),
    ...dates,
    temp: str(v.temp),
    bpSys: str(v.bpSys),
    bpDia: str(v.bpDia),
    pulse: str(v.pulse),
    weight: str(v.weight),
  };
}

export function normalizeFlag(v: unknown): FlagRecord | null {
  if (!isPlainObject(v)) return null;
  const dates = resolveDates(v);
  if (!dates) return null;
  if (v.kind !== "stool" && v.kind !== "meal") return null;
  return { id: idOf(v.id), kind: v.kind, ...dates };
}

export function normalizeMedicine(v: unknown): Medicine | null {
  if (!isPlainObject(v)) return null;
  const doseUnit = (DOSE_UNITS as readonly string[]).includes(str(v.doseUnit))
    ? (v.doseUnit as DoseUnit)
    : "錠";
  return {
    id: idOf(v.id),
    name: str(v.name),
    doseAmount: str(v.doseAmount),
    doseUnit,
    timings: Array.isArray(v.timings)
      ? v.timings.filter((t): t is string => typeof t === "string")
      : [],
  };
}

/** hour は整数 0..23（数字文字列は数値化）。それ以外のエントリは除く。空になった日は除く */
export function normalizeMedChecks(v: unknown): MedChecks {
  if (!isPlainObject(v)) return {};
  const out: MedChecks = {};
  for (const [date, day] of Object.entries(v)) {
    if (!isPlainObject(day)) continue;
    const entries: Record<string, number> = {};
    for (const [timing, hour] of Object.entries(day)) {
      const h = typeof hour === "string" && hour.trim() !== "" ? Number(hour) : hour;
      if (isHour(h)) entries[timing] = h;
    }
    if (Object.keys(entries).length > 0) out[date] = entries;
  }
  return out;
}

export function normalizeAppData(raw: unknown): AppData {
  if (!isPlainObject(raw)) return initialAppData();
  const list = <T>(v: unknown, f: (x: unknown) => T | null): T[] =>
    Array.isArray(v) ? v.map(f).filter((x): x is T => x !== null) : [];
  return {
    intakes: list(raw.intakes, normalizeIntake),
    vitals: list(raw.vitals, normalizeVital),
    flags: list(raw.flags, normalizeFlag),
    medChecks: normalizeMedChecks(raw.medChecks),
    timings: normalizeTimings(raw.timings),
    medicines: list(raw.medicines, normalizeMedicine),
  };
}

// ---------------------------------------------------------------------------
// 一回限りの意味的移行
// ---------------------------------------------------------------------------

/**
 * 旧モデル(14時起点)の medChecks を暦日基準に並べ直す（冪等ではない。version 1|2 経由のみ）。
 * - hour >= 14: その記録日 = 暦日なので据え置き
 * - hour < 14: 実際は記録日の翌暦日なので addDays(+1) へ移動。移動先の (日付, タイミング) が
 *   既に埋まっていれば**元の日に据え置く**（削除しない。1件が1日ずれて残るだけでデータは失われない）
 * - 日付キーが 'YYYY-MM-DD' でないものは据え置き
 * 日付を降順に処理するため、移動先の埋まり具合は常に確定済みで結果はキー順序に依存しない
 */
export function rebucketLegacyMedChecks(checks: MedChecks): MedChecks {
  const out: MedChecks = {};
  const put = (date: string, timing: string, hour: number) => {
    (out[date] ??= {})[timing] = hour;
  };
  const occupied = (date: string, timing: string) => timing in (out[date] ?? {});

  // pass1: 据え置き分
  for (const [date, day] of Object.entries(checks)) {
    for (const [timing, hour] of Object.entries(day)) {
      if (!RECORD_DATE_RE.test(date) || hour >= LEGACY_DAY_START_HOUR) put(date, timing, hour);
    }
  }
  // pass2: 0〜13時を翌暦日へ（日付降順 = 翌日側の確定後に判断する）
  const dates = Object.keys(checks)
    .filter((d) => RECORD_DATE_RE.test(d))
    .sort()
    .reverse();
  for (const date of dates) {
    for (const [timing, hour] of Object.entries(checks[date])) {
      if (hour >= LEGACY_DAY_START_HOUR) continue;
      const target = addDays(date, 1);
      if (occupied(target, timing)) put(date, timing, hour);
      else put(target, timing, hour);
    }
  }
  return out;
}

/** v1 → v2: Medicine.dose（自由入力文字列）→ doseAmount + doseUnit。medicines が壊れていても throw しない */
export function migrateV1toV2(data: Raw): Raw {
  const meds = Array.isArray(data.medicines) ? data.medicines : [];
  return {
    ...data,
    medicines: meds.filter(isPlainObject).map((m) => {
      if (typeof m.doseAmount === "string") return m; // 既に v2 形式
      const { dose, ...rest } = m;
      return { ...rest, ...parseDoseText(typeof dose === "string" ? dose : "") };
    }),
  };
}

/** v2 → v3: 記録日を暦日へ（recordDate 再導出 + medChecks 移動）、timings に曜日を付与 */
export function migrateV2toV3(data: Raw): AppData {
  const base = normalizeAppData(data);
  return { ...base, medChecks: rebucketLegacyMedChecks(base.medChecks) };
}

/**
 * persist の migrate 本体。絶対に throw しない。
 * 未知/未来の version は初期化せず形状のみ整える（healAppData。内容は検査しない＝新しいビルドが書いた
 * 未知の kind 等も残す）。persist は version が一致しないだけで migrate を呼び、結果を描画前に
 * 書き戻すため、初期値を返すと全消去になる。
 * 例外時の退避先も healAppData（String()/Number() を呼ばないので再 throw しない）
 */
export function migratePersisted(persisted: unknown, version: number): AppData {
  try {
    if (!isPlainObject(persisted)) return initialAppData();
    if (version === 1) return migrateV2toV3(migrateV1toV2(persisted));
    if (version === 2) return migrateV2toV3(persisted);
    return healAppData(persisted);
  } catch {
    try {
      return healAppData(persisted);
    } catch {
      return initialAppData();
    }
  }
}
