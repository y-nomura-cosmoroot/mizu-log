"use client";

import { QUICK_AMOUNTS } from "@/lib/constants";
import type { IntakeKind } from "@/types/records";

const PALETTE = {
  water: {
    label: "この時間の飲水量",
    labelColor: "#1c6dab",
    numColor: "#155a8f",
    quickShadow: "0 3px 10px rgba(21,90,143,.18)",
    inputBorder: "1.5px solid #bfdff2",
    addBg: "#2b8fd6",
    addShadow: "0 3px 10px rgba(21,90,143,.2)",
    pillColor: "#155a8f",
    pillShadow: "0 2px 6px rgba(21,90,143,.12)",
  },
  urine: {
    label: "この時間の尿量",
    labelColor: "#b0761a",
    numColor: "#a06a12",
    quickShadow: "0 3px 10px rgba(160,106,18,.18)",
    inputBorder: "1.5px solid #f2ddb5",
    addBg: "#d99422",
    addShadow: "0 3px 10px rgba(160,106,18,.2)",
    pillColor: "#a06a12",
    pillShadow: "0 2px 6px rgba(160,106,18,.12)",
  },
} as const;

export default function IntakePanel({
  kind,
  hourMl,
  dayTotalMl,
  customMl,
  onCustomChange,
  onAdd,
}: {
  kind: IntakeKind;
  hourMl: number;
  dayTotalMl: number;
  customMl: number;
  onCustomChange: (v: number) => void;
  onAdd: (ml: number) => void;
}) {
  const p = PALETTE[kind];
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 900, color: p.labelColor }}>{p.label}</span>
      <span
        data-testid={`${kind}-hour-ml`}
        style={{ fontSize: 38, fontWeight: 900, color: p.numColor, lineHeight: 1 }}
      >
        {hourMl}
        <span style={{ fontSize: 14 }}>ml</span>
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,auto)",
          gap: 6,
          paddingTop: 10,
        }}
      >
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            data-testid={`quick-${kind}-${v}`}
            onClick={() => onAdd(v)}
            style={{
              border: "none",
              background: "#fff",
              color: p.labelColor,
              fontWeight: 900,
              fontSize: 13,
              borderRadius: 999,
              padding: "10px 15px",
              boxShadow: p.quickShadow,
              cursor: "pointer",
            }}
          >
            ＋{v}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", paddingTop: 6 }}>
        <input
          data-testid={`custom-${kind}-input`}
          type="number"
          min={0}
          value={customMl || ""}
          onChange={(e) => onCustomChange(parseInt(e.target.value, 10) || 0)}
          inputMode="numeric"
          style={{
            background: "rgba(255,255,255,.95)",
            border: p.inputBorder,
            color: "#24323d",
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 12,
            padding: "9px 10px",
            width: 52,
            textAlign: "right",
          }}
        />
        <span style={{ fontSize: 10, color: "#5d7488", fontWeight: 700 }}>ml</span>
        <button
          data-testid={`custom-${kind}-add`}
          onClick={() => {
            if (customMl > 0) onAdd(customMl);
          }}
          style={{
            border: "none",
            background: p.addBg,
            color: "#fff",
            fontWeight: 700,
            fontSize: 12.5,
            borderRadius: 12,
            padding: "10px 13px",
            boxShadow: p.addShadow,
            cursor: "pointer",
          }}
        >
          ＋記録
        </button>
      </div>
      <span
        style={{
          marginTop: 12,
          background: "rgba(255,255,255,.92)",
          color: p.pillColor,
          fontWeight: 700,
          fontSize: 12.5,
          borderRadius: 999,
          padding: "8px 16px",
          boxShadow: p.pillShadow,
        }}
      >
        今日の合計{" "}
        <b data-testid={`${kind}-day-total`} style={{ fontSize: 22, fontWeight: 900 }}>
          {dayTotalMl}
          <span style={{ fontSize: 14 }}>ml</span>
        </b>
      </span>
    </div>
  );
}
