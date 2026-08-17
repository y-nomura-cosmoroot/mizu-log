"use client";

import { useState } from "react";
import { barPct, groupIntakesByBandHour, sumForDay } from "@/lib/aggregate";
import { GOAL_ML } from "@/lib/constants";
import { formatTime } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import AccordionHourRow from "./AccordionHourRow";
import IntakeBandBar from "./IntakeBandBar";
import histStyles from "./history.module.css";
import styles from "./WaterUrineHistory.module.css";

function SubLabel({ n }: { n: number }) {
  if (!n) return <>—</>;
  return (
    <>
      {n}
      <span className={styles.subUnit}>ml</span>
    </>
  );
}

const kindChipLabel = { water: "飲水", urine: "尿量" } as const;

export default function WaterUrineHistory() {
  const intakes = useAppStore((s) => s.intakes);
  const deleteIntake = useAppStore((s) => s.deleteIntake);
  const viewDate = useUiStore((s) => s.viewDate);
  const openSheet = useUiStore((s) => s.openSheet);
  const showToast = useUiStore((s) => s.showToast);
  const [openHours, setOpenHours] = useState<Record<number, boolean>>({});

  const bands = groupIntakesByBandHour(intakes, viewDate);
  const waterTotal = sumForDay(intakes, "water", viewDate);
  const urineTotal = sumForDay(intakes, "urine", viewDate);

  return (
    <>
      <div className={`card ${styles.totalCard}`}>
        <div className={styles.totalBarLayer}>
          <IntakeBandBar pct={barPct(waterTotal, GOAL_ML)} kind="water" />
          <IntakeBandBar pct={barPct(urineTotal, GOAL_ML)} kind="urine" />
        </div>
        <b className={styles.totalCardFront}>1日の合計</b>
        <span className={`${styles.totalLine} ${styles.totalCardFront}`}>
          飲水{" "}
          <b data-testid="day-total-water" className={styles.totalWater}>
            {waterTotal}
            <span className={styles.totalUnit}>ml</span>
          </b>{" "}
          ・ 尿{" "}
          <b data-testid="day-total-urine" className={styles.totalUrine}>
            {urineTotal}
            <span className={styles.totalUnit}>ml</span>
          </b>
        </span>
      </div>
      {bands.map((b) => (
        <div key={b.band} className="card">
          <div className={`${histStyles.bandHeader} ${histStyles.bandHeaderSplit}`}>
            <div className={styles.bandBarLayer}>
              <IntakeBandBar pct={barPct(b.waterSum, GOAL_ML)} kind="water" />
              <IntakeBandBar pct={barPct(b.urineSum, GOAL_ML)} kind="urine" />
            </div>
            <b className={styles.bandHeaderFront}>{b.label}</b>
            <span className={`${styles.subtotalRow} ${styles.bandHeaderFront}`}>
              小計
              <span className="badge-water">飲水</span>
              <b data-testid={`band-w${b.band}`} className={styles.sumWater}>
                <SubLabel n={b.waterSum} />
              </b>
              <span className="badge-urine">尿量</span>
              <b data-testid={`band-u${b.band}`} className={styles.sumUrine}>
                <SubLabel n={b.urineSum} />
              </b>
            </span>
          </div>
          {b.hours.map((g) => (
            <AccordionHourRow
              key={g.hour}
              testId={`hour-row-${g.hour}`}
              hourLabel={`${g.hour}時`}
              count={g.items.length}
              open={!!openHours[g.hour]}
              onToggle={() =>
                setOpenHours((prev) => ({ ...prev, [g.hour]: !prev[g.hour] }))
              }
              headerContent={
                <span className={styles.hourSummary}>
                  <span className="badge-water">飲水</span>
                  <b data-testid={`hour-w-${g.hour}`} className={styles.sumWater}>
                    <SubLabel n={g.waterSum} />
                  </b>
                  <span className="badge-urine">尿量</span>
                  <b data-testid={`hour-u-${g.hour}`} className={styles.sumUrine}>
                    <SubLabel n={g.urineSum} />
                  </b>
                </span>
              }
            >
              {g.items.map((it) => (
                <div
                  key={it.id}
                  data-testid="intake-item"
                  className={`${histStyles.itemRow} ${styles.row}`}
                >
                  <span className={it.kind === "water" ? "badge-water" : "badge-urine"}>
                    {kindChipLabel[it.kind]}
                  </span>
                  <span className={styles.time}>{formatTime(it.recordedAt)}</span>
                  <span className={styles.ml}>
                    {it.ml} <span className={styles.mlUnit}>ml</span>
                  </span>
                  <button
                    onClick={() =>
                      openSheet({ type: "ml", id: it.id, kind: it.kind, ml: it.ml })
                    }
                    className="btn-edit"
                  >
                    なおす
                  </button>
                  <button
                    onClick={() => {
                      deleteIntake(it.id);
                      showToast("けしました");
                    }}
                    className="btn-del"
                  >
                    けす
                  </button>
                </div>
              ))}
            </AccordionHourRow>
          ))}
        </div>
      ))}
    </>
  );
}
