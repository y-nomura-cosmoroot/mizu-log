"use client";

import { QUICK_AMOUNTS } from "@/lib/constants";
import type { IntakeKind } from "@/types/records";
import styles from "./IntakePanel.module.css";

const LABEL = { water: "この時間の飲水量", urine: "この時間の尿量" } as const;

export default function IntakePanel({
  kind,
  hourMl,
  dayTotalMl,
  customMl,
  onCustomChange,
  onAdd,
}: {
  kind: IntakeKind;
  hourMl: number;
  dayTotalMl: number;
  customMl: number;
  onCustomChange: (v: number) => void;
  onAdd: (ml: number) => void;
}) {
  return (
    <div className={styles.panel} data-kind={kind}>
      <span className={styles.label}>{LABEL[kind]}</span>
      <span data-testid={`${kind}-hour-ml`} className={styles.hourNum}>
        {hourMl}
        <span className={styles.hourUnit}>ml</span>
      </span>
      <div className={styles.quickGrid}>
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            data-testid={`quick-${kind}-${v}`}
            onClick={() => onAdd(v)}
            className={styles.quickBtn}
          >
            ＋{v}
          </button>
        ))}
      </div>
      <div className={styles.customRow}>
        <input
          data-testid={`custom-${kind}-input`}
          type="number"
          min={0}
          value={customMl || ""}
          onChange={(e) => onCustomChange(parseInt(e.target.value, 10) || 0)}
          inputMode="numeric"
          className={styles.customInput}
        />
        <span className={styles.customUnit}>ml</span>
        <button
          data-testid={`custom-${kind}-add`}
          onClick={() => {
            if (customMl > 0) onAdd(customMl);
          }}
          className={styles.addBtn}
        >
          ＋記録
        </button>
      </div>
      <span className={styles.totalPill}>
        今日の合計{" "}
        <b data-testid={`${kind}-day-total`} className={styles.totalNum}>
          {dayTotalMl}
          <span className={styles.totalUnit}>ml</span>
        </b>
      </span>
    </div>
  );
}
