"use client";

import { BAND_DEFS } from "@/lib/constants";

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
    <div
      style={{
        position: "relative",
        margin: "0 16px 4px",
        background: "rgba(255,255,255,.92)",
        borderRadius: 18,
        padding: "10px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11.5,
          textAlign: "center",
        }}
      >
        {BAND_DEFS.map(({ band, label }) => (
          <span key={band} style={{ color: "#46698a" }}>
            {label}
            <br />
            <b
              data-testid={`subtotal-w${band}`}
              style={{ fontSize: 13, color: "#155a8f" }}
            >
              {fmtN(waterBands[band - 1])}
            </b>{" "}
            /{" "}
            <b data-testid={`subtotal-u${band}`} style={{ color: "#b0761a" }}>
              {fmtN(urineBands[band - 1])}
            </b>
          </span>
        ))}
        <span style={{ color: "#46698a" }}>
          合計
          <br />
          <b data-testid="subtotal-wt" style={{ fontSize: 13, color: "#155a8f" }}>
            {fmtN(waterTotal)}
          </b>{" "}
          /{" "}
          <b data-testid="subtotal-ut" style={{ color: "#b0761a" }}>
            {fmtN(urineTotal)}
          </b>
        </span>
      </div>
    </div>
  );
}
