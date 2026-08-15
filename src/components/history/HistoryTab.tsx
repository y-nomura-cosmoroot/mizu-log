"use client";

import { useUiStore } from "@/stores/useUiStore";
import MedsHistory from "./MedsHistory";
import VitalHistory from "./VitalHistory";
import WaterUrineHistory from "./WaterUrineHistory";

export default function HistoryTab() {
  const histSub = useUiStore((s) => s.histSub);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "8px 16px 4px",
      }}
    >
      {histSub === "water" && <WaterUrineHistory />}
      {histSub === "vital" && <VitalHistory />}
      {histSub === "meds" && <MedsHistory />}
    </div>
  );
}
