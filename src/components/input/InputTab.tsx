"use client";

import TimeSelector from "../TimeSelector";
import StoolMealCard from "./StoolMealCard";
import VitalsCard from "./VitalsCard";

export default function InputTab() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "2px 16px",
      }}
    >
      <TimeSelector />
      <VitalsCard />
      <StoolMealCard />
    </div>
  );
}
