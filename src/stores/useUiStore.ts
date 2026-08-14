import { create } from "zustand";
import type { IntakeKind, RecordDate } from "@/types/records";
import { DEFAULT_CUSTOM_ML, TOAST_MS } from "@/lib/constants";
import { addDays, getRecordDate, HOUR_CYCLE } from "@/lib/time";
import type { VitalInput } from "./useAppStore";

export type Tab = "home" | "input" | "meds" | "history";
export type HistSub = "water" | "vital" | "meds";

export type SheetState =
  | { type: "ml"; id: string; kind: IntakeKind; ml: number }
  | ({ type: "vital"; id: string } & VitalInput)
  | null;

const TABS: Tab[] = ["home", "input", "meds", "history"];
const SUBS: HistSub[] = ["water", "vital", "meds"];

function writeUrl(tab: Tab, histSub: HistSub) {
  if (typeof window === "undefined") return;
  const url = tab === "history" ? `?tab=${tab}&sub=${histSub}` : `?tab=${tab}`;
  window.history.replaceState(null, "", url);
}

interface UiStore {
  ready: boolean;
  tab: Tab;
  histSub: HistSub;
  viewDate: RecordDate;
  selHour: number;
  hourDropOpen: boolean;
  calOpen: boolean;
  /** カレンダー表示中の年月（year*12+month0）。nullなら表示日の月 */
  calYM: number | null;
  toast: string | null;
  sheet: SheetState;
  medsMasterMode: boolean;
  customWater: number;
  customUrine: number;
  vitalInput: VitalInput;
  newTiming: string;
  /** rowpopアニメーション対象 */
  movedTiming: string | null;
  movedMedId: string | null;

  /** 初回マウント時: URLと現在時刻からUI状態を初期化 */
  init: (now: Date) => void;
  setTab: (tab: Tab) => void;
  setHistSub: (sub: HistSub) => void;
  goPrevDay: () => void;
  goNextDay: (now: Date) => void;
  setViewDate: (date: RecordDate) => void;
  setSelHour: (h: number) => void;
  stepSelHour: (delta: 1 | -1) => void;
  setHourDropOpen: (v: boolean) => void;
  setCalOpen: (v: boolean) => void;
  setCalYM: (ym: number | null) => void;
  showToast: (msg: string) => void;
  openSheet: (sheet: Exclude<SheetState, null>) => void;
  patchSheet: (patch: Partial<Exclude<SheetState, null>>) => void;
  closeSheet: () => void;
  setMedsMasterMode: (v: boolean) => void;
  setCustomWater: (v: number) => void;
  setCustomUrine: (v: number) => void;
  setVitalField: (key: keyof VitalInput, value: string) => void;
  clearVitalInput: () => void;
  setNewTiming: (v: string) => void;
  markMovedTiming: (name: string) => void;
  markMovedMed: (id: string) => void;
}

const emptyVitalInput: VitalInput = { temp: "", bpSys: "", bpDia: "", pulse: "", weight: "" };

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let movedTimingTimer: ReturnType<typeof setTimeout> | undefined;
let movedMedTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiStore>()((set, get) => ({
  ready: false,
  tab: "home",
  histSub: "water",
  viewDate: "",
  selHour: 14,
  hourDropOpen: false,
  calOpen: false,
  calYM: null,
  toast: null,
  sheet: null,
  medsMasterMode: false,
  customWater: DEFAULT_CUSTOM_ML,
  customUrine: DEFAULT_CUSTOM_ML,
  vitalInput: { ...emptyVitalInput },
  newTiming: "",
  movedTiming: null,
  movedMedId: null,

  init: (now) => {
    let tab: Tab = "home";
    let histSub: HistSub = "water";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      const s = params.get("sub");
      if (t && (TABS as string[]).includes(t)) tab = t as Tab;
      if (s && (SUBS as string[]).includes(s)) histSub = s as HistSub;
    }
    set({
      ready: true,
      tab,
      histSub,
      viewDate: getRecordDate(now),
      selHour: now.getHours(),
    });
  },
  setTab: (tab) => {
    set({ tab, medsMasterMode: false, hourDropOpen: false, calOpen: false });
    writeUrl(tab, get().histSub);
  },
  setHistSub: (sub) => {
    set({ histSub: sub });
    writeUrl(get().tab, sub);
  },
  goPrevDay: () => set((s) => ({ viewDate: addDays(s.viewDate, -1), calYM: null })),
  goNextDay: (now) =>
    set((s) => {
      const today = getRecordDate(now);
      if (s.viewDate >= today) return s;
      return { viewDate: addDays(s.viewDate, 1), calYM: null };
    }),
  setViewDate: (date) => set({ viewDate: date, calOpen: false, calYM: null }),
  setSelHour: (h) => set({ selHour: h, hourDropOpen: false }),
  stepSelHour: (delta) =>
    set((s) => {
      const i = Math.max(0, HOUR_CYCLE.indexOf(s.selHour));
      return { selHour: HOUR_CYCLE[(i + delta + 24) % 24] };
    }),
  setHourDropOpen: (v) => set({ hourDropOpen: v }),
  setCalOpen: (v) => set({ calOpen: v, calYM: null }),
  setCalYM: (ym) => set({ calYM: ym }),
  showToast: (msg) => {
    clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), TOAST_MS);
  },
  openSheet: (sheet) => set({ sheet }),
  patchSheet: (patch) =>
    set((s) => (s.sheet ? { sheet: { ...s.sheet, ...patch } as SheetState } : s)),
  closeSheet: () => set({ sheet: null }),
  setMedsMasterMode: (v) => set({ medsMasterMode: v }),
  setCustomWater: (v) => set({ customWater: v }),
  setCustomUrine: (v) => set({ customUrine: v }),
  setVitalField: (key, value) =>
    set((s) => ({ vitalInput: { ...s.vitalInput, [key]: value } })),
  clearVitalInput: () => set({ vitalInput: { ...emptyVitalInput } }),
  setNewTiming: (v) => set({ newTiming: v }),
  markMovedTiming: (name) => {
    clearTimeout(movedTimingTimer);
    set({ movedTiming: name });
    movedTimingTimer = setTimeout(() => set({ movedTiming: null }), 700);
  },
  markMovedMed: (id) => {
    clearTimeout(movedMedTimer);
    set({ movedMedId: id });
    movedMedTimer = setTimeout(() => set({ movedMedId: null }), 700);
  },
}));
