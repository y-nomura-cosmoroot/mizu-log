"use client";

import { hourOf, targetMinute } from "@/lib/time";
import { bpLevelOf, buildEffectOf, feverOf, pulseEffectOf } from "@/lib/vitalEffects";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { VitalRecord } from "@/types/records";
import BodyFigure from "./BodyFigure";
import styles from "./VitalsCard.module.css";

const TEMP_OPTIONS: string[] = [];
for (let t = 340; t <= 410; t++) TEMP_OPTIONS.push((t / 10).toFixed(1));

const FEVER_LABEL = {
  low: "低体温",
  normal: "平熱",
  mild: "微熱",
  high: "高熱",
} as const;

function BpIcon() {
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

function WeightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" stroke="#155a8f" strokeWidth="2" />
      <path d="M8 11.5a4 4 0 0 1 8 0" stroke="#155a8f" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 11.5l2.4-2.2" stroke="#155a8f" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function VitalsCard() {
  const vitals = useAppStore((s) => s.vitals);
  const addVital = useAppStore((s) => s.addVital);
  const viewDate = useUiStore((s) => s.viewDate);
  const selHour = useUiStore((s) => s.selHour);
  const vitalInput = useUiStore((s) => s.vitalInput);
  const setVitalField = useUiStore((s) => s.setVitalField);
  const clearVitalInput = useUiStore((s) => s.clearVitalInput);
  const showToast = useUiStore((s) => s.showToast);

  const dayVitals = [...vitals]
    .filter((v) => v.recordDate === viewDate)
    .sort((a, b) => (a.recordedAt < b.recordedAt ? -1 : 1));
  const lastWith = (key: keyof VitalRecord): VitalRecord | null => {
    for (let i = dayVitals.length - 1; i >= 0; i--) {
      if (dayVitals[i][key]) return dayVitals[i];
    }
    return null;
  };
  const lastT = lastWith("temp");
  const lastBP = lastWith("bpSys");
  const lastP = lastWith("pulse");
  const lastW = lastWith("weight");

  // エフェクト（シルエットの色・体型・チップ）は「入力中の値」を優先し、無ければ
  // 「その日の最新記録の値」で判定する。記録して入力欄がクリアされても、
  // 未入力でも、その日の記録がある限りエフェクトを出し続ける（ユーザ指示）
  const fever = feverOf(vitalInput.temp || lastT?.temp || "");
  const build = buildEffectOf(vitalInput.weight || lastW?.weight || "");
  const pulse = pulseEffectOf(vitalInput.pulse || lastP?.pulse || "");
  const bp = bpLevelOf(vitalInput.bpSys || lastBP?.bpSys || "");

  const save = () => {
    const v = vitalInput;
    if (!v.temp && !v.bpSys && !v.bpDia && !v.pulse && !v.weight) {
      showToast("どれか1つ入れてね");
      return;
    }
    const now = new Date();
    addVital(v, viewDate, selHour, targetMinute(viewDate, selHour, now));
    clearVitalInput();
    showToast("バイタルをきろくしました");
  };

  return (
    <div className={`panel ${styles.root}`}>
      <div className={styles.headRow}>
        <span className={styles.title}>バイタル</span>
      </div>
      <div className={styles.grid}>
        {/* 体温 */}
        <div className={styles.field}>
          <div className={styles.connR} />
          <span className={styles.fieldLabel}>🌡 体温</span>
          <div className={styles.inputRow}>
            <select
              data-testid="vital-temp-select"
              value={vitalInput.temp}
              onChange={(e) => setVitalField("temp", e.target.value)}
              className={`input ${styles.tempSelect}`}
            >
              <option value="">-</option>
              {TEMP_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <span className={styles.unit}>℃</span>
          </div>
          {fever !== "none" && (
            <span
              data-testid="temp-status-chip"
              data-fever={fever}
              className={styles.tempChip}
            >
              {FEVER_LABEL[fever]}
            </span>
          )}
          {lastT && (
            <span className={styles.lastNote}>
              <b className={styles.lastVal}>{hourOf(lastT.recordedAt)}</b>時の記録
              <br />
              <b className={styles.lastVal}>{lastT.temp}℃</b>
            </span>
          )}
        </div>

        {/* 人体SVG（中央、2行分） */}
        <div className={styles.figureWrap}>
          <BodyFigure level={fever} build={build} pulse={pulse} bp={bp} />
        </div>

        {/* 血圧 */}
        <div className={styles.field}>
          <div className={styles.connL} />
          <span className={`${styles.fieldLabel} ${styles.fieldLabelRow}`}>
            <BpIcon /> 血圧
          </span>
          <input
            data-testid="vital-bp-sys"
            type="number"
            min={0}
            value={vitalInput.bpSys}
            onChange={(e) => setVitalField("bpSys", e.target.value)}
            inputMode="numeric"
            placeholder="上 120"
            className={`input ${styles.bpInput}`}
          />
          <input
            data-testid="vital-bp-dia"
            type="number"
            min={0}
            value={vitalInput.bpDia}
            onChange={(e) => setVitalField("bpDia", e.target.value)}
            inputMode="numeric"
            placeholder="下 80"
            className={`input ${styles.bpInput}`}
          />
          {lastBP && (
            <span className={styles.lastNote}>
              <b className={styles.lastVal}>{hourOf(lastBP.recordedAt)}</b>時の記録
              <br />
              <b className={styles.lastVal}>
                {lastBP.bpSys}/{lastBP.bpDia || "—"}
              </b>
            </span>
          )}
        </div>

        {/* 脈拍 */}
        <div className={styles.field}>
          <div className={styles.connR} />
          <span className={styles.fieldLabel}>💓 脈拍</span>
          <div className={styles.inputRow}>
            <input
              data-testid="vital-pulse"
              type="number"
              min={0}
              value={vitalInput.pulse}
              onChange={(e) => setVitalField("pulse", e.target.value)}
              inputMode="numeric"
              placeholder="70"
              className={`input ${styles.pulseInput}`}
            />
            <span className={styles.unitSm}>回/分</span>
          </div>
          {lastP && (
            <span className={styles.lastNote}>
              <b className={styles.lastVal}>{hourOf(lastP.recordedAt)}</b>時の記録
              <br />
              <b className={styles.lastVal}>{lastP.pulse}回/分</b>
            </span>
          )}
        </div>

        {/* 体重 */}
        <div className={styles.field}>
          <div className={styles.connL} />
          <span className={`${styles.fieldLabel} ${styles.fieldLabelRow}`}>
            <WeightIcon /> 体重
          </span>
          <div className={styles.inputRow}>
            <input
              data-testid="vital-weight"
              type="number"
              min={0}
              step={0.5}
              value={vitalInput.weight}
              onChange={(e) => setVitalField("weight", e.target.value)}
              inputMode="decimal"
              placeholder="55.0"
              className={`input ${styles.weightInput}`}
            />
            <span className={styles.unit}>kg</span>
          </div>
          {lastW && (
            <span className={styles.lastNote}>
              <b className={styles.lastVal}>{hourOf(lastW.recordedAt)}</b>時の記録
              <br />
              <b className={styles.lastVal}>{lastW.weight}kg</b>
            </span>
          )}
        </div>
      </div>
      <div className={styles.saveRow}>
        <button data-testid="vital-save" onClick={save} className={styles.saveBtn}>
          記録
        </button>
      </div>
    </div>
  );
}
