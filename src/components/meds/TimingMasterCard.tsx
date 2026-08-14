"use client";

import { inputBox } from "@/lib/styles";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";

const smallBtn: React.CSSProperties = {
  border: "none",
  background: "#eef6fc",
  color: "#1c6dab",
  borderRadius: 8,
  padding: "5px 10px",
  cursor: "pointer",
  fontSize: 12,
};

const delBtnSmall: React.CSSProperties = {
  border: "none",
  background: "#fdeaea",
  color: "#c25454",
  borderRadius: 8,
  padding: "5px 10px",
  cursor: "pointer",
  fontSize: 12,
};

export default function TimingMasterCard() {
  const timings = useAppStore((s) => s.timings);
  const addTiming = useAppStore((s) => s.addTiming);
  const removeTiming = useAppStore((s) => s.removeTiming);
  const moveTiming = useAppStore((s) => s.moveTiming);
  const newTiming = useUiStore((s) => s.newTiming);
  const setNewTiming = useUiStore((s) => s.setNewTiming);
  const movedTiming = useUiStore((s) => s.movedTiming);
  const markMovedTiming = useUiStore((s) => s.markMovedTiming);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= timings.length) return;
    markMovedTiming(timings[i]);
    moveTiming(i, d);
  };

  const add = () => {
    const v = newTiming.trim();
    if (!v || timings.includes(v)) return;
    addTiming(v);
    setNewTiming("");
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: "0 2px 10px rgba(43,113,166,.08)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#7a8b98" }}>のむタイミング</div>
      {timings.map((t, i) => (
        <div
          key={t}
          data-testid={`timing-master-row-${t}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#f7fbfe",
            borderRadius: 12,
            padding: "9px 12px",
            animation: t === movedTiming ? "rowpop .6s ease" : "none",
          }}
        >
          <span style={{ color: "#b9cdda" }}>≡</span>
          <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{t}</span>
          <button data-testid={`timing-up-${t}`} onClick={() => move(i, -1)} style={smallBtn}>
            ↑
          </button>
          <button data-testid={`timing-down-${t}`} onClick={() => move(i, 1)} style={smallBtn}>
            ↓
          </button>
          <button
            data-testid={`timing-del-${t}`}
            onClick={() => removeTiming(t)}
            style={delBtnSmall}
          >
            けす
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          data-testid="new-timing-input"
          value={newTiming}
          onChange={(e) => setNewTiming(e.target.value)}
          placeholder="例: ねる前"
          style={{ ...inputBox, flex: 1, padding: "9px 12px", fontSize: 14 }}
        />
        <button
          data-testid="add-timing"
          onClick={add}
          style={{
            border: "none",
            background: "#2b8fd6",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            borderRadius: 10,
            padding: "9px 16px",
            cursor: "pointer",
          }}
        >
          追加
        </button>
      </div>
    </div>
  );
}
