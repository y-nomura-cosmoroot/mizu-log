import type { IntakeRecord, RecordDate } from "@/types/records";
import { GOAL_ML } from "./constants";
import { elapsedMinutesInRecordDay, hourOf, minuteOf } from "./time";

export type IntakeAdviceState = "urge" | "praise" | "caution";

/** 最後の飲水記録（or 記録日開始）からこの分数以上経過したら「促す」 */
const URGE_THRESHOLD_MIN = 3 * 60;

/** 経過分がこれ未満だとペース判定はしない（記録日開始直後は期待値が0に近く不安定なため） */
const MIN_ELAPSED_FOR_PACE_MIN = 60;

/** 実績/期待値がこの倍率以上で「褒める」範囲の下限 */
const PRAISE_LOW_RATIO = 0.7;

/** 実績/期待値がこの倍率以上で「注意（飲みすぎ）」 */
const CAUTION_RATIO = 1.3;

/**
 * 今日の飲水状況から状態を判定する。null は「吹き出しを出さない」。
 * viewDateが今日でない呼び出しは想定しない（呼び出し側でisToday判定すること）。
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

  if (nowElapsedMin < MIN_ELAPSED_FOR_PACE_MIN) return null;

  const expectedMl = (GOAL_ML * nowElapsedMin) / (24 * 60);
  const ratio = waterTotalMl / expectedMl;

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
