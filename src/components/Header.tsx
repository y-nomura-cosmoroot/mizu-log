"use client";

import { formatDateLabel } from "@/lib/time";
import { useUiStore, type HistSub } from "@/stores/useUiStore";
import CalendarPopup from "./CalendarPopup";
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
  const viewDate = useUiStore((s) => s.viewDate);
  const goPrevDay = useUiStore((s) => s.goPrevDay);
  const goNextDay = useUiStore((s) => s.goNextDay);
  const calOpen = useUiStore((s) => s.calOpen);
  const setCalOpen = useUiStore((s) => s.setCalOpen);

  return (
    <div className={styles.header}>
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          <div className={styles.logoMark} />
          <span className={styles.brandName}>みずログ</span>
        </div>
      </div>

      <div className={styles.dateRow}>
        <button data-testid="prev-day" onClick={goPrevDay} className={styles.navBtn}>
          ‹
        </button>
        <div className={styles.dateWrap}>
          <div
            data-testid="date-label"
            onClick={() => setCalOpen(!calOpen)}
            className={styles.dateLabel}
          >
            {formatDateLabel(viewDate)} <span className={styles.caret}>▾</span>
          </div>
          {calOpen && <CalendarPopup />}
        </div>
        <button
          data-testid="next-day"
          onClick={() => goNextDay(new Date())}
          className={styles.navBtn}
        >
          ›
        </button>
      </div>

      {tab === "history" && (
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
