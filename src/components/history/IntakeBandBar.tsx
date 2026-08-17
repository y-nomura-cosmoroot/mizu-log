"use client";

import styles from "./IntakeBandBar.module.css";

type WaveSeg = { w: number; c: number };

/** ホームのタンクと同じ考え方の、横方向に流れる緩やかなうねり */
const SEGS_A: WaveSeg[] = [
  { w: 30, c: 5 },
  { w: 24, c: -4 },
  { w: 28, c: 4.5 },
  { w: 26, c: -5 },
];

const SEGS_B: WaveSeg[] = [
  { w: 38, c: 4 },
  { w: 30, c: -3 },
  { w: 34, c: 3.5 },
  { w: 32, c: -4 },
];

/** mid(縦位置)を中心に横へ凸凹する波形の中心線 */
function waveMid(mid: number, segs: WaveSeg[], repeats: number): string {
  let d = `M0 ${mid}`;
  let x = 0;
  for (let r = 0; r < repeats; r++) {
    for (const s of segs) {
      d += ` Q ${x + s.w / 2} ${mid + s.c} ${x + s.w} ${mid}`;
      x += s.w;
    }
  }
  return d;
}

/** 波形より上側を塗りつぶす帯（バー上部のハイライト用） */
function waveTopPath(mid: number, segs: WaveSeg[], repeats: number): string {
  return `${waveMid(mid, segs, repeats)} V 0 H 0 Z`;
}

/** 波形より下側を塗りつぶす帯（バー下部のハイライト用） */
function waveBottomPath(mid: number, segs: WaveSeg[], repeats: number, height: number): string {
  return `${waveMid(mid, segs, repeats)} V ${height} H 0 Z`;
}

const HEIGHT = 32;
const PERIOD_A = SEGS_A.reduce((a, s) => a + s.w, 0); // 108
const PERIOD_B = SEGS_B.reduce((a, s) => a + s.w, 0); // 134
const SVG_WIDTH_A = PERIOD_A * 3;
const SVG_WIDTH_B = PERIOD_B * 3;

const PATH_TOP = waveTopPath(11, SEGS_A, 3);
const PATH_BOTTOM = waveBottomPath(21, SEGS_B, 3, HEIGHT);

/** りれき用の横向き飲水/尿量バー。帯・時間の目安に対する割合(pct)ぶん左から塗る。
 * 水面の境界は作らず、塗りつぶしの淡いハイライト帯2枚を上下から重ねて揺らめかせる */
export default function IntakeBandBar({
  pct,
  kind,
}: {
  pct: number;
  kind: "water" | "urine";
}) {
  return (
    <div
      data-testid={`band-bar-${kind}`}
      data-kind={kind}
      className={styles.bar}
      style={{ "--bar-w": `${pct}%` } as React.CSSProperties}
    >
      <div className={styles.textureWrap}>
        <svg
          className={`${styles.wave} ${styles.waveBottom}`}
          width={SVG_WIDTH_B}
          height={HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH_B} ${HEIGHT}`}
          preserveAspectRatio="none"
        >
          <path d={PATH_BOTTOM} />
        </svg>
        <svg
          className={`${styles.wave} ${styles.waveTop}`}
          width={SVG_WIDTH_A}
          height={HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH_A} ${HEIGHT}`}
          preserveAspectRatio="none"
        >
          <path d={PATH_TOP} />
        </svg>
      </div>
    </div>
  );
}
