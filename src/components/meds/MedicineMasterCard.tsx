"use client";

import { sortMedicines } from "@/lib/meds";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import MedicineFieldRow from "./MedicineFieldRow";
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
  const openCameraSheet = useUiStore((s) => s.openCameraSheet);

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
          <MedicineFieldRow
            testIdPrefix="med"
            index={i}
            name={m.name}
            doseAmount={m.doseAmount}
            doseUnit={m.doseUnit}
            onChangeName={(v) => updateMedicine(m.id, { name: v })}
            onChangeDoseAmount={(v) => updateMedicine(m.id, { doseAmount: v })}
            onChangeDoseUnit={(v) => updateMedicine(m.id, { doseUnit: v })}
            onDelete={() => deleteMedicine(m.id)}
          />
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
      <button
        data-testid="add-medicine-camera"
        onClick={openCameraSheet}
        className={styles.cameraAddBtn}
      >
        📷 カメラからおくすりを追加
      </button>
    </div>
  );
}
