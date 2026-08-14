"use client";

import { medsForTiming } from "@/lib/meds";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";

export default function TimingCheckRow({ timing }: { timing: string }) {
  const medicines = useAppStore((s) => s.medicines);
  const medChecks = useAppStore((s) => s.medChecks);
  const toggleMedCheck = useAppStore((s) => s.toggleMedCheck);
  const viewDate = useUiStore((s) => s.viewDate);
  const selHour = useUiStore((s) => s.selHour);
  const movedTiming = useUiStore((s) => s.movedTiming);

  const checked = (medChecks[viewDate] ?? {})[timing] != null;
  const toggle = () => toggleMedCheck(viewDate, timing, selHour);

  return (
    <div
      data-testid={`timing-row-${timing}`}
      style={{
        background: checked ? "#fff" : "#fff8e1",
        border: checked ? "1px solid #e3eef6" : "1.5px solid #f0d98c",
        borderRadius: 18,
        padding: "13px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 2px 10px rgba(43,113,166,.06)",
        animation: timing === movedTiming ? "rowpop .6s ease" : "none",
      }}
    >
      <button
        data-testid={`timing-check-${timing}`}
        onClick={toggle}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: checked ? "none" : "2px solid #d9c46a",
          background: checked ? "#2b8fd6" : "#fff",
          color: "#fff",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {checked ? "✓" : ""}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 900 }}>
          {timing}{" "}
          <span style={{ fontSize: 12, fontWeight: 400, color: "#7a8b98" }}>
            {checked ? "チェックずみ" : "まだ"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#7a8b98" }}>
          {medsForTiming(medicines, timing)}
        </div>
      </div>
      {!checked && (
        <button
          data-testid={`drank-btn-${timing}`}
          onClick={toggle}
          style={{
            border: "none",
            background: "#2b8fd6",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            borderRadius: 12,
            padding: "10px 14px",
            cursor: "pointer",
          }}
        >
          のんだ！
        </button>
      )}
    </div>
  );
}
