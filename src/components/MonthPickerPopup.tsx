"use client";

import { useState } from "react";
import { pad2, ymKey, ymOf } from "@/lib/calendar";
import { getRecordDate } from "@/lib/time";
import { useUiStore } from "@/stores/useUiStore";
import styles from "./MonthPickerPopup.module.css";

/** 「月ごとに見る」ON時の月ピッカー（月ラベル押下で開く）。未来月は選べない */
export default function MonthPickerPopup() {
  const viewDate = useUiStore((s) => s.viewDate);
  const setViewDate = useUiStore((s) => s.setViewDate);
  const setCalOpen = useUiStore((s) => s.setCalOpen);

  const today = getRecordDate(new Date());
  const { year: viewYear, month0: viewMonth0 } = ymOf(viewDate);
  const { year: thisYear } = ymOf(today);
  // 表示中の年はポップアップ内だけの一時状態（閉じるとリセット）
  const [year, setYear] = useState(viewYear);

  const pick = (m0: number) => {
    const first = `${year}-${pad2(m0 + 1)}-01`;
    if (ymKey(first) > ymKey(today)) return;
    // 今月を選んだら1日ではなく今日に合わせる（setViewDateがポップアップも閉じる）
    setViewDate(ymKey(first) === ymKey(today) ? today : first);
  };

  return (
    <>
      <div
        data-testid="cal-overlay"
        onClick={() => setCalOpen(false)}
        className={`overlay ${styles.overlayZ}`}
      />
      <div data-testid="month-picker" className={`popover ${styles.popup}`}>
        <div className={styles.yearRow}>
          <button onClick={() => setYear(year - 1)} className={styles.yearBtn}>
            ‹
          </button>
          <span className={styles.yearLabel}>{year}年</span>
          <button
            onClick={() => setYear(year + 1)}
            disabled={year >= thisYear}
            className={styles.yearBtn}
          >
            ›
          </button>
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 12 }, (_, m0) => {
            const key = `${year}-${pad2(m0 + 1)}`;
            const disabled = key > ymKey(today);
            const selected = year === viewYear && m0 === viewMonth0;
            const isCurrent = key === ymKey(today);
            return (
              <button
                key={m0}
                data-testid={`pick-month-${key}`}
                data-state={
                  selected ? "selected" : disabled ? "disabled" : isCurrent ? "today" : "normal"
                }
                disabled={disabled}
                onClick={() => pick(m0)}
                className={styles.cell}
              >
                {m0 + 1}月
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
