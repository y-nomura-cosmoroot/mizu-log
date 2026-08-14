"use client";

import { inputBox } from "@/lib/styles";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";

const TEMP_OPTIONS: string[] = [];
for (let t = 340; t <= 410; t++) TEMP_OPTIONS.push((t / 10).toFixed(1));

const stepBtn: React.CSSProperties = {
  width: 48,
  height: 48,
  border: "none",
  background: "#eef6fc",
  color: "#1c6dab",
  fontSize: 20,
  fontWeight: 700,
  borderRadius: 14,
  cursor: "pointer",
};

const rowLabel: React.CSSProperties = {
  width: 56,
  fontSize: 12,
  fontWeight: 900,
  color: "#1c6dab",
};

/** 履歴の「なおす」用ボトムシート（飲水/尿量=mlステッパー、バイタル=全項目フォーム） */
export default function EditSheet() {
  const sheet = useUiStore((s) => s.sheet);
  const patchSheet = useUiStore((s) => s.patchSheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const showToast = useUiStore((s) => s.showToast);
  const updateIntakeMl = useAppStore((s) => s.updateIntakeMl);
  const updateVital = useAppStore((s) => s.updateVital);

  if (!sheet) return null;

  const save = () => {
    if (sheet.type === "ml") {
      updateIntakeMl(sheet.id, sheet.ml);
    } else {
      updateVital(sheet.id, {
        temp: sheet.temp,
        bpSys: sheet.bpSys,
        bpDia: sheet.bpDia,
        pulse: sheet.pulse,
        weight: sheet.weight,
      });
    }
    closeSheet();
    showToast("なおしました");
  };

  const title =
    sheet.type === "vital"
      ? "バイタルの記録をなおす"
      : `${sheet.kind === "water" ? "飲水" : "尿量"}の記録をなおす`;

  return (
    <>
      <div
        data-testid="sheet-overlay"
        onClick={closeSheet}
        style={{ position: "fixed", inset: 0, background: "rgba(20,50,70,.35)", zIndex: 40 }}
      />
      <div
        data-testid="edit-sheet"
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px 26px",
          zIndex: 41,
          boxShadow: "0 -6px 30px rgba(20,50,70,.2)",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 900, paddingBottom: 12 }}>{title}</div>

        {sheet.type === "ml" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              data-testid="sheet-dec"
              onClick={() => patchSheet({ ml: Math.max(10, sheet.ml - 10) })}
              style={stepBtn}
            >
              −
            </button>
            <span
              data-testid="sheet-ml"
              style={{ flex: 1, textAlign: "center", fontSize: 30, fontWeight: 900 }}
            >
              {sheet.ml}{" "}
              <span style={{ fontSize: 14, fontWeight: 500, color: "#7a8b98" }}>ml</span>
            </span>
            <button
              data-testid="sheet-inc"
              onClick={() => patchSheet({ ml: sheet.ml + 10 })}
              style={stepBtn}
            >
              ＋
            </button>
          </div>
        )}

        {sheet.type === "vital" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={rowLabel}>🌡 体温</span>
              <select
                data-testid="sheet-temp"
                value={sheet.temp}
                onChange={(e) => patchSheet({ temp: e.target.value })}
                style={{ ...inputBox, flex: 1, padding: "9px 10px" }}
              >
                <option value="">-</option>
                {TEMP_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: "#7a8b98" }}>℃</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={rowLabel}>血圧</span>
              <input
                data-testid="sheet-bp-sys"
                type="number"
                min={0}
                value={sheet.bpSys}
                onChange={(e) => patchSheet({ bpSys: e.target.value })}
                inputMode="numeric"
                placeholder="上 120"
                style={{ ...inputBox, flex: 1, minWidth: 0, padding: "9px 10px" }}
              />
              <span style={{ color: "#7a8b98" }}>/</span>
              <input
                data-testid="sheet-bp-dia"
                type="number"
                min={0}
                value={sheet.bpDia}
                onChange={(e) => patchSheet({ bpDia: e.target.value })}
                inputMode="numeric"
                placeholder="下 80"
                style={{ ...inputBox, flex: 1, minWidth: 0, padding: "9px 10px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={rowLabel}>💓 脈拍</span>
              <input
                data-testid="sheet-pulse"
                type="number"
                min={0}
                value={sheet.pulse}
                onChange={(e) => patchSheet({ pulse: e.target.value })}
                inputMode="numeric"
                placeholder="70"
                style={{ ...inputBox, flex: 1, padding: "9px 10px" }}
              />
              <span style={{ fontSize: 12, color: "#7a8b98" }}>回/分</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={rowLabel}>体重</span>
              <input
                data-testid="sheet-weight"
                type="number"
                min={0}
                step={0.5}
                value={sheet.weight}
                onChange={(e) => patchSheet({ weight: e.target.value })}
                inputMode="decimal"
                placeholder="55.0"
                style={{ ...inputBox, flex: 1, padding: "9px 10px", textAlign: "right" }}
              />
              <span style={{ fontSize: 12, color: "#7a8b98" }}>kg</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, paddingTop: 16 }}>
          <button
            data-testid="sheet-cancel"
            onClick={closeSheet}
            style={{
              flex: 1,
              border: "none",
              background: "#eef2f5",
              color: "#5c6f7d",
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 14,
              padding: "13px 0",
              cursor: "pointer",
            }}
          >
            やめる
          </button>
          <button
            data-testid="sheet-save"
            onClick={save}
            style={{
              flex: 2,
              border: "none",
              background: "#2b8fd6",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 14,
              padding: "13px 0",
              cursor: "pointer",
            }}
          >
            これでOK
          </button>
        </div>
      </div>
    </>
  );
}
