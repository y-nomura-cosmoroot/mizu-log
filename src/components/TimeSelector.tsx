"use client";

import { sumForHour } from "@/lib/aggregate";
import { addDays, formatDateLabel, getRecordDate, HOUR_CYCLE } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";

const stepBtn: React.CSSProperties = {
  border: "none",
  background: "#eef6fc",
  color: "#1c6dab",
  fontWeight: 900,
  fontSize: 16,
  borderRadius: 12,
  padding: "8px 14px",
  cursor: "pointer",
};

const chipBase: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 1,
  borderRadius: 10,
  width: "100%",
  boxSizing: "border-box",
};

function chipStyle(selected: boolean, isTodaySide: boolean): React.CSSProperties {
  if (selected) {
    return {
      ...chipBase,
      border: "none",
      background: "#2b8fd6",
      color: "#fff",
      fontWeight: 900,
      fontSize: 13.5,
      padding: "7px 12px 6px",
      cursor: "pointer",
    };
  }
  return {
    ...chipBase,
    border: "none",
    background: isTodaySide ? "#eef6fc" : "#f4f7fa",
    color: isTodaySide ? "#155a8f" : "#5d7488",
    fontWeight: 700,
    fontSize: 13.5,
    padding: "7px 12px 6px",
    cursor: "pointer",
  };
}

/** 選択中チップは青背景になるため、小計の数字は白系にして視認性を保つ */
function chipTotalColors(selected: boolean): { water: string; urine: string; slash: string } {
  if (selected) {
    return { water: "#fff", urine: "rgba(255,255,255,.8)", slash: "rgba(255,255,255,.55)" };
  }
  return { water: "#1c6dab", urine: "#b0761a", slash: "#b7c6d1" };
}

const sectionLabel: React.CSSProperties = {
  padding: "10px 16px 6px",
  fontSize: 11.5,
  fontWeight: 900,
  color: "#7a8b98",
  borderBottom: "1px solid #eef4f9",
};

/** ⏰記録する時間セレクタ（home / input / meds 共通） */
export default function TimeSelector({ margin }: { margin?: string }) {
  const intakes = useAppStore((s) => s.intakes);
  const viewDate = useUiStore((s) => s.viewDate);
  const selHour = useUiStore((s) => s.selHour);
  const setSelHour = useUiStore((s) => s.setSelHour);
  const stepSelHour = useUiStore((s) => s.stepSelHour);
  const hourDropOpen = useUiStore((s) => s.hourDropOpen);
  const setHourDropOpen = useUiStore((s) => s.setHourDropOpen);

  const isToday = viewDate === getRecordDate(new Date());
  const todayHours = HOUR_CYCLE.slice(0, 10); // 14〜23時
  const nextHours = HOUR_CYCLE.slice(10); // 翌0〜13時

  const chip = (h: number, isTodaySide: boolean) => {
    const waterSum = sumForHour(intakes, "water", viewDate, h);
    const urineSum = sumForHour(intakes, "urine", viewDate, h);
    const hasTotal = waterSum > 0 || urineSum > 0;
    const tc = chipTotalColors(h === selHour);
    return (
      <button
        key={h}
        data-testid={`hour-chip-${h}`}
        onClick={() => setSelHour(h)}
        style={chipStyle(h === selHour, isTodaySide)}
      >
        <span>
          {h}時{h === selHour ? " ✓" : ""}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
            visibility: hasTotal ? "visible" : "hidden",
          }}
        >
          <span style={{ color: tc.water }}>{waterSum}</span>
          <span style={{ color: tc.slash }}>/</span>
          <span style={{ color: tc.urine }}>{urineSum}</span>
        </span>
      </button>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        margin: margin ?? 0,
        background: "#fff",
        borderRadius: 18,
        padding: "10px 14px",
        boxShadow: "0 4px 14px rgba(21,90,143,.14)",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: "#1c6dab" }}>
          ⏰ 記録する時間
        </span>
        <span style={{ flex: 1 }} />
        <button data-testid="sel-hour-prev" onClick={() => stepSelHour(-1)} style={stepBtn}>
          ‹
        </button>
        <button
          data-testid="sel-hour-toggle"
          onClick={() => setHourDropOpen(!hourDropOpen)}
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#155a8f",
            background: "#f5fbff",
            border: "1.5px solid #dceefb",
            borderRadius: 12,
            padding: "7px 14px",
            cursor: "pointer",
          }}
        >
          {selHour}時 <span style={{ fontSize: 12, color: "#2b8fd6" }}>▾</span>
        </button>
        <button data-testid="sel-hour-next" onClick={() => stepSelHour(1)} style={stepBtn}>
          ›
        </button>
      </div>
      {hourDropOpen && (
        <>
          <div
            onClick={() => setHourDropOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 6 }}
          />
          <div
            data-testid="hour-dropdown"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 6px)",
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 12px 34px rgba(21,50,75,.3)",
              overflow: "hidden",
              zIndex: 7,
            }}
          >
            <div style={sectionLabel}>
              {formatDateLabel(viewDate)}
              {isToday ? " きょう" : ""}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 6,
                padding: "10px 14px 12px",
              }}
            >
              {todayHours.map((h) => chip(h, true))}
            </div>
            <div
              style={{
                ...sectionLabel,
                borderTop: "1px solid #eef4f9",
                background: "#fafcfe",
                padding: "8px 16px 6px",
              }}
            >
              {formatDateLabel(addDays(viewDate, 1))} よくじつ
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 6,
                padding: "10px 14px 14px",
              }}
            >
              {nextHours.map((h) => chip(h, false))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
