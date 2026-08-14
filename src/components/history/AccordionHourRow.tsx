"use client";

/** 履歴の時間ごとの折りたたみ行（▸クリックで展開） */
export default function AccordionHourRow({
  testId,
  hourLabel,
  headerContent,
  count,
  open,
  onToggle,
  children,
}: {
  testId: string;
  hourLabel: string;
  headerContent: React.ReactNode;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderTop: "1px solid #eef4f9" }}>
      <div
        data-testid={testId}
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 16px",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#2b8fd6",
            display: "inline-block",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform .2s ease",
          }}
        >
          ▸
        </span>
        <b style={{ width: 48, fontSize: 15 }}>{hourLabel}</b>
        {headerContent}
        <span style={{ fontSize: 11, color: "#9db0bd" }}>{count}件</span>
      </div>
      {open && children}
    </div>
  );
}
