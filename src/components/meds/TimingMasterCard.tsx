"use client";

import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import medsStyles from "./meds.module.css";
import styles from "./TimingMasterCard.module.css";

export default function TimingMasterCard() {
  const timings = useAppStore((s) => s.timings);
  const addTiming = useAppStore((s) => s.addTiming);
  const removeTiming = useAppStore((s) => s.removeTiming);
  const moveTiming = useAppStore((s) => s.moveTiming);
  const newTiming = useUiStore((s) => s.newTiming);
  const setNewTiming = useUiStore((s) => s.setNewTiming);
  const movedTiming = useUiStore((s) => s.movedTiming);
  const markMovedTiming = useUiStore((s) => s.markMovedTiming);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= timings.length) return;
    markMovedTiming(timings[i]);
    moveTiming(i, d);
  };

  const add = () => {
    const v = newTiming.trim();
    if (!v || timings.includes(v)) return;
    addTiming(v);
    setNewTiming("");
  };

  return (
    <div className={`panel ${styles.root}`}>
      <div className={medsStyles.sectionLabel}>のむタイミング</div>
      {timings.map((t, i) => (
        <div
          key={t}
          data-testid={`timing-master-row-${t}`}
          className={`${styles.row} ${t === movedTiming ? medsStyles.isMoved : ""}`}
        >
          <span className={styles.handle}>≡</span>
          <span className={styles.name}>{t}</span>
          <button
            data-testid={`timing-up-${t}`}
            onClick={() => move(i, -1)}
            className={styles.smallBtn}
          >
            ↑
          </button>
          <button
            data-testid={`timing-down-${t}`}
            onClick={() => move(i, 1)}
            className={styles.smallBtn}
          >
            ↓
          </button>
          <button
            data-testid={`timing-del-${t}`}
            onClick={() => removeTiming(t)}
            className={styles.delBtnSmall}
          >
            けす
          </button>
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
