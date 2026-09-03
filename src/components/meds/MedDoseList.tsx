"use client";

import type { Medicine } from "@/types/records";
import styles from "./MedDoseList.module.css";

/**
 * タイミングに紐づく薬の表示。重要度で3段階に強弱を分ける:
 * 1. くすりの名前（一番強い）/ 2. 用量の数値 / 3. 単位（通常テキスト）
 */
export default function MedDoseList({
  medicines,
  timing,
  size = "md",
  layout = "inline",
}: {
  medicines: Medicine[];
  timing: string;
  /** md=履歴（名前17px / 数値15px）/ sm=チェック行（名前16px / 数値14px） */
  size?: "md" | "sm";
  /** inline=" ・ "区切りで1行にまとめる（履歴） / stacked=薬ごとに改行する（チェック行） */
  layout?: "inline" | "stacked";
}) {
  const list = medicines.filter((m) => m.timings.includes(timing));
  // 未登録のプレースホルダは薬名の強調を引き継がない（控えめに出す）
  if (!list.length) return <span className={styles.empty}>（くすりの登録なし）</span>;
  const sm = size === "sm";
  const nameClass = `${styles.name} ${sm ? styles.nameSm : styles.nameMd}`;
  const numClass = `${styles.num} ${sm ? styles.numSm : styles.numMd}`;
  const Item = layout === "stacked" ? "div" : "span";
  return (
    <>
      {list.map((m, i) => (
        <Item key={m.id}>
          {layout === "inline" && i > 0 && " ・ "}
          <b className={nameClass}>{m.name}</b>
          {m.doseAmount && (
            <>
              {" "}
              <b className={numClass}>{m.doseAmount}</b>
              <span className={styles.unit}>{m.doseUnit}</span>
            </>
          )}
        </Item>
      ))}
    </>
  );
}
