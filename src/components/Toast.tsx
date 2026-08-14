"use client";

import { useUiStore } from "@/stores/useUiStore";

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      data-testid="toast"
      style={{
        position: "fixed",
        bottom: 100,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#155a8f",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        borderRadius: 999,
        padding: "10px 20px",
        zIndex: 50,
        animation: "toastin .25s ease",
        whiteSpace: "nowrap",
      }}
    >
      {toast}
    </div>
  );
}
