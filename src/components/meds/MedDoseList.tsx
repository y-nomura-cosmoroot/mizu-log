"use client";

import type { Medicine } from "@/types/records";
import styles from "./MedDoseList.module.css";

/** タイミングに紐づく薬の表示（用量の数値だけ強調、その他は呼び出し元のスタイルを継承） */
export default function MedDoseList({
  medicines,
  timing,
  size = "md",
}: {
  medicines: Medicine[];
  timing: string;
  /** 用量数値のサイズ。md=18px（履歴）/ sm=15px（チェック行） */
  size?: "md" | "sm";
}) {
  const list = medicines.filter((m) => m.timings.includes(timing));
  if (!list.length) return <>（くすりの登録なし）</>;
  const numClass = `${styles.num} ${size === "sm" ? styles.numSm : ""}`;
  return (
    <>
      {list.map((m, i) => (
        <span key={m.id}>
          {i > 0 && " ・ "}
          {m.name}
          {m.doseAmount && (
            <>
              {" "}
              <b className={numClass}>{m.doseAmount}</b>
              {m.doseUnit}
            </>
          )}
        </span>
      ))}
    </>
  );
}
