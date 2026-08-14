"use client";

import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import TimeSelector from "../TimeSelector";
import MedicineMasterCard from "./MedicineMasterCard";
import TimingCheckRow from "./TimingCheckRow";
import TimingMasterCard from "./TimingMasterCard";

export default function MedsTab() {
  const timings = useAppStore((s) => s.timings);
  const medChecks = useAppStore((s) => s.medChecks);
  const viewDate = useUiStore((s) => s.viewDate);
  const masterMode = useUiStore((s) => s.medsMasterMode);
  const setMasterMode = useUiStore((s) => s.setMedsMasterMode);

  const checks = medChecks[viewDate] ?? {};
  const done = timings.filter((t) => checks[t] != null).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "2px 16px" }}>
      <TimeSelector />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          きょうの分{" "}
          <span data-testid="meds-progress" style={{ color: "#2b8fd6" }}>
            {done} / {timings.length} かんりょう
          </span>
        </div>
        <button
          data-testid="toggle-master"
          onClick={() => setMasterMode(!masterMode)}
          style={{
            border: "none",
            background: "#fff",
            color: "#1c6dab",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 999,
            padding: "7px 14px",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(43,113,166,.15)",
          }}
        >
          {masterMode ? "← チェックにもどる" : "マスタを編集"}
        </button>
      </div>

      {!masterMode &&
        timings.map((t) => <TimingCheckRow key={t} timing={t} />)}

      {masterMode && (
        <>
          <TimingMasterCard />
          <MedicineMasterCard />
        </>
      )}
    </div>
  );
}
