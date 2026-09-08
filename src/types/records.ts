export type RecordDate = string; // 'YYYY-MM-DD' の「記録日」（暦日。0:00〜23:59 が1日）

export type IntakeKind = "water" | "urine";

/** 飲水・尿量: 個別記録を全保持し、合計・小計は表示時に集計する */
export interface IntakeRecord {
  id: string;
  kind: IntakeKind;
  /** 'YYYY-MM-DDTHH:mm' ローカルnaive ISO（これが正）。暦日部分は recordDate と常に一致する */
  recordedAt: string;
  /** recordedAt から導出した記録日（集計キーとしての派生キャッシュ） */
  recordDate: RecordDate;
  ml: number;
}

/** バイタル: 1回の保存で入力済み項目をまとめて1レコード。空文字=未入力 */
export interface VitalRecord {
  id: string;
  recordedAt: string;
  recordDate: RecordDate;
  temp: string;
  bpSys: string;
  bpDia: string;
  pulse: string;
  weight: string;
}

export type FlagKind = "stool" | "meal";

/** 便・食事: 1タップ=1件の件数イベント */
export interface FlagRecord {
  id: string;
  kind: FlagKind;
  recordedAt: string;
  recordDate: RecordDate;
}

/** 時刻を持つ記録の種別。トーストからの時刻なおしで対象レコードを指すのに使う */
export type RecordKind = "intake" | "vital" | "flag";

/** 内服チェック実績: 記録日(暦日) × タイミング名 → チェック時に選択していた時(0-23) */
export type MedChecks = Record<RecordDate, Record<string, number>>;

/** 曜日。Date#getDay と同じ索引（0=日, 1=月, …, 6=土） */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 内服タイミングのマスタ1件。name が他データとの結合キー
 * （medChecks のキー・Medicine.timings・movedTiming・testid）。
 * weekdays は飲む曜日（昇順・重複なし・空にしない。旧データ/新規は全曜日）
 */
export interface Timing {
  name: string;
  weekdays: Weekday[];
}

/** 薬の量の単位 */
export type DoseUnit = "錠" | "袋" | "mg" | "g";

/** 薬マスタ */
export interface Medicine {
  id: string;
  name: string;
  /** 量の数値（number inputの値。""=未入力） */
  doseAmount: string;
  doseUnit: DoseUnit;
  /** 紐づくタイミング名 */
  timings: string[];
}

/** localStorage に永続化するデータ全体 */
export interface AppData {
  intakes: IntakeRecord[];
  vitals: VitalRecord[];
  flags: FlagRecord[];
  medChecks: MedChecks;
  timings: Timing[];
  medicines: Medicine[];
}
