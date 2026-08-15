"use client";

import { useState } from "react";
import { groupVitalEntriesByBandHour } from "@/lib/aggregate";
import { formatTime } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { VitalRecord } from "@/types/records";
import AccordionHourRow from "./AccordionHourRow";
import histStyles from "./history.module.css";
import styles from "./VitalHistory.module.css";

function BpIconSmall() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21S2.8 15.2 2.8 9.1A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 9.2 2.9c0 6.1-9.2 11.9-9.2 11.9Z"
        fill="#155a8f"
      />
      <path
        d="M5.6 11.4h2.6l1.5-3.1 2 5.6 1.4-2.5h2.9"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WeightIconSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" stroke="#155a8f" strokeWidth="2" />
      <path d="M8 11.5a4 4 0 0 1 8 0" stroke="#155a8f" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 11.5l2.4-2.2" stroke="#155a8f" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type VitalValues = Pick<VitalRecord, "temp" | "bpSys" | "bpDia" | "pulse" | "weight">;

/** バイタル値の表示パーツ（🌡36.5℃・血圧・💓・体重）。個別レコードにも行サマリにも使う */
function VitalParts({ v }: { v: VitalValues }) {
  return (
    <>
      {v.temp && (
        <span className={styles.partWrap}>
          <span className={styles.partIcon}>🌡</span>
          <b className={styles.partVal}>
            {v.temp}
            <span className={styles.partUnit}>℃</span>
          </b>
        </span>
      )}
      {v.bpSys && (
        <span className={styles.partWrap}>
          <BpIconSmall />
          <b className={styles.partVal}>
            {v.bpSys}/{v.bpDia || "—"}
          </b>
        </span>
      )}
      {v.pulse && (
        <span className={styles.partWrap}>
          <span className={styles.partIcon}>💓</span>
          <b className={styles.partVal}>{v.pulse}</b>
        </span>
      )}
      {v.weight && (
        <span className={styles.partWrap}>
          <WeightIconSmall />
          <b className={styles.partVal}>
            {v.weight}
            <span className={styles.partUnit}>kg</span>
          </b>
        </span>
      )}
    </>
  );
}

export default function VitalHistory() {
  const vitals = useAppStore((s) => s.vitals);
  const flags = useAppStore((s) => s.flags);
  const deleteVital = useAppStore((s) => s.deleteVital);
  const deleteFlag = useAppStore((s) => s.deleteFlag);
  const viewDate = useUiStore((s) => s.viewDate);
  const openSheet = useUiStore((s) => s.openSheet);
  const showToast = useUiStore((s) => s.showToast);
  const [openHours, setOpenHours] = useState<Record<number, boolean>>({});

  const bands = groupVitalEntriesByBandHour(vitals, flags, viewDate);
  const totalEmpty = bands.every((b) => b.empty);

  if (totalEmpty) {
    return (
      <div data-testid="vital-hist-empty" className={styles.histEmpty}>
        この日のバイタルの記録はまだありません
      </div>
    );
  }

  return (
    <>
      {bands.map((b) => (
        <div key={b.band} className="card">
          <div className={histStyles.bandHeader}>
            <b>{b.label}</b>
          </div>
          {b.empty && <div className={histStyles.emptyNote}>記録なし</div>}
          {b.hours.map((g) => (
            <AccordionHourRow
              key={g.hour}
              testId={`vital-hour-row-${g.hour}`}
              hourLabel={`${g.hour}時`}
              count={g.items.length}
              open={!!openHours[g.hour]}
              onToggle={() =>
                setOpenHours((prev) => ({ ...prev, [g.hour]: !prev[g.hour] }))
              }
              headerContent={
                <span className={styles.hourSummary}>
                  {g.summary && <VitalParts v={g.summary} />}
                  {g.stoolCount > 0 && (
                    <span className={styles.partWrap}>
                      <span className={styles.partIcon}>💩</span>
                      <b className={styles.partVal}>
                        {g.stoolCount}
                        <span className={styles.partUnit}>回</span>
                      </b>
                    </span>
                  )}
                  {g.mealCount > 0 && (
                    <span className={styles.partWrap}>
                      <span className={styles.partIcon}>🍴</span>
                      <b className={styles.partVal}>
                        {g.mealCount}
                        <span className={styles.partUnit}>回</span>
                      </b>
                    </span>
                  )}
                </span>
              }
            >
              {g.items.map((it) => (
                <div
                  key={it.type === "vital" ? it.vital.id : it.flag.id}
                  data-testid={it.type === "vital" ? "vital-item" : "flag-item"}
                  className={`${histStyles.itemRow} ${styles.row}`}
                >
                  <span className={styles.time}>
                    {formatTime(
                      it.type === "vital" ? it.vital.recordedAt : it.flag.recordedAt
                    )}
                  </span>
                  <span className={styles.itemParts}>
                    {it.type === "vital" ? (
                      <VitalParts v={it.vital} />
                    ) : (
                      <span className={styles.partWrap}>
                        <span className={styles.partIcon}>
                          {it.flag.kind === "stool" ? "💩" : "🍴"}
                        </span>
                        <b className={styles.partVal}>
                          {it.flag.kind === "stool" ? "便 あり" : "食事 あり"}
                        </b>
                      </span>
                    )}
                  </span>
                  {it.type === "vital" && (
                    <button
                      onClick={() =>
                        openSheet({
                          type: "vital",
                          id: it.vital.id,
                          temp: it.vital.temp,
                          bpSys: it.vital.bpSys,
                          bpDia: it.vital.bpDia,
                          pulse: it.vital.pulse,
                          weight: it.vital.weight,
                        })
                      }
                      className="btn-edit"
                    >
                      なおす
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (it.type === "vital") {
                        deleteVital(it.vital.id);
                      } else {
                        deleteFlag(it.flag.id);
                      }
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
