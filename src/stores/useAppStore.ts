import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AppData,
  FlagKind,
  IntakeKind,
  Medicine,
  RecordDate,
  VitalRecord,
} from "@/types/records";
import { DEFAULT_TIMINGS, STORAGE_KEY } from "@/lib/constants";
import { newId } from "@/lib/id";
import { parseDoseText } from "@/lib/meds";
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

  addIntake: (kind: IntakeKind, ml: number, date: RecordDate, h: number, m: number) => void;
  updateIntakeMl: (id: string, ml: number) => void;
  deleteIntake: (id: string) => void;

  addVital: (input: VitalInput, date: RecordDate, h: number, m: number) => void;
  updateVital: (id: string, patch: VitalInput) => void;
  deleteVital: (id: string) => void;

  addFlag: (kind: FlagKind, date: RecordDate, h: number, m: number) => void;
  deleteFlag: (id: string) => void;

  /** チェック済みなら解除、未チェックなら hour でチェック */
  toggleMedCheck: (date: RecordDate, timing: string, hour: number) => void;

  addTiming: (name: string) => void;
  removeTiming: (name: string) => void;
  moveTiming: (index: number, delta: number) => void;

  addMedicine: () => void;
  updateMedicine: (
    id: string,
    patch: Partial<Pick<Medicine, "name" | "doseAmount" | "doseUnit">>
  ) => void;
  deleteMedicine: (id: string) => void;
  toggleMedicineTiming: (id: string, timing: string) => void;
}

const initialData: AppData = {
  intakes: [],
  vitals: [],
  flags: [],
  medChecks: {},
  timings: [...DEFAULT_TIMINGS],
  medicines: [],
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialData,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      addIntake: (kind, ml, date, h, m) =>
        set((s) => ({
          intakes: [
            ...s.intakes,
            { id: newId(), kind, ml, recordDate: date, recordedAt: toRecordedAt(date, h, m) },
          ],
        })),
      updateIntakeMl: (id, ml) =>
        set((s) => ({
          intakes: s.intakes.map((x) => (x.id === id ? { ...x, ml } : x)),
        })),
      deleteIntake: (id) =>
        set((s) => ({ intakes: s.intakes.filter((x) => x.id !== id) })),

      addVital: (input, date, h, m) =>
        set((s) => ({
          vitals: [
            ...s.vitals,
            {
              id: newId(),
              recordDate: date,
              recordedAt: toRecordedAt(date, h, m),
              ...input,
            } satisfies VitalRecord,
          ],
        })),
      updateVital: (id, patch) =>
        set((s) => ({
          vitals: s.vitals.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),
      deleteVital: (id) =>
        set((s) => ({ vitals: s.vitals.filter((v) => v.id !== id) })),

      addFlag: (kind, date, h, m) =>
        set((s) => ({
          flags: [
            ...s.flags,
            { id: newId(), kind, recordDate: date, recordedAt: toRecordedAt(date, h, m) },
          ],
        })),
      deleteFlag: (id) =>
        set((s) => ({ flags: s.flags.filter((f) => f.id !== id) })),

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
          if (!v || s.timings.includes(v)) return s;
          return { timings: [...s.timings, v] };
        }),
      removeTiming: (name) =>
        set((s) => ({
          timings: s.timings.filter((t) => t !== name),
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

      addMedicine: () =>
        set((s) => ({
          medicines: [
            ...s.medicines,
            { id: newId(), name: "", doseAmount: "", doseUnit: "錠", timings: [] },
          ],
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
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): AppData => ({
        intakes: s.intakes,
        vitals: s.vitals,
        flags: s.flags,
        medChecks: s.medChecks,
        timings: s.timings,
        medicines: s.medicines,
      }),
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== "object") return { ...initialData };
        // v1: Medicine.dose が自由入力文字列（"1mg" 等）→ doseAmount + doseUnit に分割
        if (version === 1) {
          const old = persisted as Omit<AppData, "medicines"> & {
            medicines: Array<{ id: string; name: string; dose: string; timings: string[] }>;
          };
          return {
            ...old,
            medicines: old.medicines.map((m) => ({
              id: m.id,
              name: m.name,
              timings: m.timings,
              ...parseDoseText(m.dose),
            })),
          } satisfies AppData;
        }
        if (version === 2) {
          return persisted as AppData;
        }
        // 未知の旧バージョンは初期値へフォールバック
        return { ...initialData };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
