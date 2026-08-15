"use client";

import { buildMonthlySummary } from "@/lib/aggregate";
import { ymOf } from "@/lib/calendar";
import { getRecordDate, weekdayOf } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import styles from "./MonthlyHistory.module.css";

/** 「月ごとに見る」ON時の一覧。月の各日を1行にして飲水/尿・便・食事・飲み忘れを並べる */
export default function MonthlyHistory() {
  const intakes = useAppStore((s) => s.intakes);
  const vitals = useAppStore((s) => s.vitals);
  const flags = useAppStore((s) => s.flags);
  const medChecks = useAppStore((s) => s.medChecks);
  const timings = useAppStore((s) => s.timings);
  const viewDate = useUiStore((s) => s.viewDate);
  const setViewDate = useUiStore((s) => s.setViewDate);
  const setHistMonthly = useUiStore((s) => s.setHistMonthly);
  const setHistSub = useUiStore((s) => s.setHistSub);

  /**
   * 日行タップで月ごとを解除し、その日の（日ごと）りれきへ先頭スクロールで移動する。
   * サブタブは「飲水量/尿量」に戻す（ユーザ指示）
   */
  const openDay = (date: string) => {
    setViewDate(date);
    setHistSub("water");
    setHistMonthly(false);
    window.scrollTo(0, 0);
  };

  const today = getRecordDate(new Date());
  const { year, month0 } = ymOf(viewDate);
  const days = buildMonthlySummary(
    intakes,
    vitals,
    flags,
    medChecks,
    timings,
    year,
    month0,
    today
  );

  return (
    <div className="card">
      {days.map((d) => (
        <div
          key={d.date}
          data-testid={`month-row-${d.date}`}
          onClick={() => openDay(d.date)}
          className={`${styles.row} ${d.hasRecords ? "" : styles.isEmpty}`}
        >
          <div className={styles.dayCol}>
            <span className={styles.dayNum}>{d.day}</span>
            <span className={styles.dayMeta}>{weekdayOf(d.date)}</span>
          </div>
          <div className={styles.content}>
            {d.hasRecords ? (
              <>
                <span>
                  飲水{" "}
                  <b className={`${styles.num} ${styles.numWater}`}>
                    {d.waterMl}
                    <span className={styles.unit}>ml</span>
                  </b>{" "}
                  ・ 尿{" "}
                  <b className={`${styles.num} ${styles.numUrine}`}>
                    {d.urineMl}
                    <span className={styles.unit}>ml</span>
                  </b>
                </span>
                {d.stoolCount > 0 && (
                  <span className={styles.flagPart}>
                    💩
                    <b className={styles.flagNum}>
                      {d.stoolCount}
                      <span className={styles.unit}>回</span>
                    </b>
                  </span>
                )}
                {d.mealCount > 0 && (
                  <span className={styles.flagPart}>
                    🍴
                    <b className={styles.flagNum}>
                      {d.mealCount}
                      <span className={styles.unit}>回</span>
                    </b>
                  </span>
                )}
              </>
            ) : (
              <span className={styles.empty}>記録なし</span>
            )}
          </div>
          {d.medsMissed && <span className={styles.alert}>⚠️</span>}
        </div>
      ))}
    </div>
  );
}
