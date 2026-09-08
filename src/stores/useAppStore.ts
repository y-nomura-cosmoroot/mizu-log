import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AppData,
  FlagKind,
  IntakeKind,
  Medicine,
  RecordDate,
  RecordKind,
  VitalRecord,
  Weekday,
} from "@/types/records";
import { STORAGE_KEY } from "@/lib/constants";
import { newId } from "@/lib/id";
import { makeTiming } from "@/lib/meds";
import {
  PERSIST_VERSION,
  healAppData,
  initialAppData,
  migratePersisted,
} from "@/lib/migrate";
import { toRecordedAt } from "@/lib/time";

export interface VitalInput {
  temp: string;
  bpSys: string;
  bpDia: string;
  pulse: string;
  weight: string;
}

interface AppStore extends AppData {
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  /** 追加したレコードのidを返す（トーストの「◯時になおす」が対象を指すのに使う） */
  addIntake: (kind: IntakeKind, ml: number, date: RecordDate, h: number, m: number) => string;
  updateIntakeMl: (id: string, ml: number) => void;
  deleteIntake: (id: string) => void;

  addVital: (input: VitalInput, date: RecordDate, h: number, m: number) => string;
  updateVital: (id: string, patch: VitalInput) => void;
  deleteVital: (id: string) => void;

  addFlag: (kind: FlagKind, date: RecordDate, h: number, m: number) => string;
  deleteFlag: (id: string) => void;

  /**
   * 記録の時刻だけを差し替える（記録日=暦日は変えないので v3 の不変条件を保つ）。
   * 記録する時間がズレたまま記録したときの「◯時になおす」用
   */
  retimeRecord: (kind: RecordKind, id: string, h: number, m: number) => void;

  /** チェック済みなら解除、未チェックなら hour でチェック */
  toggleMedCheck: (date: RecordDate, timing: string, hour: number) => void;

  addTiming: (name: string) => void;
  removeTiming: (name: string) => void;
  moveTiming: (index: number, delta: number) => void;
  /** 曜日のON/OFF。最後の1曜日は外せない（その場合は状態を変えない） */
  toggleTimingWeekday: (name: string, weekday: Weekday) => void;

  addMedicine: () => void;
  addMedicineWithName: (draft: Pick<Medicine, "name" | "doseAmount" | "doseUnit">) => void;
  updateMedicine: (
    id: string,
    patch: Partial<Pick<Medicine, "name" | "doseAmount" | "doseUnit">>
  ) => void;
  deleteMedicine: (id: string) => void;
  toggleMedicineTiming: (id: string, timing: string) => void;
}

/**
 * 移行前の生エンベロープを別キーへ1回だけ退避する（UIなしの内部退避。失敗しても無視）。
 * persist は移行結果を描画前に即書き戻すため、これが無いと旧データへ戻す手段が無い
 */
function snapshotLegacy(persisted: unknown, version: number): void {
  try {
    if (typeof localStorage === "undefined") return;
    const key = `${STORAGE_KEY}.bak.v${version}`;
    if (localStorage.getItem(key) != null) return;
    localStorage.setItem(key, JSON.stringify({ state: persisted, version }));
  } catch {
    // 退避は best effort
  }
}

/** 予約語をタイミング名にすると medChecks のキーとして prototype を拾ってしまうため弾く */
function isReservedTimingName(name: string): boolean {
  return name === "__proto__" || Object.prototype.hasOwnProperty.call(Object.prototype, name);
}

/**
 * localStorage の薄いラッパ。JSON が壊れていたら（読める形で別キーに退避して）無かったことにし、
 * 容量超過などの書き込み失敗は握る。hydrate の途中で throw すると setHasHydrated(true) に到達せず
 * 白画面になるため、ここでも例外を外に出さない
 */
