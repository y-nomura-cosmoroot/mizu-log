"use client";

import { sumForDay } from "@/lib/aggregate";
import { buildCalendarCells, formatCalendarLabel } from "@/lib/calendar";
import { getRecordDate } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import styles from "./CalendarPopup.module.css";

type CellState = "blank" | "selected" | "disabled" | "today" | "normal";

function cellState(cell: {
  label: string;
  selected: boolean;
  disabled: boolean;
  isToday: boolean;
}): CellState {
  if (!cell.label) return "blank";
  if (cell.selected) return "selected";
  if (cell.disabled) return "disabled";
  if (cell.isToday) return "today";
  return "normal";
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
        className={`overlay ${styles.overlayZ}`}
      />
      <div data-testid="calendar-popup" className={`popover ${styles.popup}`}>
        <div className={styles.monthRow}>
          <button onClick={() => setCalYM(ym - 1)} className={styles.monthBtn}>
            ‹
          </button>
          <span className={styles.monthLabel}>{formatCalendarLabel(year, month0)}</span>
          <button onClick={() => setCalYM(ym + 1)} className={styles.monthBtn}>
            ›
          </button>
        </div>
        <div className={styles.dowGrid}>
          <span>日</span>
          <span>月</span>
          <span>火</span>
          <span>水</span>
          <span>木</span>
          <span>金</span>
          <span>土</span>
        </div>
        <div className={styles.cellGrid}>
          {cells.map((c) => {
            const waterSum = c.date ? sumForDay(intakes, "water", c.date) : 0;
            const urineSum = c.date ? sumForDay(intakes, "urine", c.date) : 0;
            const hasTotal = !c.disabled && (waterSum > 0 || urineSum > 0);
            return (
              <button
                key={c.key}
                data-testid={c.date ? `cal-day-${c.date}` : undefined}
                data-state={cellState(c)}
                disabled={c.disabled}
                onClick={() => {
                  if (c.date && !c.disabled) setViewDate(c.date);
                }}
                className={styles.cell}
              >
                {c.label && (
                  <>
                    <span>{c.label}</span>
                    <span
                      className={`${styles.cellTotal} ${hasTotal ? "" : styles.isHidden}`}
                    >
                      <span className={styles.totalW}>{waterSum}</span>
                      <span className={styles.totalSlash}>/</span>
                      <span className={styles.totalU}>{urineSum}</span>
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
