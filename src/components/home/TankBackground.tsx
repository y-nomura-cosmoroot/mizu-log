"use client";

import { GOAL_ML } from "@/lib/constants";

function tankHeight(total: number): string {
  return `${Math.max(3, Math.min(100, Math.round((total / GOAL_ML) * 100)))}%`;
}

const waveBase: React.CSSProperties = {
  position: "absolute",
  top: -194,
  left: "50%",
  marginLeft: -105,
  width: 210,
  height: 210,
  borderRadius: "43%",
  background: "#f5fbff",
};

/** 画面全体の左右2分割タンク（左=飲水/青、右=尿量/黄）。水位=日合計/2000ml */
export default function TankBackground({
  waterTotal,
  urineTotal,
}: {
  waterTotal: number;
  urineTotal: number;
}) {
  return (
    <>
      <div
        data-testid="water-tank"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "50%",
          height: tankHeight(waterTotal),
          background: "linear-gradient(180deg,#a5d8f5,#4aa0dc)",
          transition: "height .6s ease",
        }}
      >
        <div style={{ ...waveBase, animation: "spinwave 8s linear infinite" }} />
      </div>
      <div
        data-testid="urine-tank"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "50%",
          height: tankHeight(urineTotal),
          background: "linear-gradient(180deg,#f4cf83,#e0a53f)",
          transition: "height .6s ease",
        }}
      >
        <div style={{ ...waveBase, animation: "spinwave 10s linear infinite reverse" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 60,
          bottom: 0,
          borderLeft: "1.5px dashed rgba(21,90,143,.25)",
        }}
      />
    </>
  );
}
