"use client";

import StoolMealCard from "./StoolMealCard";
import VitalsCard from "./VitalsCard";
import styles from "./InputTab.module.css";

export default function InputTab() {
  return (
    <div className={styles.tab}>
      <VitalsCard />
      <StoolMealCard />
    </div>
  );
}
