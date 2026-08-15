"use client";

import styles from "./AccordionHourRow.module.css";

/** 履歴の時間ごとの折りたたみ行（▸クリックで展開） */
export default function AccordionHourRow({
  testId,
  hourLabel,
  headerContent,
  count,
  open,
  onToggle,
  children,
}: {
  testId: string;
  hourLabel: string;
  headerContent: React.ReactNode;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div data-testid={testId} onClick={onToggle} className={styles.header}>
        <span className={`${styles.arrow} ${open ? styles.isOpen : ""}`}>▸</span>
        <b className={styles.hourLabel}>{hourLabel}</b>
        {headerContent}
        <span className={styles.count}>{count}件</span>
      </div>
      {open && children}
    </div>
  );
}
