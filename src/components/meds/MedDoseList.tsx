"use client";

import type { Medicine } from "@/types/records";

/** タイミングに紐づく薬の表示（用量の数値だけ強調、その他は呼び出し元のスタイルを継承） */
export default function MedDoseList({
  medicines,
  timing,
  numberSize = 18,
}: {
  medicines: Medicine[];
  timing: string;
  numberSize?: number;
}) {
  const list = medicines.filter((m) => m.timings.includes(timing));
  if (!list.length) return <>（くすりの登録なし）</>;
  return (
    <>
      {list.map((m, i) => (
        <span key={m.id}>
          {i > 0 && " ・ "}
          {m.name}
          {m.doseAmount && (
            <>
              {" "}
              <b style={{ fontSize: numberSize, fontWeight: 900 }}>{m.doseAmount}</b>
              {m.doseUnit}
            </>
          )}
        </span>
      ))}
    </>
  );
}
