"use client";

import { buildCalendarCells, formatCalendarLabel } from "@/lib/calendar";
import { getRecordDate } from "@/lib/time";
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

function cellStyle(cell: {
  selected: boolean;
  disabled: boolean;
  isToday: boolean;
  label: string;
}): React.CSSProperties {
  if (!cell.label) return { border: "none", background: "none" };
  if (cell.selected) {
    return {
      border: "none",
      background: "#2b8fd6",
      color: "#fff",
      fontWeight: 900,
      fontSize: 13,
      borderRadius: 10,
      padding: "8px 0",
      cursor: "pointer",
    };
  }
  if (cell.disabled) {
    return {
      border: "none",
      background: "none",
      color: "#c8d4dd",
      fontSize: 13,
      padding: "8px 0",
    };
  }
  if (cell.isToday) {
    return {
      border: "2px solid #2b8fd6",
      background: "#eef6fc",
      color: "#1c6dab",
      fontWeight: 900,
      fontSize: 13,
      borderRadius: 10,
      padding: "6px 0",
      cursor: "pointer",
    };
  }
  return {
    border: "none",
    background: "#f4f9fd",
    color: "#24323d",
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 10,
    padding: "8px 0",
    cursor: "pointer",
  };
}

export default function CalendarPopup() {
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
          width: 308,
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 12px 34px rgba(21,50,75,.3)",
          padding: "12px 14px",
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
          {cells.map((c) => (
            <button
              key={c.key}
              data-testid={c.date ? `cal-day-${c.date}` : undefined}
              disabled={c.disabled}
              onClick={() => {
                if (c.date && !c.disabled) setViewDate(c.date);
              }}
              style={cellStyle(c)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
