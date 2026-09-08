"use client";

import { sumForHour } from "@/lib/aggregate";
import { formatCalendarLabel, ymOf } from "@/lib/calendar";
import { formatDateLabel, getRecordDate, HOURS, isHourMismatched } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
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
  const todayKey = useUiStore((s) => s.todayKey);
  const setViewDate = useUiStore((s) => s.setViewDate);
  const goPrevDay = useUiStore((s) => s.goPrevDay);
  const goNextDay = useUiStore((s) => s.goNextDay);
  const goPrevMonth = useUiStore((s) => s.goPrevMonth);
  const goNextMonth = useUiStore((s) => s.goNextMonth);
  const calOpen = useUiStore((s) => s.calOpen);
  const setCalOpen = useUiStore((s) => s.setCalOpen);

  const intakes = useAppStore((s) => s.intakes);
  const selHour = useUiStore((s) => s.selHour);
  const nowHour = useUiStore((s) => s.nowHour);
  const setSelHour = useUiStore((s) => s.setSelHour);
  const stepSelHour = useUiStore((s) => s.stepSelHour);
  const hourDropOpen = useUiStore((s) => s.hourDropOpen);
  const setHourDropOpen = useUiStore((s) => s.setHourDropOpen);

  // りれきタブで「月ごとに見る」ON中は、日付ナビが月ナビに切り替わる
  // （viewDateはAppShellのハイドレーションゲート後に必ず設定済み）
  const monthly = tab === "history" && histMonthly;
  const { year, month0 } = ymOf(viewDate);
  // りれきタブには記録する時間の概念がないため時間ナビを出さない
  const showTimeNav = tab !== "history";

  // 「今日か」「いま何時か」は AppShell の毎分tickが更新する store の値を見る。
  // ここで new Date() を読むと、開いたまま時間が過ぎても再レンダリングが起きず表示が古いままになる
  const isToday = viewDate === todayKey;
  const hourMismatch = isHourMismatched(viewDate, todayKey, selHour, nowHour);

  const hourChip = (h: number) => {
    const waterSum = sumForHour(intakes, "water", viewDate, h);
    const urineSum = sumForHour(intakes, "urine", viewDate, h);
    const hasTotal = waterSum > 0 || urineSum > 0;
    const isNow = isToday && h === nowHour;
    return (
      <button
        key={h}
        data-testid={`hour-chip-${h}`}
        data-selected={h === selHour}
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
    <div className={styles.header}>
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          <div className={styles.logoMark} />
          <span className={styles.brandName}>みずログ</span>
        </div>
        <div className={styles.brandActions}>
          {/* 開きっぱなしで時間が過ぎたときだけ出る復帰ボタン（見落とし防止に点滅させる） */}
          {showTimeNav && hourMismatch && (
            <button
              data-testid="sel-hour-reset"
              onClick={() => setSelHour(nowHour)}
              className={styles.resetBtn}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.resetIcon}
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              {nowHour}時（いま）に戻る
            </button>
          )}
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
      </div>

      <div className={styles.dateRow}>
        <div className={styles.dateNavGroup}>
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

          {showTimeNav && (
            <div className={styles.timeNav}>
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
                className={`${styles.toggle} ${hourMismatch ? styles.isMismatch : ""}`}
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
          )}
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

        {showTimeNav && hourDropOpen && (
          <>
            <div
              onClick={() => setHourDropOpen(false)}
              className={`overlay ${styles.hourOverlayZ}`}
            />
            {/* 記録日=暦日なので 0〜23時 の1ブロック（4列×6行 = 小計帯ごとに2行） */}
            <div data-testid="hour-dropdown" className={`popover ${styles.dropdown}`}>
              <div className={styles.sectionLabel}>
                {formatDateLabel(viewDate)}
                {isToday ? " きょう" : ""}
              </div>
              <div className={styles.hourGrid}>{HOURS.map((h) => hourChip(h))}</div>
            </div>
          </>
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
