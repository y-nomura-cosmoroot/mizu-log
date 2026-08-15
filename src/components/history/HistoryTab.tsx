"use client";

import { useUiStore } from "@/stores/useUiStore";
import MedsHistory from "./MedsHistory";
import MonthlyHistory from "./MonthlyHistory";
import VitalHistory from "./VitalHistory";
import WaterUrineHistory from "./WaterUrineHistory";
import styles from "./HistoryTab.module.css";

export default function HistoryTab() {
  const histSub = useUiStore((s) => s.histSub);
  const histMonthly = useUiStore((s) => s.histMonthly);
  return (
    <div className={styles.tab}>
      {histMonthly ? (
        <MonthlyHistory />
      ) : (
        <>
          {histSub === "water" && <WaterUrineHistory />}
          {histSub === "vital" && <VitalHistory />}
          {histSub === "meds" && <MedsHistory />}
        </>
      )}
    </div>
  );
}
