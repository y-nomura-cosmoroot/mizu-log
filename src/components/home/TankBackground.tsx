"use client";

import { GOAL_ML } from "@/lib/constants";
import styles from "./TankBackground.module.css";

function tankHeight(total: number): string {
  return `${Math.max(3, Math.min(100, Math.round((total / GOAL_ML) * 100)))}%`;
}

/** 波形セグメント: w=横幅, c=中央線からの制御点オフセット（+で谷 / −で山。振幅はc/2） */
type WaveSeg = { w: number; c: number };

/** 大小のうねりを混ぜた波パスを組み立てる（周期=segsの合計幅、repeats回繰り返し） */
function wavePath(mid: number, segs: WaveSeg[], repeats: number): string {
  let d = `M0 ${mid}`;
  let x = 0;
  for (let r = 0; r < repeats; r++) {
    for (const s of segs) {
      d += ` Q ${x + s.w / 2} ${mid + s.c} ${x + s.w} ${mid}`;
      x += s.w;
    }
  }
  return `${d} V 0 H 0 Z`;
}

// 周期240px: 深いうねり→小波→中うねり→大きめの山、の不均一な繰り返し
const FRONT_SEGS: WaveSeg[] = [
  { w: 64, c: 12 },
  { w: 52, c: -7 },
  { w: 64, c: 10 },
  { w: 60, c: -11 },
];

// 周期320px: 前面よりゆったりした別の波形
const BACK_SEGS: WaveSeg[] = [
  { w: 90, c: 10 },
  { w: 70, c: -6 },
  { w: 80, c: 8 },
  { w: 80, c: -9 },
];

/**
 * 水面より上を地の色で塗りつぶす不均一波の帯（周期240px×3本分）。
 * fill はステージ背景 #f5fbff（--c-primary-50）と揃えること。
 * 上下ボブで下がっても切り抜きが途切れないよう、上に7pxの余白を持たせている
 */
function WaveFront() {
  return (
    <svg className={styles.waveFront} width="720" height="20" viewBox="0 0 720 20">
      <path d={wavePath(13, FRONT_SEGS, 3)} fill="#f5fbff" />
    </svg>
  );
}

/** 水面直下の淡いハイライト波（周期320px×3本分・半透明白）。前面と速度差で立体感を出す */
function WaveBack() {
  return (
    <svg className={styles.waveBack} width="960" height="22" viewBox="0 0 960 22">
      <path d={wavePath(14, BACK_SEGS, 3)} fill="rgba(255,255,255,.45)" />
    </svg>
  );
}

/** 横流し（不均一波形）+ 上下ボブを、互いに割り切れない周期で重ねて不規則に見せる */
function Waves() {
  return (
    <>
      <div className={styles.waveWrapBack}>
        <WaveBack />
      </div>
      <div className={styles.waveWrapFront}>
        <WaveFront />
      </div>
    </>
  );
}

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
        className={`${styles.tank} ${styles.tankWater}`}
        style={{ "--tank-h": tankHeight(waterTotal) } as React.CSSProperties}
      >
        <Waves />
      </div>
      <div
        data-testid="urine-tank"
        className={`${styles.tank} ${styles.tankUrine}`}
        style={{ "--tank-h": tankHeight(urineTotal) } as React.CSSProperties}
      >
        <Waves />
      </div>
      <div className={styles.divider} />
    </>
  );
}
