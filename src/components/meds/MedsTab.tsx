"use client";

import { activeTimings } from "@/lib/meds";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import MedicineMasterCard from "./MedicineMasterCard";
import TimingCheckRow from "./TimingCheckRow";
import TimingMasterCard from "./TimingMasterCard";
import styles from "./MedsTab.module.css";

export default function MedsTab() {
  const timings = useAppStore((s) => s.timings);
  const medChecks = useAppStore((s) => s.medChecks);
  const viewDate = useUiStore((s) => s.viewDate);
  const masterMode = useUiStore((s) => s.medsMasterMode);
  const setMasterMode = useUiStore((s) => s.setMedsMasterMode);

  // 曜日は表示中の記録日（viewDate）で判定する。new Date() を使うと過去日を見たときに今日の曜日で絞ってしまう
  const active = activeTimings(timings, viewDate);
  const activeNames = new Set(active.map((t) => t.name));
  const checks = medChecks[viewDate] ?? {};
  // 進捗の分子・分母はどちらも「その日に飲む対象」だけ（対象外の日に付いた実績は数えない）
  const done = active.filter((t) => checks[t.name] != null).length;

  return (
    <div className={styles.tab}>
      <div className={styles.headRow}>
        <div className={styles.headLabel}>
          きょうの分{" "}
          <span data-testid="meds-progress" className={styles.progress}>
            <b className={styles.progressNum}>{done}</b> /{" "}
            <b className={styles.progressNum}>{active.length}</b> かんりょう
          </span>
        </div>
        <button
          data-testid="toggle-master"
          onClick={() => setMasterMode(!masterMode)}
          className={styles.masterToggle}
        >
          {masterMode ? "← チェックにもどる" : "マスタを編集"}
        </button>
      </div>

      {!masterMode && active.length === 0 && timings.length > 0 && (
        <div data-testid="meds-empty-note" className={`panel ${styles.emptyNote}`}>
          この日は のむおくすりが ありません
        </div>
      )}

      {!masterMode &&
        timings.map((t) => (
          <TimingCheckRow key={t.name} timing={t} inactive={!activeNames.has(t.name)} />
        ))}

      {masterMode && (
        <>
          <TimingMasterCard />
          <MedicineMasterCard />
        </>
      )}
    </div>
  );
}
