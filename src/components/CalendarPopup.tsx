"use client";

import { sumForDay } from "@/lib/aggregate";
import { buildCalendarCells, formatCalendarLabel } from "@/lib/calendar";
import { getRecordDate } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";

const monthBtn: React.CSSProperties = {
  border: "none",
  background: "#eef6fc",
  color: "#1c6dab",
  fontWeight: 900,
  fontSize: 15,
  borderRadius: 10,
  padding: "6px 12px",
  cursor: "pointer",
};

type CellState = {
  selected: boolean;
  disabled: boolean;
  isToday: boolean;
  label: string;
};

const cellBase: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 1,
  borderRadius: 10,
  width: "100%",
  boxSizing: "border-box",
};

function cellStyle(cell: CellState): React.CSSProperties {
  if (!cell.label) return { border: "none", background: "none" };
  if (cell.selected) {
    return {
      ...cellBase,
      border: "none",
      background: "#2b8fd6",
      color: "#fff",
      fontWeight: 900,
      fontSize: 13,
      padding: "6px 0 5px",
      cursor: "pointer",
    };
  }
  if (cell.disabled) {
    return {
      ...cellBase,
      border: "none",
      background: "none",
      color: "#c8d4dd",
      fontSize: 13,
      padding: "6px 0 5px",
    };
  }
  if (cell.isToday) {
    return {
      ...cellBase,
      border: "2px solid #2b8fd6",
      background: "#eef6fc",
      color: "#1c6dab",
      fontWeight: 900,
      fontSize: 13,
      padding: "4px 0 5px",
      cursor: "pointer",
    };
  }
  return {
    ...cellBase,
    border: "none",
    background: "#f4f9fd",
    color: "#24323d",
    fontWeight: 700,
    fontSize: 13,
    padding: "6px 0 5px",
    cursor: "pointer",
  };
}

/** 選択中セルは青背景になるため、合計の数字は白系にして視認性を保つ */
function cellTotalColors(cell: CellState): { water: string; urine: string; slash: string } {
  if (cell.selected) {
    return { water: "#fff", urine: "rgba(255,255,255,.8)", slash: "rgba(255,255,255,.55)" };
  }
  return { water: "#1c6dab", urine: "#b0761a", slash: "#b7c6d1" };
}

export default function CalendarPopup() {
  const intakes = useAppStore((s) => s.intakes);
  const viewDate = useUiStore((s) => s.viewDate);
  const calYM = useUiStore((s) => s.calYM);
  const setCalYM = useUiStore((s) => s.setCalYM);
  const setCalOpen = useUiStore((s) => s.setCalOpen);
  const setViewDate = useUiStore((s) => s.setViewDate);

  const today = getRecordDate(new Date());
  const [vy, vm] = viewDate.split("-").map(Number);
  const ym = calYM ?? vy * 12 + (vm - 1);
  const year = Math.floor(ym / 12);
  const month0 = ym % 12;
  const cells = buildCalendarCells(year, month0, viewDate, today);

  return (
    <>
      <div
        data-testid="cal-overlay"
        onClick={() => setCalOpen(false)}
        style={{ position: "fixed", inset: 0, zIndex: 21 }}
      />
      <div
        data-testid="calendar-popup"
        style={{
          position: "absolute",
          left: "50%",
          top: "calc(100% + 6px)",
          transform: "translateX(-50%)",
          width: 410,
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 12px 34px rgba(21,50,75,.3)",
          padding: "12px 10px",
          zIndex: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 8,
          }}
        >
          <button onClick={() => setCalYM(ym - 1)} style={monthBtn}>
            ‹
          </button>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#155a8f" }}>
            {formatCalendarLabel(year, month0)}
          </span>
          <button onClick={() => setCalYM(ym + 1)} style={monthBtn}>
            ›
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 2,
            textAlign: "center",
            fontSize: 11,
            color: "#7a8b98",
            fontWeight: 700,
          }}
        >
          <span>日</span>
          <span>月</span>
          <span>火</span>
          <span>水</span>
          <span>木</span>
          <span>金</span>
          <span>土</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 2,
            paddingTop: 4,
          }}
        >
          {cells.map((c) => {
            const waterSum = c.date ? sumForDay(intakes, "water", c.date) : 0;
            const urineSum = c.date ? sumForDay(intakes, "urine", c.date) : 0;
            const hasTotal = !c.disabled && (waterSum > 0 || urineSum > 0);
            const tc = cellTotalColors(c);
            return (
              <button
                key={c.key}
                data-testid={c.date ? `cal-day-${c.date}` : undefined}
                disabled={c.disabled}
                onClick={() => {
                  if (c.date && !c.disabled) setViewDate(c.date);
                }}
                style={cellStyle(c)}
              >
                {c.label && (
                  <>
                    <span>{c.label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        visibility: hasTotal ? "visible" : "hidden",
                      }}
                    >
                      <span style={{ color: tc.water }}>{waterSum}</span>
                      <span style={{ color: tc.slash }}>/</span>
                      <span style={{ color: tc.urine }}>{urineSum}</span>
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
