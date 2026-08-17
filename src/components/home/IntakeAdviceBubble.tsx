"use client";

import { useMemo } from "react";
import { pickAdviceMessage, type IntakeAdviceState } from "@/lib/intakeAdvice";
import styles from "./IntakeAdviceBubble.module.css";

/** 飲水ペースの吹き出し。マウントごと（=タブ切り替えのたび）に1件ランダム選出する */
export default function IntakeAdviceBubble({ state }: { state: IntakeAdviceState }) {
  const message = useMemo(() => pickAdviceMessage(state), [state]);
  return (
    <div data-testid="intake-advice-bubble" data-state={state} className={styles.bubble}>
      {message}
    </div>
  );
}
