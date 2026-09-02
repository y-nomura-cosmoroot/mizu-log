"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import Header from "./Header";
import BottomNav from "./BottomNav";
import Toast from "./Toast";
import HomeTab from "./home/HomeTab";
import InputTab from "./input/InputTab";
import MedsTab from "./meds/MedsTab";
import HistoryTab from "./history/HistoryTab";
import EditSheet from "./sheets/EditSheet";
import CameraAddMedicineSheet from "./sheets/CameraAddMedicineSheet";
import DrugNameDatalist from "./meds/DrugNameDatalist";
import styles from "./AppShell.module.css";

/** 日付跨ぎの再計算間隔 */
const DAY_SYNC_INTERVAL_MS = 60_000;

export default function AppShell() {
  const ready = useUiStore((s) => s.ready);
  const tab = useUiStore((s) => s.tab);
  const init = useUiStore((s) => s.init);
  const syncDay = useUiStore((s) => s.syncDay);
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  useEffect(() => {
    init(new Date());
  }, [init]);

  // 記録日=暦日なので、開いたまま0時を跨いだ端末が前日に記録し続けないよう
  // 表示復帰時と1分ごとに「今日」を再計算する
  useEffect(() => {
    const tick = () => syncDay(new Date());
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(tick, DAY_SYNC_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(id);
    };
  }, [syncDay]);

  return (
    <div className={styles.shell}>
      {ready && hasHydrated && (
        <>
          <Header />
          {tab === "home" && <HomeTab />}
          {tab === "input" && <InputTab />}
          {tab === "meds" && <MedsTab />}
          {tab === "history" && <HistoryTab />}
          <EditSheet />
          <CameraAddMedicineSheet />
          <DrugNameDatalist />
          <Toast />
          <BottomNav />
        </>
      )}
    </div>
  );
}
