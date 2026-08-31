"use client";

import type { Medicine } from "@/types/records";
import styles from "./MedDoseList.module.css";

/** タイミングに紐づく薬の表示（用量の数値だけ強調、その他は呼び出し元のスタイルを継承） */
export default function MedDoseList({
  medicines,
  timing,
  size = "md",
  layout = "inline",
}: {
  medicines: Medicine[];
  timing: string;
  /** 用量数値のサイズ。md=18px（履歴）/ sm=15px（チェック行） */
  size?: "md" | "sm";
  /** inline=" ・ "区切りで1行にまとめる（履歴） / stacked=薬ごとに改行する（チェック行） */
  layout?: "inline" | "stacked";
}) {
  const list = medicines.filter((m) => m.timings.includes(timing));
  if (!list.length) return <>（くすりの登録なし）</>;
  const numClass = `${styles.num} ${size === "sm" ? styles.numSm : ""}`;
  const Item = layout === "stacked" ? "div" : "span";
  return (
    <>
      {list.map((m, i) => (
        <Item key={m.id}>
          {layout === "inline" && i > 0 && " ・ "}
          {m.name}
          {m.doseAmount && (
            <>
              {" "}
              <b className={numClass}>{m.doseAmount}</b>
              {m.doseUnit}
            </>
          )}
        </Item>
      ))}
    </>
  );
}
