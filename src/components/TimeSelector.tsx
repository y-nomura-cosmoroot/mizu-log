"use client";

import { sumForHour } from "@/lib/aggregate";
import { addDays, formatDateLabel, getRecordDate, HOUR_CYCLE } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import styles from "./TimeSelector.module.css";

/** ⏰記録する時間セレクタ（home / input / meds 共通） */
export default function TimeSelector({ inset = false }: { inset?: boolean }) {
  const intakes = useAppStore((s) => s.intakes);
  const viewDate = useUiStore((s) => s.viewDate);
  const selHour = useUiStore((s) => s.selHour);
  const setSelHour = useUiStore((s) => s.setSelHour);
  const stepSelHour = useUiStore((s) => s.stepSelHour);
  const hourDropOpen = useUiStore((s) => s.hourDropOpen);
  const setHourDropOpen = useUiStore((s) => s.setHourDropOpen);

  const now = new Date();
  const isToday = viewDate === getRecordDate(now);
  const nowHour = now.getHours();
  const todayHours = HOUR_CYCLE.slice(0, 10); // 14〜23時
  const nextHours = HOUR_CYCLE.slice(10); // 翌0〜13時

  const chip = (h: number, isTodaySide: boolean) => {
    const waterSum = sumForHour(intakes, "water", viewDate, h);
    const urineSum = sumForHour(intakes, "urine", viewDate, h);
    const hasTotal = waterSum > 0 || urineSum > 0;
    const isNow = isToday && h === nowHour;
    return (
      <button
        key={h}
        data-testid={`hour-chip-${h}`}
        data-selected={h === selHour}
        data-side={isTodaySide ? "today" : "next"}
        data-now={isNow}
        onClick={() => setSelHour(h)}
        className={styles.hourChip}
      >
        <span>
          {isNow && <span className={styles.nowMark}>いま</span>}
          {h}時{h === selHour ? " ✓" : ""}
        </span>
        <span className={`${styles.chipTotal} ${hasTotal ? "" : styles.isHidden}`}>
          <span className={styles.totalW}>{waterSum}</span>
          <span className={styles.totalSlash}>/</span>
          <span className={styles.totalU}>{urineSum}</span>
        </span>
      </button>
    );
  };

  return (
    <div className={`${styles.selector} ${inset ? styles.selectorInset : ""}`}>
      <div className={styles.headRow}>
        <span className={styles.headLabel}>⏰ 記録する時間</span>
        <span className={styles.spacer} />
        <button
          data-testid="sel-hour-prev"
          onClick={() => stepSelHour(-1)}
          className={styles.stepBtn}
        >
          ‹
        </button>
        <button
          data-testid="sel-hour-toggle"
          onClick={() => setHourDropOpen(!hourDropOpen)}
          className={styles.toggle}
        >
          {selHour}時 <span className={styles.toggleCaret}>▾</span>
        </button>
        <button
          data-testid="sel-hour-next"
          onClick={() => stepSelHour(1)}
          className={styles.stepBtn}
        >
          ›
        </button>
      </div>
      {hourDropOpen && (
        <>
          <div
            onClick={() => setHourDropOpen(false)}
            className={`overlay ${styles.overlayZ}`}
          />
          <div data-testid="hour-dropdown" className={`popover ${styles.dropdown}`}>
            <div className={styles.sectionLabel}>
              {formatDateLabel(viewDate)}
              {isToday ? " きょう" : ""}
            </div>
            <div className={styles.hourGrid}>{todayHours.map((h) => chip(h, true))}</div>
            <div className={`${styles.sectionLabel} ${styles.sectionLabelNext}`}>
              {formatDateLabel(addDays(viewDate, 1))} よくじつ
            </div>
            <div className={`${styles.hourGrid} ${styles.hourGridNext}`}>
              {nextHours.map((h) => chip(h, false))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
