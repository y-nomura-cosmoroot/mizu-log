"use client";

import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import styles from "./EditSheet.module.css";
import sheetStyles from "./sheets.module.css";

const TEMP_OPTIONS: string[] = [];
for (let t = 340; t <= 410; t++) TEMP_OPTIONS.push((t / 10).toFixed(1));

/** 履歴の「なおす」用ボトムシート（飲水/尿量=mlステッパー、バイタル=全項目フォーム） */
export default function EditSheet() {
  const sheet = useUiStore((s) => s.sheet);
  const patchSheet = useUiStore((s) => s.patchSheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const showToast = useUiStore((s) => s.showToast);
  const updateIntakeMl = useAppStore((s) => s.updateIntakeMl);
  const updateVital = useAppStore((s) => s.updateVital);

  if (!sheet) return null;

  const save = () => {
    if (sheet.type === "ml") {
      updateIntakeMl(sheet.id, sheet.ml);
    } else {
      updateVital(sheet.id, {
        temp: sheet.temp,
        bpSys: sheet.bpSys,
        bpDia: sheet.bpDia,
        pulse: sheet.pulse,
        weight: sheet.weight,
      });
    }
    closeSheet();
    showToast("なおしました");
  };

  const title =
    sheet.type === "vital"
      ? "バイタルの記録をなおす"
      : `${sheet.kind === "water" ? "飲水" : "尿量"}の記録をなおす`;

  return (
    <>
      <div
        data-testid="sheet-overlay"
        onClick={closeSheet}
        className={`overlay ${sheetStyles.overlay}`}
      />
      <div data-testid="edit-sheet" className={sheetStyles.sheet}>
        <div className={sheetStyles.title}>{title}</div>

        {sheet.type === "ml" && (
          <div className={styles.mlRow}>
            <button
              data-testid="sheet-dec"
              onClick={() => patchSheet({ ml: Math.max(10, sheet.ml - 10) })}
              className={styles.stepBtn}
            >
              −
            </button>
            <span data-testid="sheet-ml" className={styles.mlValue}>
              {sheet.ml} <span className={styles.mlUnit}>ml</span>
            </span>
            <button
              data-testid="sheet-inc"
              onClick={() => patchSheet({ ml: sheet.ml + 10 })}
              className={styles.stepBtn}
            >
              ＋
            </button>
          </div>
        )}

        {sheet.type === "vital" && (
          <div className={styles.vitalForm}>
            <div className={styles.vitalRow}>
              <span className={styles.rowLabel}>🌡 体温</span>
              <select
                data-testid="sheet-temp"
                value={sheet.temp}
                onChange={(e) => patchSheet({ temp: e.target.value })}
                className={`input ${styles.fieldInput}`}
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
            <div className={styles.vitalRow}>
              <span className={styles.rowLabel}>血圧</span>
              <input
                data-testid="sheet-bp-sys"
                type="number"
                min={0}
                value={sheet.bpSys}
                onChange={(e) => patchSheet({ bpSys: e.target.value })}
                inputMode="numeric"
                placeholder="上 120"
                className={`input ${styles.fieldInput} ${styles.bpInput}`}
              />
              <span className={styles.bpSlash}>/</span>
              <input
                data-testid="sheet-bp-dia"
                type="number"
                min={0}
                value={sheet.bpDia}
                onChange={(e) => patchSheet({ bpDia: e.target.value })}
                inputMode="numeric"
                placeholder="下 80"
                className={`input ${styles.fieldInput} ${styles.bpInput}`}
              />
            </div>
            <div className={styles.vitalRow}>
              <span className={styles.rowLabel}>💓 脈拍</span>
              <input
                data-testid="sheet-pulse"
                type="number"
                min={0}
                value={sheet.pulse}
                onChange={(e) => patchSheet({ pulse: e.target.value })}
                inputMode="numeric"
                placeholder="70"
                className={`input ${styles.fieldInput}`}
              />
              <span className={styles.unit}>回/分</span>
            </div>
            <div className={styles.vitalRow}>
              <span className={styles.rowLabel}>体重</span>
              <input
                data-testid="sheet-weight"
                type="number"
                min={0}
                step={0.5}
                value={sheet.weight}
                onChange={(e) => patchSheet({ weight: e.target.value })}
                inputMode="decimal"
                placeholder="55.0"
                className={`input ${styles.fieldInput} ${styles.weightInput}`}
              />
              <span className={styles.unit}>kg</span>
            </div>
          </div>
        )}

        <div className={sheetStyles.footRow}>
          <button data-testid="sheet-cancel" onClick={closeSheet} className={sheetStyles.cancelBtn}>
            やめる
          </button>
          <button data-testid="sheet-save" onClick={save} className={sheetStyles.saveBtn}>
            これでOK
          </button>
        </div>
      </div>
    </>
  );
}
