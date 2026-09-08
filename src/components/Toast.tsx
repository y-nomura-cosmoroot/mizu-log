"use client";

import { pad2 } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import styles from "./Toast.module.css";

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  const showToast = useUiStore((s) => s.showToast);
  const setSelHour = useUiStore((s) => s.setSelHour);
  const retimeRecord = useAppStore((s) => s.retimeRecord);

  if (!toast) return null;
  const { msg, fix } = toast;

  // 記録の時刻をなおすと同時に、ヘッダの「記録する時間」も現在時へ合わせる
  // （次の記録が同じズレ方をしないため）
  const fixTime = () => {
    if (!fix) return;
    retimeRecord(fix.kind, fix.id, fix.hour, fix.minute);
    setSelHour(fix.hour);
    showToast(`${fix.hour}:${pad2(fix.minute)} になおしました`);
  };

  return (
    <div data-testid="toast" className={`${styles.toast} ${fix ? styles.hasFix : ""}`}>
      {fix ? (
        <>
          <span className={styles.body}>
            {msg}
            <span className={styles.sub}>
              いまは {fix.hour}:{pad2(fix.minute)} です
            </span>
          </span>
          <button data-testid="toast-fix" onClick={fixTime} className={styles.fixBtn}>
            {fix.hour}時になおす
          </button>
        </>
      ) : (
        msg
      )}
    </div>
  );
}
