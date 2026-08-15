"use client";

import { BAND_DEFS } from "@/lib/constants";
import styles from "./SubtotalBar.module.css";

function fmtN(n: number): string {
  return n ? String(n) : "—";
}

/** 帯小計×3+合計のバー（飲水/尿量を並記） */
export default function SubtotalBar({
  waterBands,
  urineBands,
  waterTotal,
  urineTotal,
}: {
  waterBands: [number, number, number];
  urineBands: [number, number, number];
  waterTotal: number;
  urineTotal: number;
}) {
  return (
    <div className={styles.bar}>
      <div className={styles.row}>
        {BAND_DEFS.map(({ band, label }) => (
          <span key={band} className={styles.cell}>
            {label}
            <br />
            <b data-testid={`subtotal-w${band}`} className={styles.w}>
              {fmtN(waterBands[band - 1])}
            </b>{" "}
            /{" "}
            <b data-testid={`subtotal-u${band}`} className={styles.u}>
              {fmtN(urineBands[band - 1])}
            </b>
          </span>
        ))}
        <span className={styles.cell}>
          合計
          <br />
          <b data-testid="subtotal-wt" className={styles.w}>
            {fmtN(waterTotal)}
          </b>{" "}
          /{" "}
          <b data-testid="subtotal-ut" className={styles.u}>
            {fmtN(urineTotal)}
          </b>
        </span>
      </div>
    </div>
  );
}
