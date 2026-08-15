"use client";

import { DOSE_UNITS } from "@/lib/constants";
import { sortMedicines } from "@/lib/meds";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { DoseUnit } from "@/types/records";
import medsStyles from "./meds.module.css";
import styles from "./MedicineMasterCard.module.css";

export default function MedicineMasterCard() {
  const medicines = useAppStore((s) => s.medicines);
  const timings = useAppStore((s) => s.timings);
  const addMedicine = useAppStore((s) => s.addMedicine);
  const updateMedicine = useAppStore((s) => s.updateMedicine);
  const deleteMedicine = useAppStore((s) => s.deleteMedicine);
  const toggleMedicineTiming = useAppStore((s) => s.toggleMedicineTiming);
  const movedMedId = useUiStore((s) => s.movedMedId);
  const markMovedMed = useUiStore((s) => s.markMovedMed);

  const sorted = sortMedicines(medicines, timings);

  return (
    <div className={`panel ${styles.root}`}>
      <div className={medsStyles.sectionLabel}>おくすり</div>
      {sorted.map((m, i) => (
        <div
          key={m.id}
          data-testid={`med-card-${i}`}
          className={`${styles.medCard} ${m.id === movedMedId ? medsStyles.isMoved : ""}`}
        >
          <div className={styles.fieldRow}>
            <input
              data-testid={`med-name-${i}`}
              value={m.name}
              onChange={(e) => updateMedicine(m.id, { name: e.target.value })}
              placeholder="くすりの名前"
              className={`${styles.medInput} ${styles.nameInput}`}
            />
            <input
              data-testid={`med-dose-${i}`}
              type="number"
              min={0}
              value={m.doseAmount}
              onChange={(e) => updateMedicine(m.id, { doseAmount: e.target.value })}
              inputMode="decimal"
              placeholder="量"
              className={`${styles.medInput} ${styles.doseInput}`}
            />
            <select
              data-testid={`med-unit-${i}`}
              value={m.doseUnit}
              onChange={(e) =>
                updateMedicine(m.id, { doseUnit: e.target.value as DoseUnit })
              }
              className={`${styles.medInput} ${styles.unitSelect}`}
            >
              {DOSE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button
              data-testid={`med-del-${i}`}
              onClick={() => deleteMedicine(m.id)}
              className={`btn-del ${styles.delBtn}`}
            >
              けす
            </button>
          </div>
          <div className={styles.tagRow}>
            {timings.map((t) => {
              const on = m.timings.includes(t);
              return (
                <button
                  key={t}
                  data-testid={`med-tag-${i}-${t}`}
                  onClick={() => {
                    markMovedMed(m.id);
                    toggleMedicineTiming(m.id, t);
                  }}
                  className={`${styles.tag} ${on ? styles.tagOn : styles.tagOff}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button
        data-testid="add-medicine"
        onClick={addMedicine}
        className={styles.addMedBtn}
      >
        ＋ おくすりを追加
      </button>
    </div>
  );
}
