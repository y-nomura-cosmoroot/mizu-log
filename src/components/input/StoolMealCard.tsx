"use client";

import { countFlags } from "@/lib/aggregate";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { FlagKind } from "@/types/records";
import styles from "./StoolMealCard.module.css";

export default function StoolMealCard() {
  const flags = useAppStore((s) => s.flags);
  const addFlag = useAppStore((s) => s.addFlag);
  const viewDate = useUiStore((s) => s.viewDate);
  const selHour = useUiStore((s) => s.selHour);
  const showToast = useUiStore((s) => s.showToast);

  const stoolCount = countFlags(flags, "stool", viewDate);
  const mealCount = countFlags(flags, "meal", viewDate);

  const add = (kind: FlagKind) => {
    addFlag(kind, viewDate, selHour, 0);
    showToast(kind === "stool" ? "便をきろくしました" : "食事をきろくしました");
  };

  return (
    <div className={`panel ${styles.root}`}>
      <div className={styles.title}>便・食事</div>
      <div className={styles.btnRow}>
        <button data-testid="add-stool" onClick={() => add("stool")} className={styles.flagBtn}>
          💩 便があった{stoolCount ? `（${stoolCount}回）` : ""}
        </button>
        <button data-testid="add-meal" onClick={() => add("meal")} className={styles.flagBtn}>
          🍴 食事をした{mealCount ? `（${mealCount}回）` : ""}
        </button>
      </div>
    </div>
  );
}