const safeLocalStorage = () => ({
  getItem: (key: string): string | null => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return null;
      JSON.parse(raw); // 破損チェックのみ（本体の parse は createJSONStorage が行う）
      return raw;
    } catch {
      try {
        const raw = localStorage.getItem(key);
        if (raw != null) localStorage.setItem(key + ".corrupt", raw);
      } catch {
        // 退避も失敗したら諦める
      }
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // 容量超過など。次回の書き込みで再試行される
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
});

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialAppData(),
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      addIntake: (kind, ml, date, h, m) => {
        const id = newId();
        set((s) => ({
          intakes: [
            ...s.intakes,
            { id, kind, ml, recordDate: date, recordedAt: toRecordedAt(date, h, m) },
          ],
        }));
        return id;
      },
      updateIntakeMl: (id, ml) =>
        set((s) => ({
          intakes: s.intakes.map((x) => (x.id === id ? { ...x, ml } : x)),
        })),
      deleteIntake: (id) =>
        set((s) => ({ intakes: s.intakes.filter((x) => x.id !== id) })),

      addVital: (input, date, h, m) => {
        const id = newId();
        set((s) => ({
          vitals: [
            ...s.vitals,
            {
              id,
              recordDate: date,
              recordedAt: toRecordedAt(date, h, m),
              ...input,
            } satisfies VitalRecord,
          ],
        }));
        return id;
      },
      updateVital: (id, patch) =>
        set((s) => ({
          vitals: s.vitals.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),
      deleteVital: (id) =>
        set((s) => ({ vitals: s.vitals.filter((v) => v.id !== id) })),

      addFlag: (kind, date, h, m) => {
        const id = newId();
        set((s) => ({
          flags: [
            ...s.flags,
            { id, kind, recordDate: date, recordedAt: toRecordedAt(date, h, m) },
          ],
        }));
        return id;
      },
      deleteFlag: (id) =>
        set((s) => ({ flags: s.flags.filter((f) => f.id !== id) })),

      // recordDate は据え置いたまま recordedAt の時刻部分だけ作り直す（暦日はズレない）
      retimeRecord: (kind, id, h, m) =>
        set((s) => {
          if (kind === "intake")
            return {
              intakes: s.intakes.map((x) =>
                x.id === id ? { ...x, recordedAt: toRecordedAt(x.recordDate, h, m) } : x
              ),
            };
          if (kind === "vital")
            return {
              vitals: s.vitals.map((x) =>
                x.id === id ? { ...x, recordedAt: toRecordedAt(x.recordDate, h, m) } : x
              ),
            };
          return {
            flags: s.flags.map((x) =>
              x.id === id ? { ...x, recordedAt: toRecordedAt(x.recordDate, h, m) } : x
            ),
          };
        }),

      toggleMedCheck: (date, timing, hour) =>
        set((s) => {
          const dayChecks = { ...(s.medChecks[date] ?? {}) };
          if (dayChecks[timing] != null) {
            delete dayChecks[timing];
          } else {
            dayChecks[timing] = hour;
          }
          return { medChecks: { ...s.medChecks, [date]: dayChecks } };
        }),

      addTiming: (name) =>
        set((s) => {
          const v = name.trim();
          if (!v || isReservedTimingName(v) || s.timings.some((t) => t.name === v)) return s;
          return { timings: [...s.timings, makeTiming(v)] };
        }),
      removeTiming: (name) =>
        set((s) => ({
          timings: s.timings.filter((t) => t.name !== name),
          // タイミング削除時は薬のタグからも同時に取り除く（モック挙動）
          medicines: s.medicines.map((m) => ({
            ...m,
            timings: m.timings.filter((t) => t !== name),
          })),
        })),
      moveTiming: (index, delta) =>
        set((s) => {
          const j = index + delta;
          if (j < 0 || j >= s.timings.length) return s;
          const next = [...s.timings];
          [next[index], next[j]] = [next[j], next[index]];
          return { timings: next };
        }),
      toggleTimingWeekday: (name, weekday) =>
        set((s) => ({
          timings: s.timings.map((t) => {
            if (t.name !== name) return t;
            const on = t.weekdays.includes(weekday);
            if (on && t.weekdays.length === 1) return t; // 最後の曜日は外せない
            const weekdays = on
              ? t.weekdays.filter((d) => d !== weekday)
              : [...t.weekdays, weekday].sort((a, b) => a - b);
            return { ...t, weekdays };
          }),
        })),

      addMedicine: () =>
        set((s) => ({
          medicines: [
            ...s.medicines,
            { id: newId(), name: "", doseAmount: "", doseUnit: "錠", timings: [] },
          ],
        })),
      addMedicineWithName: (draft) =>
        set((s) => ({
          medicines: [...s.medicines, { id: newId(), ...draft, timings: [] }],
        })),
      updateMedicine: (id, patch) =>
        set((s) => ({
          medicines: s.medicines.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      deleteMedicine: (id) =>
        set((s) => ({ medicines: s.medicines.filter((m) => m.id !== id) })),
      toggleMedicineTiming: (id, timing) =>
        set((s) => ({
          medicines: s.medicines.map((m) =>
            m.id === id
              ? {
                  ...m,
                  timings: m.timings.includes(timing)
                    ? m.timings.filter((t) => t !== timing)
                    : [...m.timings, timing],
                }
              : m
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(safeLocalStorage),
      partialize: (s): AppData => ({
        intakes: s.intakes,
        vitals: s.vitals,
        flags: s.flags,
        medChecks: s.medChecks,
        timings: s.timings,
        medicines: s.medicines,
      }),
      // 移行ロジックは src/lib/migrate.ts（純粋関数・Vitest対象）。絶対に throw しない
      migrate: (persisted, version) => {
        snapshotLegacy(persisted, version);
        return migratePersisted(persisted, version);
      },
      // 版が一致しても毎回通る経路。形状だけ直す（レコードは捨てない）。こちらも絶対に throw しない。
      // persist は set(state, true)（置換）で反映するため、actions を残すには current を先に展開する
      merge: (persisted, current) => {
        try {
          return { ...current, ...healAppData(persisted) };
        } catch {
          return current;
        }
      },
      // 注意: hasHydrated を立てる経路は必ず setItem（書き戻し）を伴う。ここで migrate の失敗を握って
      // setHasHydrated(true) すると未移行データを初期値で上書きしてしまうため、回復処理は書かない。
      // 白画面を防ぐ唯一の手段は migrate/merge を throw させないこと
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
