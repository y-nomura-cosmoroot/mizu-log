"use client";

import { useUiStore, type Tab } from "@/stores/useUiStore";

const NAV_ITEMS: ReadonlyArray<{ key: Tab; label: string; icon: string }> = [
  { key: "home", label: "飲水量/尿量", icon: "💧" },
  { key: "input", label: "バイタル", icon: "🩺" },
  { key: "meds", label: "おくすり", icon: "💊" },
  { key: "history", label: "りれき", icon: "📋" },
];

export default function BottomNav() {
  const tab = useUiStore((s) => s.tab);
  const setTab = useUiStore((s) => s.setTab);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        background: "#fff",
        borderTop: "1px solid #e3eef6",
        display: "flex",
        zIndex: 30,
        padding: "6px 4px calc(10px + env(safe-area-inset-bottom))",
      }}
    >
      {NAV_ITEMS.map((n) => (
        <button
          key={n.key}
          data-testid={`nav-${n.key}`}
          onClick={() => setTab(n.key)}
          style={{
            flex: 1,
            border: "none",
            background: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: "8px 0 4px",
            color: tab === n.key ? "#2b8fd6" : "#9db0bd",
            borderRadius: 14,
          }}
        >
          <span
            style={{
              fontSize: 20,
              lineHeight: 1,
              filter: tab === n.key ? "none" : "grayscale(1)",
              opacity: tab === n.key ? 1 : 0.55,
            }}
          >
            {n.icon}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 700 }}>{n.label}</span>
        </button>
      ))}
    </div>
  );
}
