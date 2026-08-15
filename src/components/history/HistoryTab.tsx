"use client";

import { useUiStore } from "@/stores/useUiStore";
import MedsHistory from "./MedsHistory";
import VitalHistory from "./VitalHistory";
import WaterUrineHistory from "./WaterUrineHistory";
import styles from "./HistoryTab.module.css";

export default function HistoryTab() {
  const histSub = useUiStore((s) => s.histSub);
  return (
    <div className={styles.tab}>
      {histSub === "water" && <WaterUrineHistory />}
      {histSub === "vital" && <VitalHistory />}
      {histSub === "meds" && <MedsHistory />}
    </div>
  );
}
