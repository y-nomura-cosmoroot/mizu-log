"use client";

import { DEFAULT_PULSE_BPM } from "@/lib/constants";
import {
  beatDurationSec,
  bodyColorOf,
  heartColorOf,
  type BpLevel,
  type BuildEffect,
  type BuildLevel,
  type FeverLevel,
  type PulseEffect,
} from "@/lib/vitalEffects";
import styles from "./BodyFigure.module.css";

export type { BpLevel, BuildEffect, BuildLevel, FeverLevel, PulseEffect };

const CX = 70; // シルエットの中心x（viewBox幅140の中央）

/**
 * 体温で色が変わり、体重で体型が変わる人体シルエットSVG。
 *
 * 「太って見える」ための形状ルール:
 * - 胴体は肩・腹・腰の幅を別々に変える。腹が最も大きく膨らむ卵型（細いときは腹が
 *   くびれた砂時計型）になるよう、側面をベジェ曲線で描く
 * - 顔は縦より横に広がる楕円（ほっぺが膨らむ）
 * - 腕・脚は太くなる。太るほど腕の振り角度を浅くして描画領域(viewBox)から
 *   はみ出さないようにする（見切れ対策。viewBox自体も120→140に拡張済み）
 *
 * 脈拍エフェクト:
 * - 右胸（画面上の右側=解剖学的な心臓の位置）に心臓を常に表示し、
 *   実際のBPMと同じ周期（60÷脈拍数 秒/拍）で拍動させる。
 *   未入力・記録なしのときは通常の心拍（DEFAULT_PULSE_BPM）で拍動する
 * - 高い（PULSE_HIGH_BPM超）: 心臓の周りに効果線を出して通常との違いを明示
 * - 低い（PULSE_LOW_BPM未満）: 心臓が青くなる
 *
 * 血圧エフェクト（判定は上=収縮期のみ）:
 * - 高血圧（BP_HIGH_SYS以上）: 両腕に血管が浮き出る（ジグザグ+枝分かれ）
 * - 低血圧（BP_LOW_SYS未満）: 頭の周りにめまいの渦巻きマークがゆらゆら揺れる
 */
