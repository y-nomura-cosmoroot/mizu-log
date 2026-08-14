"use client";

import { chipOff, chipOn } from "@/lib/styles";
import { formatDateLabel } from "@/lib/time";
import { useUiStore, type HistSub } from "@/stores/useUiStore";
import CalendarPopup from "./CalendarPopup";

const navBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  border: "none",
  borderRadius: "50%",
  background: "#fff",
  color: "#2b8fd6",
  fontSize: 16,
  fontWeight: 700,
  boxShadow: "0 1px 4px rgba(43,113,166,.15)",
  cursor: "pointer",
};

const SUB_TABS: ReadonlyArray<{ key: HistSub; label: string }> = [
  { key: "water", label: "飲水量/尿量" },
  { key: "vital", label: "バイタル" },
  { key: "meds", label: "おくすり" },
];

export default function Header() {
  const tab = useUiStore((s) => s.tab);
  const histSub = useUiStore((s) => s.histSub);
  const setHistSub = useUiStore((s) => s.setHistSub);
  const viewDate = useUiStore((s) => s.viewDate);
  const goPrevDay = useUiStore((s) => s.goPrevDay);
  const goNextDay = useUiStore((s) => s.goNextDay);
  const calOpen = useUiStore((s) => s.calOpen);
  const setCalOpen = useUiStore((s) => s.setCalOpen);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 25,
        background: "#f5fbff",
        boxShadow: "0 2px 10px rgba(43,113,166,.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px 4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 16,
              height: 16,
              background: "linear-gradient(160deg,#6cc0ef,#2b8fd6)",
              borderRadius: "50% 50% 50% 0",
              transform: "rotate(-45deg)",
            }}
          />
          <span
            style={{
              fontWeight: 900,
              fontSize: 17,
              color: "#1c6dab",
              letterSpacing: ".02em",
            }}
          >
            みずログ
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: "6px 18px 10px",
        }}
      >
        <button data-testid="prev-day" onClick={goPrevDay} style={navBtn}>
          ‹
        </button>
        <div style={{ position: "relative", textAlign: "center", minWidth: 150, zIndex: 20 }}>
          <div
            data-testid="date-label"
            onClick={() => setCalOpen(!calOpen)}
            style={{ fontSize: 18, fontWeight: 700, cursor: "pointer" }}
          >
            {formatDateLabel(viewDate)}{" "}
            <span style={{ fontSize: 11, color: "#2b8fd6" }}>▾</span>
          </div>
          {calOpen && <CalendarPopup />}
        </div>
        <button data-testid="next-day" onClick={() => goNextDay(new Date())} style={navBtn}>
          ›
        </button>
      </div>

      {tab === "history" && (
        <div style={{ display: "flex", gap: 6, padding: "0 16px 10px" }}>
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`hist-sub-${t.key}`}
              onClick={() => setHistSub(t.key)}
              style={histSub === t.key ? chipOn : chipOff}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
