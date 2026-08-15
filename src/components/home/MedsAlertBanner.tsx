"use client";

import { useUiStore } from "@/stores/useUiStore";
import styles from "./MedsAlertBanner.module.css";

/** ⚠️飲み忘れアラートバナー（未チェックのタイミングがあるとき、今日のみ表示） */
export default function MedsAlertBanner({ unchecked }: { unchecked: string[] }) {
  const setTab = useUiStore((s) => s.setTab);
  return (
    <div
      data-testid="med-alert-banner"
      onClick={() => setTab("meds")}
      className={styles.banner}
    >
      <span className={styles.icon}>⚠️</span>
      <div className={styles.body}>
        <div className={styles.title}>飲み忘れあり！</div>
        <div className={styles.sub}>{unchecked.join("・")} がまだです</div>
      </div>
      <span className={styles.chev}>›</span>
    </div>
  );
}
