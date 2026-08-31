"use client";

import { DRUG_REFERENCE_ENTRIES } from "@/lib/drugReferenceList";

export const DRUG_NAME_DATALIST_ID = "drug-name-options";

const DRUG_NAMES = [...new Set(DRUG_REFERENCE_ENTRIES.map((e) => e.name))];

/**
 * 「くすりの名前」欄(MedicineFieldRow)から共通で参照するdatalist。
 * AppShellに1つだけ常設マウントし、各inputはlist属性でこのidを参照する
 * (HTMLのdatalistはid参照なのでDOM上の位置は問わない)
 */
export default function DrugNameDatalist() {
  return (
    <datalist id={DRUG_NAME_DATALIST_ID}>
      {DRUG_NAMES.map((name) => (
        <option key={name} value={name} />
      ))}
    </datalist>
  );
}
