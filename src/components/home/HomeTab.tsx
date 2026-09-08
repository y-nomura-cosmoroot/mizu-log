"use client";

import { sumForBand, sumForDay, sumForHour } from "@/lib/aggregate";
import { getIntakeAdviceState } from "@/lib/intakeAdvice";
import { uncheckedTimings } from "@/lib/meds";
import { isHourMismatched, pad2, targetMinute } from "@/lib/time";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import type { IntakeKind } from "@/types/records";
import IntakeAdviceBubble from "./IntakeAdviceBubble";
import IntakePanel from "./IntakePanel";
import MedsAlertBanner from "./MedsAlertBanner";
import SubtotalBar from "./SubtotalBar";
import TankBackground from "./TankBackground";
import styles from "./HomeTab.module.css";

export default function HomeTab() {
  const intakes = useAppStore((s) => s.intakes);
  const timings = useAppStore((s) => s.timings);
  const medChecks = useAppStore((s) => s.medChecks);
  const addIntake = useAppStore((s) => s.addIntake);

  const viewDate = useUiStore((s) => s.viewDate);
  const todayKey = useUiStore((s) => s.todayKey);
  const selHour = useUiStore((s) => s.selHour);
  const nowHour = useUiStore((s) => s.nowHour);
  const customWater = useUiStore((s) => s.customWater);
  const customUrine = useUiStore((s) => s.customUrine);
  const setCustomWater = useUiStore((s) => s.setCustomWater);
  const setCustomUrine = useUiStore((s) => s.setCustomUrine);
  const showToast = useUiStore((s) => s.showToast);

  const waterTotal = sumForDay(intakes, "water", viewDate);
  const urineTotal = sumForDay(intakes, "urine", viewDate);
  const unchecked = uncheckedTimings(timings, medChecks, viewDate);
  const isToday = viewDate === todayKey;
  const adviceState = isToday
    ? getIntakeAdviceState(intakes, viewDate, waterTotal, new Date())
    : null;

  const add = (kind: IntakeKind, ml: number) => {
    const now = new Date();
    const minute = targetMinute(viewDate, selHour, now);
    const id = addIntake(kind, ml, viewDate, selHour, minute);
    const label = kind === "water" ? "飲水" : "尿量";
    // 記録する時間がズレたままなら、トーストから直せるようにする
    showToast(
      `${selHour}:${pad2(minute)} に ${label} +${ml}ml をきろくしました`,
      isHourMismatched(viewDate, todayKey, selHour, nowHour)
        ? { kind: "intake", id, hour: nowHour, minute: now.getMinutes() }
        : undefined
    );
  };

  return (
    <div className={styles.stage}>
      <TankBackground waterTotal={waterTotal} urineTotal={urineTotal} />

      {isToday && unchecked.length > 0 && <MedsAlertBanner unchecked={unchecked} />}
      {adviceState && <IntakeAdviceBubble state={adviceState} />}

      <div className={styles.panels}>
        <IntakePanel
          kind="water"
          hourMl={sumForHour(intakes, "water", viewDate, selHour)}
          dayTotalMl={waterTotal}
          customMl={customWater}
          onCustomChange={setCustomWater}
          onAdd={(ml) => add("water", ml)}
        />
        <IntakePanel
          kind="urine"
          hourMl={sumForHour(intakes, "urine", viewDate, selHour)}
          dayTotalMl={urineTotal}
          customMl={customUrine}
          onCustomChange={setCustomUrine}
          onAdd={(ml) => add("urine", ml)}
        />
      </div>

      <SubtotalBar
        waterBands={[
          sumForBand(intakes, "water", viewDate, 1),
          sumForBand(intakes, "water", viewDate, 2),
          sumForBand(intakes, "water", viewDate, 3),
        ]}
        urineBands={[
          sumForBand(intakes, "urine", viewDate, 1),
          sumForBand(intakes, "urine", viewDate, 2),
          sumForBand(intakes, "urine", viewDate, 3),
        ]}
        waterTotal={waterTotal}
        urineTotal={urineTotal}
      />
    </div>
  );
}
