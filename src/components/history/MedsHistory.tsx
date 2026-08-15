"use client";

import { useState } from "react";
import { card } from "@/lib/styles";
import { groupMedChecksByBandHour, uncheckedTimings } from "@/lib/meds";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import AccordionHourRow from "./AccordionHourRow";
import MedDoseList from "../meds/MedDoseList";

export default function MedsHistory() {
  const timings = useAppStore((s) => s.timings);
  const medicines = useAppStore((s) => s.medicines);
  const medChecks = useAppStore((s) => s.medChecks);
  const viewDate = useUiStore((s) => s.viewDate);
  const [openHours, setOpenHours] = useState<Record<number, boolean>>({});

  const bands = groupMedChecksByBandHour(timings, medChecks, viewDate);
  const unchecked = uncheckedTimings(timings, medChecks, viewDate);
  const ok = unchecked.length === 0;

  return (
    <>
      <div
        data-testid="meds-result-card"
        data-ok={ok}
        style={{
          background: ok ? "#e6f7ec" : "#fdeaea",
          border: `2px solid ${ok ? "#7cc79a" : "#e58b83"}`,
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: `0 4px 14px ${ok ? "rgba(46,125,79,.16)" : "rgba(194,69,58,.18)"}`,
        }}
      >
        <span style={{ fontSize: 22 }}>{ok ? "🎉" : "⚠️"}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: 17, fontWeight: 900, color: ok ? "#2e7d4f" : "#c2453a" }}
          >
            {ok ? "飲み忘れなし！" : "飲み忘れあり！"}
          </div>
          <div style={{ fontSize: 12, color: "#5d7488" }}>
            {ok
              ? "この日はぜんぶ飲めました。えらい！"
              : `${unchecked.join("・")} がまだです`}
          </div>
        </div>
      </div>
      {bands.map((b) => (
        <div key={b.band} style={card}>
          <div style={{ padding: "10px 16px", background: "#f2f9fe", fontSize: 13 }}>
            <b>{b.label}</b>
          </div>
          {b.empty && (
            <div
              style={{
                padding: "10px 16px",
                fontSize: 12,
                color: "#9db0bd",
                borderTop: "1px solid #eef4f9",
              }}
            >
              記録なし
            </div>
          )}
          {b.hours.map((g) => (
            <AccordionHourRow
              key={g.hour}
              testId={`meds-hour-row-${g.hour}`}
              hourLabel={`${g.hour}時`}
              count={g.entries.length}
              open={!!openHours[g.hour]}
              onToggle={() =>
                setOpenHours((prev) => ({ ...prev, [g.hour]: !prev[g.hour] }))
              }
              headerContent={
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#155a8f" }}>
                  {g.entries.map((e) => e.timing).join(" ・ ")}
                </span>
              }
            >
              {g.entries.map((e) => (
                <div
                  key={e.timing}
                  data-testid="med-check-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px 8px 34px",
                    borderTop: "1px solid #f4f9fd",
                    background: "#fbfdff",
                    fontSize: 13,
                  }}
                >
                  <span style={{ width: 78, color: "#7a8b98", fontSize: 12 }}>
                    💊 {e.timing}
                  </span>
                  <span style={{ width: 48, color: "#7a8b98", fontSize: 12 }}>
                    {e.hour}:00
                  </span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#24323d" }}>
                    <MedDoseList medicines={medicines} timing={e.timing} />
                  </span>
                </div>
              ))}
            </AccordionHourRow>
          ))}
        </div>
      ))}
    </>
  );
}
