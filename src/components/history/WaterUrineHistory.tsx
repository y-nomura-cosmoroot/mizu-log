"use client";

import { useState } from "react";
import { groupIntakesByBandHour, sumForDay } from "@/lib/aggregate";
import { card, delBtn, editBtn, urineChip, waterChip } from "@/lib/styles";
import { formatTime } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import AccordionHourRow from "./AccordionHourRow";

function subLabel(n: number): string {
  return n ? `${n}ml` : "—";
}

const kindChipLabel = { water: "飲水", urine: "尿量" } as const;

export default function WaterUrineHistory() {
  const intakes = useAppStore((s) => s.intakes);
  const deleteIntake = useAppStore((s) => s.deleteIntake);
  const viewDate = useUiStore((s) => s.viewDate);
  const openSheet = useUiStore((s) => s.openSheet);
  const showToast = useUiStore((s) => s.showToast);
  const [openHours, setOpenHours] = useState<Record<number, boolean>>({});

  const bands = groupIntakesByBandHour(intakes, viewDate);
  const waterTotal = sumForDay(intakes, "water", viewDate);
  const urineTotal = sumForDay(intakes, "urine", viewDate);

  return (
    <>
      {bands.map((b) => (
        <div key={b.band} style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 16px",
              background: "#f2f9fe",
              fontSize: 13,
            }}
          >
            <b>{b.label}</b>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#46698a",
              }}
            >
              小計
              <span style={waterChip}>飲水</span>
              <b
                data-testid={`band-w${b.band}`}
                style={{ fontSize: 15, color: "#1c6dab" }}
              >
                {subLabel(b.waterSum)}
              </b>
              <span style={urineChip}>尿量</span>
              <b
                data-testid={`band-u${b.band}`}
                style={{ fontSize: 15, color: "#b0761a" }}
              >
                {subLabel(b.urineSum)}
              </b>
            </span>
          </div>
          {b.hours.map((g) => (
            <AccordionHourRow
              key={g.hour}
              testId={`hour-row-${g.hour}`}
              hourLabel={`${g.hour}時`}
              count={g.items.length}
              open={!!openHours[g.hour]}
              onToggle={() =>
                setOpenHours((prev) => ({ ...prev, [g.hour]: !prev[g.hour] }))
              }
              headerContent={
                <span
                  style={{
                    flex: 1,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px 8px",
                    alignItems: "center",
                  }}
                >
                  <span style={waterChip}>飲水</span>
                  <b
                    data-testid={`hour-w-${g.hour}`}
                    style={{ fontSize: 15, color: "#1c6dab" }}
                  >
                    {subLabel(g.waterSum)}
                  </b>
                  <span style={urineChip}>尿量</span>
                  <b
                    data-testid={`hour-u-${g.hour}`}
                    style={{ fontSize: 15, color: "#b0761a" }}
                  >
                    {subLabel(g.urineSum)}
                  </b>
                </span>
              }
            >
              {g.items.map((it) => (
                <div
                  key={it.id}
                  data-testid="intake-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px 8px 34px",
                    borderTop: "1px solid #f4f9fd",
                    background: "#fbfdff",
                    fontSize: 14,
                  }}
                >
                  <span style={it.kind === "water" ? waterChip : urineChip}>
                    {kindChipLabel[it.kind]}
                  </span>
                  <span style={{ color: "#7a8b98", fontSize: 13, width: 44 }}>
                    {formatTime(it.recordedAt)}
                  </span>
                  <span
                    style={{ flex: 1, fontWeight: 900, fontSize: 16, color: "#155a8f" }}
                  >
                    {it.ml}{" "}
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7a8b98" }}>
                      ml
                    </span>
                  </span>
                  <button
                    onClick={() =>
                      openSheet({ type: "ml", id: it.id, kind: it.kind, ml: it.ml })
                    }
                    style={editBtn}
                  >
                    なおす
                  </button>
                  <button
                    onClick={() => {
                      deleteIntake(it.id);
                      showToast("けしました");
                    }}
                    style={delBtn}
                  >
                    けす
                  </button>
                </div>
              ))}
            </AccordionHourRow>
          ))}
        </div>
      ))}
      <div
        style={{
          ...card,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
        }}
      >
        <b>1日の合計</b>
        <span style={{ fontSize: 12, color: "#46698a" }}>
          飲水{" "}
          <b data-testid="day-total-water" style={{ fontSize: 19, color: "#1c6dab" }}>
            {waterTotal}ml
          </b>{" "}
          ・ 尿{" "}
          <b data-testid="day-total-urine" style={{ fontSize: 19, color: "#b0761a" }}>
            {urineTotal}ml
          </b>
        </span>
      </div>
    </>
  );
}
