import { create } from "zustand";
import type { IntakeKind, Medicine, RecordDate, RecordKind } from "@/types/records";
import { addMonthsFirst, ymKey } from "@/lib/calendar";
import { DEFAULT_CUSTOM_ML, TOAST_FIX_MS, TOAST_MS } from "@/lib/constants";
import { addDays, getRecordDate } from "@/lib/time";
import type { VitalInput } from "./useAppStore";

export type Tab = "home" | "input" | "meds" | "history";
export type HistSub = "water" | "vital" | "meds";

export type SheetState =
  | { type: "ml"; id: string; kind: IntakeKind; ml: number }
  | ({ type: "vital"; id: string } & VitalInput)
  | null;

/**
 * 記録トーストに添える「◯時になおす」導線。
 * 記録する時間が現在時とズレたまま記録したときだけ付く（hour/minute は押したときに入れ直す時刻）
 */
export type ToastFix = { kind: RecordKind; id: string; hour: number; minute: number };

export type ToastState = { msg: string; fix?: ToastFix } | null;

/** おくすりマスタの下書き行(まだstoreには追加していない、確定前の1件分) */
export type MedicineDraft = Pick<Medicine, "name" | "doseAmount" | "doseUnit">;

/**
 * 「📷 カメラからおくすりを追加」シートの状態。
 * 1枚の写真から複数の薬が読み取れることがあるため、draftsは配列(「これでOK」を押すまでstoreには反映しない)
 */
