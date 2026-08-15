"use client";

import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import TimeSelector from "../TimeSelector";
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

  const checks = medChecks[viewDate] ?? {};
  const done = timings.filter((t) => checks[t] != null).length;

  return (
    <div className={styles.tab}>
      <TimeSelector />

      <div className={styles.headRow}>
        <div className={styles.headLabel}>
          きょうの分{" "}
          <span data-testid="meds-progress" className={styles.progress}>
            <b className={styles.progressNum}>{done}</b> /{" "}
            <b className={styles.progressNum}>{timings.length}</b> かんりょう
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

      {!masterMode &&
        timings.map((t) => <TimingCheckRow key={t} timing={t} />)}

      {masterMode && (
        <>
          <TimingMasterCard />
          <MedicineMasterCard />
        </>
      )}
    </div>
  );
}
