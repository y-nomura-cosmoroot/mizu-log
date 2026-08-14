"use client";

import { DOSE_UNITS } from "@/lib/constants";
import { sortMedicines } from "@/lib/meds";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { DoseUnit } from "@/types/records";

const medInput: React.CSSProperties = {
  border: "1.5px solid #d5e7f4",
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 14,
  background: "#fff",
  minWidth: 0,
};

export default function MedicineMasterCard() {
  const medicines = useAppStore((s) => s.medicines);
  const timings = useAppStore((s) => s.timings);
  const addMedicine = useAppStore((s) => s.addMedicine);
  const updateMedicine = useAppStore((s) => s.updateMedicine);
  const deleteMedicine = useAppStore((s) => s.deleteMedicine);
  const toggleMedicineTiming = useAppStore((s) => s.toggleMedicineTiming);
  const movedMedId = useUiStore((s) => s.movedMedId);
  const markMovedMed = useUiStore((s) => s.markMovedMed);

  const sorted = sortMedicines(medicines, timings);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: "0 2px 10px rgba(43,113,166,.08)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#7a8b98" }}>おくすり</div>
      {sorted.map((m, i) => (
        <div
          key={m.id}
          data-testid={`med-card-${i}`}
          style={{
            background: "#f7fbfe",
            borderRadius: 14,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            animation: m.id === movedMedId ? "rowpop .6s ease" : "none",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <input
              data-testid={`med-name-${i}`}
              value={m.name}
              onChange={(e) => updateMedicine(m.id, { name: e.target.value })}
              placeholder="くすりの名前"
              style={{ ...medInput, flex: 2 }}
            />
            <input
              data-testid={`med-dose-${i}`}
              type="number"
              min={0}
              value={m.doseAmount}
              onChange={(e) => updateMedicine(m.id, { doseAmount: e.target.value })}
              inputMode="decimal"
              placeholder="量"
              style={{ ...medInput, flex: 1 }}
            />
            <select
              data-testid={`med-unit-${i}`}
              value={m.doseUnit}
              onChange={(e) =>
                updateMedicine(m.id, { doseUnit: e.target.value as DoseUnit })
              }
              style={{ ...medInput, width: 64, flexShrink: 0 }}
            >
              {DOSE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button
              data-testid={`med-del-${i}`}
              onClick={() => deleteMedicine(m.id)}
              style={{
                border: "none",
                background: "#fdeaea",
                color: "#c25454",
                borderRadius: 10,
                padding: "0 12px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              けす
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {timings.map((t) => {
              const on = m.timings.includes(t);
              return (
                <button
                  key={t}
                  data-testid={`med-tag-${i}-${t}`}
                  onClick={() => {
                    markMovedMed(m.id);
                    toggleMedicineTiming(m.id, t);
                  }}
                  style={
                    on
                      ? {
                          border: "none",
                          background: "#2b8fd6",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 12,
                          borderRadius: 999,
                          padding: "6px 14px",
                          cursor: "pointer",
                        }
                      : {
                          border: "1.5px solid #d5e7f4",
                          background: "#fff",
                          color: "#7a8b98",
                          fontWeight: 700,
                          fontSize: 12,
                          borderRadius: 999,
                          padding: "5px 13px",
                          cursor: "pointer",
                        }
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button
        data-testid="add-medicine"
        onClick={addMedicine}
        style={{
          border: "1.5px dashed #a8cfe8",
          background: "none",
          color: "#1c6dab",
          fontWeight: 700,
          fontSize: 13,
          borderRadius: 12,
          padding: "11px 0",
          cursor: "pointer",
        }}
      >
        ＋ おくすりを追加
      </button>
    </div>
  );
}