export type CameraSheetState = {
  status: "camera" | "recognizing" | "done" | "error";
  /** status==="camera"のときのライブカメラ起動状況 */
  cameraPhase: "starting" | "live" | "unavailable";
  imageUrl: string | null;
  drafts: MedicineDraft[];
  errorMsg?: string;
} | null;

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
  /** りれきタブの「月ごとに見る」トグル */
  histMonthly: boolean;
  viewDate: RecordDate;
  /** 起動時(または最後の syncDay)に計算した「今日」の記録日。日付跨ぎの検知に使う */
  todayKey: RecordDate;
  selHour: number;
  /**
   * 現在時刻の「時」(0〜23)。AppShellの毎分tick(と表示復帰)で更新する。
   * 開いたまま時間が過ぎても再レンダリングが起きるようにするための値で、
   * 「記録する時間」が現在時とズレていることの表示にだけ使う（selHourは動かさない）
   */
  nowHour: number;
  hourDropOpen: boolean;
  calOpen: boolean;
  /** カレンダー表示中の年月（year*12+month0）。nullなら表示日の月 */
  calYM: number | null;
  toast: ToastState;
  sheet: SheetState;
  cameraSheet: CameraSheetState;
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
  /**
   * 「今日」と「いま何時か」を現在時刻に合わせる（表示復帰時・1分ごとに呼ぶ）。
   * 日付が変わっていて旧「今日」を表示中なら表示日と時刻も新しい今日へ追従させる
   * （開いたまま0時を跨いだ端末が前日に記録し続けないため）。過去日を見ているときは表示を動かさない。
   * 日付が変わっていない場合は nowHour だけ更新する（selHourは触らない）
   */
  syncDay: (now: Date) => void;
  setTab: (tab: Tab) => void;
  setHistSub: (sub: HistSub) => void;
  setHistMonthly: (v: boolean) => void;
  goPrevDay: () => void;
  goNextDay: (now: Date) => void;
  goPrevMonth: () => void;
  goNextMonth: (now: Date) => void;
  setViewDate: (date: RecordDate) => void;
  setSelHour: (h: number) => void;
  stepSelHour: (delta: 1 | -1) => void;
  setHourDropOpen: (v: boolean) => void;
  setCalOpen: (v: boolean) => void;
  setCalYM: (ym: number | null) => void;
  /** fix を渡すと「◯時になおす」つきになり、押す時間を見込んで表示も長くなる */
  showToast: (msg: string, fix?: ToastFix) => void;
  openSheet: (sheet: Exclude<SheetState, null>) => void;
  patchSheet: (patch: Partial<Exclude<SheetState, null>>) => void;
  closeSheet: () => void;
  openCameraSheet: () => void;
  patchCameraSheet: (patch: Partial<Exclude<CameraSheetState, null>>) => void;
  closeCameraSheet: () => void;
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
  histMonthly: false,
  viewDate: "",
  todayKey: "",
  selHour: 0,
  nowHour: 0,
  hourDropOpen: false,
  calOpen: false,
  calYM: null,
  toast: null,
  sheet: null,
  cameraSheet: null,
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
      todayKey: getRecordDate(now),
      selHour: now.getHours(),
      nowHour: now.getHours(),
    });
  },
  syncDay: (now) =>
    set((s) => {
      const today = getRecordDate(now);
      const nowHour = now.getHours();
      // 日付が変わっていなければ「いま何時か」だけ追従させる（同じ時なら再レンダリングさせない）
      if (today === s.todayKey) return nowHour === s.nowHour ? s : { nowHour };
      return s.viewDate === s.todayKey
        ? { todayKey: today, viewDate: today, selHour: nowHour, nowHour, calYM: null }
        : { todayKey: today, nowHour };
    }),
  setTab: (tab) => {
    set({ tab, medsMasterMode: false, hourDropOpen: false, calOpen: false });
    writeUrl(tab, get().histSub);
  },
  setHistSub: (sub) => {
    set({ histSub: sub });
    writeUrl(get().tab, sub);
  },
  setHistMonthly: (v) => set({ histMonthly: v, calOpen: false }),
  goPrevDay: () => set((s) => ({ viewDate: addDays(s.viewDate, -1), calYM: null })),
  goNextDay: (now) =>
    set((s) => {
      const today = getRecordDate(now);
      if (s.viewDate >= today) return s;
      return { viewDate: addDays(s.viewDate, 1), calYM: null };
    }),
  goPrevMonth: () => set((s) => ({ viewDate: addMonthsFirst(s.viewDate, -1), calYM: null })),
  goNextMonth: (now) =>
    set((s) => {
      const today = getRecordDate(now);
      if (ymKey(s.viewDate) >= ymKey(today)) return s;
      const next = addMonthsFirst(s.viewDate, 1);
      // 今月へ戻ってきたら1日ではなく今日に合わせる（日ごと表示に戻ったとき自然）
      return { viewDate: ymKey(next) === ymKey(today) ? today : next, calYM: null };
    }),
  setViewDate: (date) => set({ viewDate: date, calOpen: false, calYM: null }),
  setSelHour: (h) => set({ selHour: h, hourDropOpen: false }),
  stepSelHour: (delta) => set((s) => ({ selHour: (s.selHour + delta + 24) % 24 })),
  setHourDropOpen: (v) => set({ hourDropOpen: v }),
  setCalOpen: (v) => set({ calOpen: v, calYM: null }),
  setCalYM: (ym) => set({ calYM: ym }),
  showToast: (msg, fix) => {
    clearTimeout(toastTimer);
    set({ toast: { msg, fix } });
    toastTimer = setTimeout(() => set({ toast: null }), fix ? TOAST_FIX_MS : TOAST_MS);
  },
  openSheet: (sheet) => set({ sheet }),
  patchSheet: (patch) =>
    set((s) => (s.sheet ? { sheet: { ...s.sheet, ...patch } as SheetState } : s)),
  closeSheet: () => set({ sheet: null }),
  openCameraSheet: () =>
    set({
      sheet: null,
      cameraSheet: { status: "camera", cameraPhase: "starting", imageUrl: null, drafts: [] },
    }),
  patchCameraSheet: (patch) =>
    set((s) => (s.cameraSheet ? { cameraSheet: { ...s.cameraSheet, ...patch } } : s)),
  closeCameraSheet: () => set({ cameraSheet: null }),
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
