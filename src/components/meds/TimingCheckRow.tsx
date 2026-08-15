"use client";

import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import MedDoseList from "./MedDoseList";
import medsStyles from "./meds.module.css";
import styles from "./TimingCheckRow.module.css";

export default function TimingCheckRow({ timing }: { timing: string }) {
  const medicines = useAppStore((s) => s.medicines);
  const medChecks = useAppStore((s) => s.medChecks);
  const toggleMedCheck = useAppStore((s) => s.toggleMedCheck);
  const viewDate = useUiStore((s) => s.viewDate);
  const selHour = useUiStore((s) => s.selHour);
  const movedTiming = useUiStore((s) => s.movedTiming);

  const checked = (medChecks[viewDate] ?? {})[timing] != null;
  const toggle = () => toggleMedCheck(viewDate, timing, selHour);

  return (
    <div
      data-testid={`timing-row-${timing}`}
      className={`${styles.row} ${checked ? styles.isChecked : ""} ${
        timing === movedTiming ? medsStyles.isMoved : ""
      }`}
    >
      <button
        data-testid={`timing-check-${timing}`}
        onClick={toggle}
        className={styles.checkBtn}
      >
        {checked ? "✓" : ""}
      </button>
      <div className={styles.body}>
        <div className={styles.title}>
          {timing}{" "}
          <span className={styles.status}>
            {checked ? "チェックずみ" : "まだ"}
          </span>
        </div>
        <div className={styles.meds}>
          <MedDoseList medicines={medicines} timing={timing} size="sm" />
        </div>
      </div>
      {!checked && (
        <button
          data-testid={`drank-btn-${timing}`}
          onClick={toggle}
          className={styles.drankBtn}
        >
          のんだ！
        </button>
      )}
    </div>
  );
}
