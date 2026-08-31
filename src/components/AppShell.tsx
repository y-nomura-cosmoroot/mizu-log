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

export default function AppShell() {
  const ready = useUiStore((s) => s.ready);
  const tab = useUiStore((s) => s.tab);
  const init = useUiStore((s) => s.init);
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  useEffect(() => {
    init(new Date());
  }, [init]);

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
