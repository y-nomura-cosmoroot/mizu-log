"use client";

import { ALL_WEEKDAYS, WEEKDAY_ORDER } from "@/lib/constants";
import { WEEKDAY_LABELS, getRecordDate, weekdayIndexOf } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { Timing } from "@/types/records";
import MedDoseList from "./MedDoseList";
import medsStyles from "./meds.module.css";
import styles from "./TimingCheckRow.module.css";

/**
 * タイミング1件のチェック行。
 * マスタと同じ月〜日チップを表示専用で並べ（表示中の日はリングで示す）、曜日を絞っている
 * タイミングにはその上に「きょうは 金よう日だからのまない日」の一文を出す
 * （毎日のタイミングはチップだけ。曜日で変わらないので一文は出さない）。
 * inactive（その日の曜日に飲まない）なら薄色にして記録はさせない。
 * ただし既にチェック済みなら ✓ を表示して解除だけできる（誤チェックを直せるようにする）
 */
export default function TimingCheckRow({
  timing,
  inactive = false,
}: {
  timing: Timing;
  inactive?: boolean;
}) {
  const medicines = useAppStore((s) => s.medicines);
  const medChecks = useAppStore((s) => s.medChecks);
  const toggleMedCheck = useAppStore((s) => s.toggleMedCheck);
  const viewDate = useUiStore((s) => s.viewDate);
  const selHour = useUiStore((s) => s.selHour);
  const movedTiming = useUiStore((s) => s.movedTiming);

  const name = timing.name;
  const checked = (medChecks[viewDate] ?? {})[name] != null;
  const toggle = () => toggleMedCheck(viewDate, name, selHour);
  const canToggle = !inactive || checked;
  // 毎日飲むタイミングはチップを出さない（全部ONで情報が無く、行が長くなるだけのため）
  const everyday = timing.weekdays.length >= ALL_WEEKDAYS.length;
  const viewWeekday = weekdayIndexOf(viewDate);
  const isToday = viewDate === getRecordDate(new Date());

  return (
    <div
      data-testid={`timing-row-${name}`}
      data-inactive={inactive}
      className={`${styles.row} ${checked ? styles.isChecked : ""} ${
        name === movedTiming ? medsStyles.isMoved : ""
      }`}
    >
      <div className={styles.rowMain}>
        {canToggle ? (
          <button
            data-testid={`timing-check-${name}`}
            onClick={toggle}
            className={styles.checkBtn}
          >
            {checked ? "✓" : ""}
          </button>
        ) : (
          <span className={`${styles.checkBtn} ${styles.checkPlaceholder}`} aria-hidden="true" />
        )}
        <div className={styles.body}>
          <div className={styles.title}>
            {name}{" "}
            <span className={styles.status}>
              {checked ? "チェックずみ" : inactive ? "" : "まだ"}
            </span>
          </div>
          <div className={styles.meds}>
            <MedDoseList medicines={medicines} timing={name} size="sm" layout="stacked" />
          </div>
        </div>
        {!checked && !inactive && (
          <button
            data-testid={`drank-btn-${name}`}
            onClick={toggle}
            className={styles.drankBtn}
          >
            のんだ！
          </button>
        )}
      </div>

      {!everyday && (
        <div
          data-testid={`timing-day-label-${name}`}
          data-on={!inactive}
          className={styles.dayLine}
        >
          {isToday ? "きょうは " : ""}
          <b className={styles.dayEmph}>{WEEKDAY_LABELS[viewWeekday]}よう日</b>
          だから
          <b className={styles.dayEmph}>{inactive ? "のまない日" : "のむ日"}</b>
        </div>
      )}

      <div className={styles.weekdayChips} role="group" aria-label={`${name}をのむ曜日`}>
        {WEEKDAY_ORDER.map((wd) => (
          <span
            key={wd}
            data-testid={`timing-row-weekday-${name}-${wd}`}
            data-on={timing.weekdays.includes(wd)}
            data-today={wd === viewWeekday}
            className={styles.weekdayChip}
          >
            {WEEKDAY_LABELS[wd]}
          </span>
        ))}
      </div>
    </div>
  );
}
