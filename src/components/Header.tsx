"use client";

import { formatCalendarLabel, ymOf } from "@/lib/calendar";
import { formatDateLabel, getRecordDate } from "@/lib/time";
import { useUiStore, type HistSub } from "@/stores/useUiStore";
import CalendarPopup from "./CalendarPopup";
import MonthPickerPopup from "./MonthPickerPopup";
import styles from "./Header.module.css";

const SUB_TABS: ReadonlyArray<{ key: HistSub; label: string }> = [
  { key: "water", label: "飲水量/尿量" },
  { key: "vital", label: "バイタル" },
  { key: "meds", label: "おくすり" },
];

export default function Header() {
  const tab = useUiStore((s) => s.tab);
  const histSub = useUiStore((s) => s.histSub);
  const setHistSub = useUiStore((s) => s.setHistSub);
  const histMonthly = useUiStore((s) => s.histMonthly);
  const setHistMonthly = useUiStore((s) => s.setHistMonthly);
  const viewDate = useUiStore((s) => s.viewDate);
  const setViewDate = useUiStore((s) => s.setViewDate);
  const goPrevDay = useUiStore((s) => s.goPrevDay);
  const goNextDay = useUiStore((s) => s.goNextDay);
  const goPrevMonth = useUiStore((s) => s.goPrevMonth);
  const goNextMonth = useUiStore((s) => s.goNextMonth);
  const calOpen = useUiStore((s) => s.calOpen);
  const setCalOpen = useUiStore((s) => s.setCalOpen);

  // りれきタブで「月ごとに見る」ON中は、日付ナビが月ナビに切り替わる
  // （viewDateはAppShellのハイドレーションゲート後に必ず設定済み）
  const monthly = tab === "history" && histMonthly;
  const { year, month0 } = ymOf(viewDate);

  return (
    <div className={styles.header}>
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          <div className={styles.logoMark} />
          <span className={styles.brandName}>みずログ</span>
        </div>
        {tab === "history" && (
          <button
            data-testid="toggle-monthly"
            role="switch"
            aria-checked={histMonthly}
            data-on={histMonthly}
            onClick={() => setHistMonthly(!histMonthly)}
            className={styles.monthlyToggle}
          >
            <span className={styles.switchTrack}>
              <span className={styles.switchKnob} />
            </span>
            <span className={styles.switchLabel}>月ごとに見る</span>
          </button>
        )}
      </div>

      <div className={styles.dateRow}>
        <button
          data-testid="prev-day"
          onClick={monthly ? goPrevMonth : goPrevDay}
          className={styles.navBtn}
        >
          ‹
        </button>
        <div className={styles.dateWrap}>
          <div
            data-testid="date-label"
            onClick={() => setCalOpen(!calOpen)}
            className={styles.dateLabel}
          >
            {monthly ? formatCalendarLabel(year, month0) : formatDateLabel(viewDate)}{" "}
            <span className={styles.caret}>▾</span>
          </div>
          {calOpen && (monthly ? <MonthPickerPopup /> : <CalendarPopup />)}
        </div>
        <button
          data-testid="next-day"
          onClick={() => (monthly ? goNextMonth(new Date()) : goNextDay(new Date()))}
          className={styles.navBtn}
        >
          ›
        </button>
        {!monthly && (
          <button
            data-testid="go-today"
            onClick={() => setViewDate(getRecordDate(new Date()))}
            className={styles.todayBtn}
          >
            今日に戻る
          </button>
        )}
      </div>

      {tab === "history" && !histMonthly && (
        <div className={styles.subTabs}>
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`hist-sub-${t.key}`}
              onClick={() => setHistSub(t.key)}
              className={`chip ${histSub === t.key ? "chip--on" : "chip--off"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
