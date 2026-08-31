"use client";

import { DOSE_UNITS } from "@/lib/constants";
import type { DoseUnit } from "@/types/records";
import { DRUG_NAME_DATALIST_ID } from "./DrugNameDatalist";
import styles from "./MedicineFieldRow.module.css";

interface MedicineFieldRowProps {
  /** data-testidの接頭辞。既存マスタ行は"med"、カメラ確認シートの下書き行は別の接頭辞にして
   *  同時にDOMへ存在してもtestidが衝突しないようにする */
  testIdPrefix: string;
  index: number;
  name: string;
  doseAmount: string;
  doseUnit: DoseUnit;
  onChangeName: (value: string) => void;
  onChangeDoseAmount: (value: string) => void;
  onChangeDoseUnit: (value: DoseUnit) => void;
  onDelete: () => void;
}

/** 「くすりの名前・量・単位・けす」の1行。おくすりマスタとカメラ確認シートで共用する */
export default function MedicineFieldRow({
  testIdPrefix,
  index,
  name,
  doseAmount,
  doseUnit,
  onChangeName,
  onChangeDoseAmount,
  onChangeDoseUnit,
  onDelete,
}: MedicineFieldRowProps) {
  return (
    <div className={styles.fieldRow}>
      <input
        data-testid={`${testIdPrefix}-name-${index}`}
        value={name}
        onChange={(e) => onChangeName(e.target.value)}
        placeholder="くすりの名前"
        list={DRUG_NAME_DATALIST_ID}
        className={`${styles.medInput} ${styles.nameInput}`}
      />
      <input
        data-testid={`${testIdPrefix}-dose-${index}`}
        type="number"
        min={0}
        value={doseAmount}
        onChange={(e) => onChangeDoseAmount(e.target.value)}
        inputMode="decimal"
        placeholder="量"
        className={`${styles.medInput} ${styles.doseInput}`}
      />
      <select
        data-testid={`${testIdPrefix}-unit-${index}`}
        value={doseUnit}
        onChange={(e) => onChangeDoseUnit(e.target.value as DoseUnit)}
        className={`${styles.medInput} ${styles.unitSelect}`}
      >
        {DOSE_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
      <button
        data-testid={`${testIdPrefix}-del-${index}`}
        onClick={onDelete}
        className={`btn-del ${styles.delBtn}`}
      >
        けす
      </button>
    </div>
  );
}
