"use client";

import { WEEKDAY_ORDER } from "@/lib/constants";
import { WEEKDAY_LABELS } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { Timing, Weekday } from "@/types/records";
import medsStyles from "./meds.module.css";
import styles from "./TimingMasterCard.module.css";

export default function TimingMasterCard() {
  const timings = useAppStore((s) => s.timings);
  const addTiming = useAppStore((s) => s.addTiming);
  const removeTiming = useAppStore((s) => s.removeTiming);
  const moveTiming = useAppStore((s) => s.moveTiming);
  const toggleTimingWeekday = useAppStore((s) => s.toggleTimingWeekday);
  const newTiming = useUiStore((s) => s.newTiming);
  const setNewTiming = useUiStore((s) => s.setNewTiming);
  const movedTiming = useUiStore((s) => s.movedTiming);
  const markMovedTiming = useUiStore((s) => s.markMovedTiming);
  const showToast = useUiStore((s) => s.showToast);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= timings.length) return;
    markMovedTiming(timings[i].name);
    moveTiming(i, d);
  };

  const add = () => {
    const v = newTiming.trim();
    if (!v || timings.some((t) => t.name === v)) return;
    addTiming(v);
    setNewTiming("");
  };

  // 最後の1曜日は外せない（store も変更しない）。理由をトーストで伝える
  const toggleWeekday = (t: Timing, wd: Weekday) => {
    if (t.weekdays.length === 1 && t.weekdays[0] === wd) {
      showToast("曜日は 1つ以上 えらんでください");
      return;
    }
    toggleTimingWeekday(t.name, wd);
  };

  return (
    <div className={`panel ${styles.root}`}>
      <div className={medsStyles.sectionLabel}>のむタイミング</div>
      {timings.map((t, i) => (
        // testid と isMoved は外側ブロックに置く（rowpop アニメーションの検証対象）
        <div
          key={t.name}
          data-testid={`timing-master-row-${t.name}`}
          className={`${styles.row} ${t.name === movedTiming ? medsStyles.isMoved : ""}`}
        >
          <div className={styles.rowMain}>
            <span className={styles.handle}>≡</span>
            <span className={styles.name}>{t.name}</span>
            <button
              data-testid={`timing-up-${t.name}`}
              onClick={() => move(i, -1)}
              className={styles.smallBtn}
            >
              ↑
            </button>
            <button
              data-testid={`timing-down-${t.name}`}
              onClick={() => move(i, 1)}
              className={styles.smallBtn}
            >
              ↓
            </button>
            <button
              data-testid={`timing-del-${t.name}`}
              onClick={() => removeTiming(t.name)}
              className={styles.delBtnSmall}
            >
              けす
            </button>
          </div>
          <div className={styles.weekdayGrid} role="group" aria-label={`${t.name}をのむ曜日`}>
            {WEEKDAY_ORDER.map((wd) => {
              const on = t.weekdays.includes(wd);
              return (
                <button
                  key={wd}
                  type="button"
                  data-testid={`timing-weekday-${t.name}-${wd}`}
                  data-on={on}
                  aria-pressed={on}
                  onClick={() => toggleWeekday(t, wd)}
                  className={styles.weekdayChip}
                >
                  {WEEKDAY_LABELS[wd]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className={styles.addRow}>
        <input
          data-testid="new-timing-input"
          value={newTiming}
          onChange={(e) => setNewTiming(e.target.value)}
          placeholder="例: ねる前"
          className={`input ${styles.newInput}`}
        />
        <button data-testid="add-timing" onClick={add} className={styles.addBtn}>
          追加
        </button>
      </div>
    </div>
  );
}
