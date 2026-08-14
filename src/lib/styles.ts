import type { CSSProperties } from "react";

/** 選択中チップ（青塗り） */
export const chipOn: CSSProperties = {
  border: "none",
  background: "#2b8fd6",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  borderRadius: 999,
  padding: "8px 16px",
  cursor: "pointer",
};

/** 非選択チップ（薄青） */
export const chipOff: CSSProperties = {
  border: "none",
  background: "#eef6fc",
  color: "#1c6dab",
  fontWeight: 700,
  fontSize: 13,
  borderRadius: 999,
  padding: "8px 16px",
  cursor: "pointer",
};

/** 履歴の「飲水」種別チップ */
export const waterChip: CSSProperties = {
  background: "#dceefb",
  color: "#1c6dab",
  fontWeight: 900,
  fontSize: 11,
  borderRadius: 999,
  padding: "3px 10px",
};

/** 履歴の「尿量」種別チップ */
export const urineChip: CSSProperties = {
  background: "#fdf1dc",
  color: "#b0761a",
  fontWeight: 900,
  fontSize: 11,
  borderRadius: 999,
  padding: "3px 10px",
};

/** 「なおす」ボタン */
export const editBtn: CSSProperties = {
  border: "none",
  background: "#eef6fc",
  color: "#1c6dab",
  borderRadius: 10,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

/** 「けす」ボタン */
export const delBtn: CSSProperties = {
  border: "none",
  background: "#fdeaea",
  color: "#c25454",
  borderRadius: 10,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

/** 白カード */
export const card: CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 10px rgba(43,113,166,.08)",
  overflow: "hidden",
};

/** 入力欄の共通スタイル */
export const inputBox: CSSProperties = {
  border: "1.5px solid #d5e7f4",
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 15,
  background: "#fafdff",
  color: "#24323d",
};
