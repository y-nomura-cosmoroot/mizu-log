"use client";

import { useState } from "react";
import { activeTimings, groupMedChecksByBandHour, uncheckedTimings } from "@/lib/meds";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import AccordionHourRow from "./AccordionHourRow";
import MedDoseList from "../meds/MedDoseList";
import histStyles from "./history.module.css";
import styles from "./MedsHistory.module.css";

export default function MedsHistory() {
  const timings = useAppStore((s) => s.timings);
  const medicines = useAppStore((s) => s.medicines);
  const medChecks = useAppStore((s) => s.medChecks);
  const viewDate = useUiStore((s) => s.viewDate);
  const [openHours, setOpenHours] = useState<Record<number, boolean>>({});

  const bands = groupMedChecksByBandHour(timings, medChecks, viewDate);
  const unchecked = uncheckedTimings(timings, medChecks, viewDate);
  const ok = unchecked.length === 0;
  // その日の曜日に飲むタイミングが1つも無い日は「ぜんぶ飲めました」ではなく「のむおくすりの ない日」
  const noneToday = activeTimings(timings, viewDate).length === 0;

  return (
    <>
      <div data-testid="meds-result-card" data-ok={ok} className={styles.resultCard}>
        <span className={styles.resultIcon}>{ok ? (noneToday ? "🗓" : "🎉") : "⚠️"}</span>
        <div className={styles.resultBody}>
          <div className={styles.resultTitle}>
            {ok ? (noneToday ? "のむおくすりの ない日" : "飲み忘れなし！") : "飲み忘れあり！"}
          </div>
          <div className={styles.resultSub}>
            {ok
              ? noneToday
                ? "この日は のむおくすりが ありません"
                : "この日はぜんぶ飲めました。えらい！"
              : `${unchecked.join("・")} がまだです`}
          </div>
        </div>
      </div>
      {bands.map((b) => (
        <div key={b.band} className="card">
          <div className={histStyles.bandHeader}>
            <b>{b.label}</b>
          </div>
          {b.empty && <div className={histStyles.emptyNote}>記録なし</div>}
          {b.hours.map((g) => (
            <AccordionHourRow
              key={g.hour}
              testId={`meds-hour-row-${g.hour}`}
              hourLabel={`${g.hour}時`}
              count={g.entries.length}
              open={!!openHours[g.hour]}
              onToggle={() =>
                setOpenHours((prev) => ({ ...prev, [g.hour]: !prev[g.hour] }))
              }
              headerContent={
                <span className={styles.hourTimings}>
                  {g.entries.map((e) => e.timing).join(" ・ ")}
                </span>
              }
            >
              {g.entries.map((e) => (
                <div
                  key={e.timing}
                  data-testid="med-check-item"
                  className={`${histStyles.itemRow} ${styles.row}`}
                >
                  <span className={styles.timingCol}>💊 {e.timing}</span>
                  <span className={styles.hourCol}>{e.hour}:00</span>
                  <span className={styles.medsCol}>
                    <MedDoseList medicines={medicines} timing={e.timing} />
                  </span>
                </div>
              ))}
            </AccordionHourRow>
          ))}
        </div>
      ))}
    </>
  );
}
