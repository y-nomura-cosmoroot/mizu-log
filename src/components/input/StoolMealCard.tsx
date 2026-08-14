"use client";

import { countFlags } from "@/lib/aggregate";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { FlagKind } from "@/types/records";

const flagBtn: React.CSSProperties = {
  flex: 1,
  border: "none",
  background: "#eef6fc",
  color: "#1c6dab",
  fontWeight: 700,
  fontSize: 14,
  borderRadius: 14,
  padding: "14px 0",
  cursor: "pointer",
};

export default function StoolMealCard() {
  const flags = useAppStore((s) => s.flags);
  const addFlag = useAppStore((s) => s.addFlag);
  const viewDate = useUiStore((s) => s.viewDate);
  const selHour = useUiStore((s) => s.selHour);
  const showToast = useUiStore((s) => s.showToast);

  const stoolCount = countFlags(flags, "stool", viewDate);
  const mealCount = countFlags(flags, "meal", viewDate);

  const add = (kind: FlagKind) => {
    addFlag(kind, viewDate, selHour, 0);
    showToast(kind === "stool" ? "便をきろくしました" : "食事をきろくしました");
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: "0 2px 10px rgba(43,113,166,.08)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 900, color: "#1c6dab", paddingBottom: 10 }}>
        便・食事
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button data-testid="add-stool" onClick={() => add("stool")} style={flagBtn}>
          💩 便があった{stoolCount ? `（${stoolCount}回）` : ""}
        </button>
        <button data-testid="add-meal" onClick={() => add("meal")} style={flagBtn}>
          🍴 食事をした{mealCount ? `（${mealCount}回）` : ""}
        </button>
      </div>
    </div>
  );
}
