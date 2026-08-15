"use client";

import TimeSelector from "../TimeSelector";
import StoolMealCard from "./StoolMealCard";
import VitalsCard from "./VitalsCard";
import styles from "./InputTab.module.css";

export default function InputTab() {
  return (
    <div className={styles.tab}>
      <TimeSelector />
      <VitalsCard />
      <StoolMealCard />
    </div>
  );
}
