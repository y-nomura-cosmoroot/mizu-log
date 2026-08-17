import { describe, expect, it } from "vitest";
import type { IntakeRecord } from "@/types/records";
import { ADVICE_MESSAGES, getIntakeAdviceState, pickAdviceMessage } from "../intakeAdvice";

const D = "2026-08-14";

function water(h: number, m: number, date = D): IntakeRecord {
  const calDay = h < 14 ? "2026-08-15" : date;
  return {
    id: `water-${h}-${m}`,
    kind: "water",
    recordedAt: `${calDay}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    recordDate: date,
    ml: 100,
  };
}

function at(h: number, m: number): Date {
  return new Date(2026, 7, 14, h, m); // 記録日は14時起点なのでこの範囲は全て当日扱い
}

describe("getIntakeAdviceState（促す）", () => {
  it("記録が1件もなく、記録日開始から3時間以上経過していれば促す", () => {
    expect(getIntakeAdviceState([], D, 0, at(17, 0))).toBe("urge");
  });
  it("記録日開始から3時間未満なら促さない（ペース未成立でnull）", () => {
    expect(getIntakeAdviceState([], D, 0, at(16, 59))).toBeNull();
  });
  it("最後の飲水記録から3時間以上経過していれば、合計が多くても促す", () => {
    const intakes = [water(14, 0)];
    expect(getIntakeAdviceState(intakes, D, 900, at(17, 0))).toBe("urge");
  });
  it("最後の飲水記録から3時間未満なら促さない", () => {
    const intakes = [water(16, 50)];
    expect(getIntakeAdviceState(intakes, D, 100, at(17, 0))).not.toBe("urge");
  });
});

describe("getIntakeAdviceState（ペース判定: 20時時点の期待値500ml）", () => {
  const intakes = [water(19, 50)]; // 最終記録から10分しか経っていない

  it("経過1時間未満はペース判定しない", () => {
    expect(getIntakeAdviceState([], D, 0, at(14, 59))).toBeNull();
  });
  it("期待値と近い(1.0倍)なら褒める", () => {
    expect(getIntakeAdviceState(intakes, D, 500, at(20, 0))).toBe("praise");
  });
  it("期待値の0.7倍ちょうどなら褒める", () => {
    expect(getIntakeAdviceState(intakes, D, 350, at(20, 0))).toBe("praise");
  });
  it("期待値の0.7倍未満なら何も出さない", () => {
    expect(getIntakeAdviceState(intakes, D, 300, at(20, 0))).toBeNull();
  });
  it("期待値の1.3倍ちょうどなら注意", () => {
    expect(getIntakeAdviceState(intakes, D, 650, at(20, 0))).toBe("caution");
  });
  it("期待値の1.3倍超なら注意", () => {
    expect(getIntakeAdviceState(intakes, D, 800, at(20, 0))).toBe("caution");
  });
});

describe("pickAdviceMessage", () => {
  it("状態に対応するメッセージ一覧の中から返す", () => {
    for (const state of Object.keys(ADVICE_MESSAGES) as Array<keyof typeof ADVICE_MESSAGES>) {
      const message = pickAdviceMessage(state);
      expect(ADVICE_MESSAGES[state]).toContain(message);
    }
  });
});
