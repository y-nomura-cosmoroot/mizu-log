"use client";

import { useUiStore } from "@/stores/useUiStore";
import styles from "./Toast.module.css";

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div data-testid="toast" className={styles.toast}>
      {toast}
    </div>
  );
}
