"use client";

import { useUiStore, type Tab } from "@/stores/useUiStore";
import styles from "./BottomNav.module.css";

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
    <div className={styles.nav}>
      {NAV_ITEMS.map((n) => (
        <button
          key={n.key}
          data-testid={`nav-${n.key}`}
          onClick={() => setTab(n.key)}
          className={`${styles.item} ${tab === n.key ? styles.isActive : ""}`}
        >
          <span className={styles.icon}>{n.icon}</span>
          <span className={styles.label}>{n.label}</span>
        </button>
      ))}
    </div>
  );
}
