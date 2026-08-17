import type { IntakeRecord, RecordDate } from "@/types/records";
import { sumForBand } from "./aggregate";
import { GOAL_ML, type BandNo } from "./constants";
import { band, elapsedMinutesInRecordDay, hourOf, minuteOf } from "./time";

export type IntakeAdviceState = "urge" | "praise" | "caution";

/** 最後の飲水記録（or 記録日開始）からこの分数以上経過したら「促す」 */
const URGE_THRESHOLD_MIN = 3 * 60;

/** 現在の帯に入ってからの経過分がこれ未満だとペース判定はしない（帯が変わった直後は実績が0に近く不安定なため） */
const MIN_ELAPSED_FOR_PACE_MIN = 60;

/** 帯の実績/目安がこの倍率以上で「褒める」範囲の下限 */
const PRAISE_LOW_RATIO = 0.7;

/** 帯の実績が目安を超えたら「注意（飲みすぎ）」 */
const CAUTION_RATIO = 1.0;

const BAND_MINUTES = 8 * 60;

/**
 * 帯(14〜21時 / 22〜翌5時 / 翌6〜13時)ごとの目安摂取量(ml)。
 * 24時間均等ではなく、睡眠帯(22〜翌5時)はほぼ飲まない前提で少なく見積もる
 * （合計2000ml = 活動帯950ml×2 + 睡眠帯100ml）
 */
const BAND_TARGET_ML: Record<BandNo, number> = { 1: 950, 2: 100, 3: 950 };

/**
 * 今日の飲水状況から状態を判定する。null は「吹き出しを出さない」。
 * viewDateが今日でない呼び出しは想定しない（呼び出し側でisToday判定すること）。
 *
 * 判定は2段階: (1)日合計が1日の目標に達していないか（帯をまたいでも消えない飲みすぎ）、
 * (2)現在の帯の実績がその帯の目安を超えていないか（急なペース）。どちらかに該当すれば注意。
 */
export function getIntakeAdviceState(
  intakes: IntakeRecord[],
  viewDate: RecordDate,
  waterTotalMl: number,
  now: Date
): IntakeAdviceState | null {
  const nowElapsedMin = elapsedMinutesInRecordDay(now.getHours(), now.getMinutes());

  const dayWater = intakes.filter((x) => x.kind === "water" && x.recordDate === viewDate);
  const lastElapsedMin = dayWater.length
    ? Math.max(
        ...dayWater.map((x) => elapsedMinutesInRecordDay(hourOf(x.recordedAt), minuteOf(x.recordedAt)))
      )
    : 0;

  if (nowElapsedMin - lastElapsedMin >= URGE_THRESHOLD_MIN) return "urge";

  if (waterTotalMl >= GOAL_ML) return "caution";

  const minutesIntoBand = nowElapsedMin % BAND_MINUTES;
  if (minutesIntoBand < MIN_ELAPSED_FOR_PACE_MIN) return null;

  const currentBand = band(now.getHours());
  const bandTarget = BAND_TARGET_ML[currentBand];
  const bandWaterMl = sumForBand(intakes, "water", viewDate, currentBand);
  const ratio = bandWaterMl / bandTarget;

  if (ratio >= CAUTION_RATIO) return "caution";
  if (ratio >= PRAISE_LOW_RATIO) return "praise";
  return null;
}

/** 状態ごとのメッセージ候補。増減・文言変更はここだけ触ればよい（\n で任意の位置に改行を入れられる） */
export const ADVICE_MESSAGES: Record<IntakeAdviceState, string[]> = {
  urge: [
    "そろそろ水分をとりましょう",
    "最後に水分を取ってから少し時間が空いています。\nひとくちどうぞ",
    "のどが渇いていませんか？お水を飲みましょう",
    "水分補給を忘れずに",
    "ひとくち、お水はいかがですか",
  ],
  praise: [
    "いいペースです、その調子で",
    "水分バランス、ちょうどいい感じです",
    "順調に水分がとれています",
    "ちょうどいいペースで飲めていますね",
    "その調子で水分補給を続けましょう",
  ],
  caution: [
    "ちょっと飲みすぎかも。ペースを見てみましょう",
    "水分量が多めです。少しペースを落としましょう",
    "飲みすぎに注意しましょう",
    "かなり多めに飲んでいます。様子を見ましょう",
    "ペースが少し早いかもしれません",
  ],
};

export function pickAdviceMessage(state: IntakeAdviceState): string {
  const list = ADVICE_MESSAGES[state];
  return list[Math.floor(Math.random() * list.length)];
}