export default function BodyFigure({
  level,
  build = { level: "none", factor: 1 },
  pulse = { level: "none", bpm: null },
  bp = "none",
}: {
  level: FeverLevel;
  build?: BuildEffect;
  pulse?: PulseEffect;
  bp?: BpLevel;
}) {
  const c = bodyColorOf(level);
  const f = build.factor;

  // 胴体: 肩はわずか、腰は中くらい、腹は大きく変化させる
  const shoulderW = 44 + (f - 1) * 12;
  const bellyW = 44 + (f - 1) * 50;
  const hipW = 44 + (f - 1) * 28;
  const sh = shoulderW / 2;
  const bh = bellyW / 2;
  const hh = hipW / 2;
  const torsoPath = [
    `M ${CX - sh} 62`,
    `C ${CX - bh} 86, ${CX - bh} 118, ${CX - hh} 134`,
    `L ${CX + hh} 134`,
    `C ${CX + bh} 118, ${CX + bh} 86, ${CX + sh} 62`,
    `Q ${CX} 44 ${CX - sh} 62`,
    "Z",
  ].join(" ");

  // 顔: 横に広がる楕円（縦はわずかに変化）
  const headRx = 20 + (f - 1) * 7;
  const headRy = 20 + (f - 1) * 3;

  // 腕: 太るほど太く、振り角度は浅く（はみ出し防止）
  const armW = 14 + (f - 1) * 7;
  const armAngle = 14 - (f - 1) * 7;
  const leftArmX = CX - sh - 6 - armW;
  const rightArmX = CX + sh + 6;

  // 脚: 内側エッジ（中央の隙間6px）を固定して外側へ太らせる
  const legW = 15 + (f - 1) * 11;
  const leftLegX = CX - 3 - legW;
  const rightLegX = CX + 3;

  // 高血圧: 腕に浮き出る血管（腕の中心線に沿ったジグザグ+枝分かれ）
  const veinPath = (cx: number) =>
    [
      `M ${cx - 2} 64 l 4 9 l -5 9 l 5 10 l -4 9`,
      `M ${cx + 2} 80 l 3.5 6`,
      `M ${cx - 2} 92 l -3.5 6`,
    ].join(" ");

  // 心臓: 右胸（画面上の右側）。原点中心のハート形を胸の位置へ移動して描く
  const heartX = CX + 9;
  const heartY = 78;
  const heartPath =
    "M0 -3 C -1.5 -6.5, -6.5 -6.5, -6.5 -1.5 C -6.5 2, -2.5 4.5, 0 7.5 C 2.5 4.5, 6.5 2, 6.5 -1.5 C 6.5 -6.5, 1.5 -6.5, 0 -3 Z";
  const heartColor = heartColorOf(pulse.level);
  const beatSec = beatDurationSec(pulse.bpm ?? DEFAULT_PULSE_BPM);

  return (
    <svg
      data-testid="body-figure"
      data-fever={level}
      data-build={build.level}
      data-build-factor={f.toFixed(2)}
      data-pulse={pulse.level}
      data-bp={bp}
      width="140"
      height="252"
      viewBox="0 0 140 252"
    >
      <ellipse cx={CX} cy="26" rx={headRx} ry={headRy} fill={c} className={styles.colorT} />
      <path d={torsoPath} fill={c} className={styles.colorT} />
      <rect
        x={leftArmX}
        y="56"
        width={armW}
        height="64"
        rx={armW / 2}
        transform={`rotate(${armAngle} ${leftArmX + armW / 2} 60)`}
        fill={c}
        className={styles.colorT}
      />
      <rect
        x={rightArmX}
        y="56"
        width={armW}
        height="64"
        rx={armW / 2}
        transform={`rotate(${-armAngle} ${rightArmX + armW / 2} 60)`}
        fill={c}
        className={styles.colorT}
      />
      <rect
        x={leftLegX}
        y="132"
        width={legW}
        height="116"
        rx={legW / 2}
        fill={c}
        className={styles.colorT}
      />
      <rect
        x={rightLegX}
        y="132"
        width={legW}
        height="116"
        rx={legW / 2}
        fill={c}
        className={styles.colorT}
      />
      {bp === "high" && (
        <g
          data-testid="bp-veins"
          className={styles.veins}
          stroke="#a52a4a"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path
            d={veinPath(leftArmX + armW / 2)}
            transform={`rotate(${armAngle} ${leftArmX + armW / 2} 60)`}
          />
          <path
            d={veinPath(rightArmX + armW / 2)}
            transform={`rotate(${-armAngle} ${rightArmX + armW / 2} 60)`}
          />
        </g>
      )}
      {bp === "low" && (
        <g
          data-testid="dizzy-marks"
          className={styles.dizzy}
          stroke="#7d9bd2"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        >
          {/* 頭の周りの渦巻き×3（左・上・右） */}
          <g transform={`translate(${CX - 30} 14) rotate(-20)`}>
            <path d="M0 0 a2.2 2.2 0 1 1 2.2 2.2 a4.4 4.4 0 1 1 -6.6 -2.2" />
          </g>
          <g transform={`translate(${CX - 4} -8) rotate(15)`}>
            <path d="M0 0 a2.2 2.2 0 1 1 2.2 2.2 a4.4 4.4 0 1 1 -6.6 -2.2" />
          </g>
          <g transform={`translate(${CX + 26} 12) rotate(40)`}>
            <path d="M0 0 a2.2 2.2 0 1 1 2.2 2.2 a4.4 4.4 0 1 1 -6.6 -2.2" />
          </g>
        </g>
      )}
      <g data-testid="heart" transform={`translate(${heartX} ${heartY})`}>
        <g
          className={styles.heartBeat}
          style={{ "--beat": `${beatSec}s` } as React.CSSProperties}
        >
          <path d={heartPath} fill={heartColor} className={styles.colorT} />
          {pulse.level === "high" && (
            <g
              data-testid="heart-effect-lines"
              stroke={heartColor}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="0" y1="-10" x2="0" y2="-15" />
              <line x1="8" y1="-8" x2="11.5" y2="-11.5" />
              <line x1="11" y1="0" x2="16" y2="0" />
              <line x1="-8" y1="-8" x2="-11.5" y2="-11.5" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
