"use client";

import { useUiStore } from "@/stores/useUiStore";

/** ⚠️飲み忘れアラートバナー（未チェックのタイミングがあるとき、今日のみ表示） */
export default function MedsAlertBanner({ unchecked }: { unchecked: string[] }) {
  const setTab = useUiStore((s) => s.setTab);
  return (
    <div
      data-testid="med-alert-banner"
      onClick={() => setTab("meds")}
      style={{
        position: "relative",
        zIndex: 2,
        margin: "8px 16px 0",
        background: "#fdeaea",
        border: "2px solid #e58b83",
        borderRadius: 16,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(194,69,58,.18)",
      }}
    >
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#c2453a" }}>
          飲み忘れあり！
        </div>
        <div style={{ fontSize: 12, color: "#5d7488" }}>
          {unchecked.join("・")} がまだです
        </div>
      </div>
      <span style={{ fontSize: 14, color: "#c2453a", fontWeight: 900 }}>›</span>
    </div>
  );
}
