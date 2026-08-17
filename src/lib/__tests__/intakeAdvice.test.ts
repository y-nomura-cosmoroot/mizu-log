import { describe, expect, it } from "vitest";
import type { IntakeRecord } from "@/types/records";
import { ADVICE_MESSAGES, getIntakeAdviceState, pickAdviceMessage } from "../intakeAdvice";

const D = "2026-08-14";

function water(h: number, m: number, ml = 100, date = D): IntakeRecord {
  const calDay = h < 14 ? "2026-08-15" : date;
  return {
    id: `water-${h}-${m}-${ml}`,
    kind: "water",
    recordedAt: `${calDay}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    recordDate: date,
    ml,
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
    const intakes = [water(14, 0, 900)];
    expect(getIntakeAdviceState(intakes, D, 900, at(17, 0))).toBe("urge");
  });
  it("最後の飲水記録から3時間未満なら促さない", () => {
    const intakes = [water(16, 50)];
    expect(getIntakeAdviceState(intakes, D, 100, at(17, 0))).not.toBe("urge");
  });
});

describe("getIntakeAdviceState（帯1=14〜21時のペース判定、目安950ml）", () => {
  // 直近10分前に記録があることにして「促す」判定より先にペース判定を確認する
  it("目安ちょうど(1.0倍・950ml)は注意", () => {
    expect(getIntakeAdviceState([water(15, 50, 950)], D, 950, at(16, 0))).toBe("caution");
  });
  it("目安の0.7倍(665ml)は褒める", () => {
    expect(getIntakeAdviceState([water(15, 50, 665)], D, 665, at(16, 0))).toBe("praise");
  });
  it("目安の0.7倍未満(664ml)は何も出さない", () => {
    expect(getIntakeAdviceState([water(15, 50, 664)], D, 664, at(16, 0))).toBeNull();
  });
  it("目安を超えた(1000ml)は注意", () => {
    expect(getIntakeAdviceState([water(15, 50, 1000)], D, 1000, at(16, 0))).toBe("caution");
  });
});

describe("getIntakeAdviceState（帯が変わった直後は1時間はペース判定しない）", () => {
  it("22:00ちょうど(帯2に入った直後)はnull", () => {
    expect(getIntakeAdviceState([water(21, 50, 50)], D, 50, at(22, 0))).toBeNull();
  });
  it("22:59(帯2に入ってまだ59分)もnull", () => {
    expect(getIntakeAdviceState([water(22, 50, 50)], D, 50, at(22, 59))).toBeNull();
  });
  it("23:00(帯2に入って60分)からはペース判定が始まる", () => {
    expect(getIntakeAdviceState([water(22, 50, 100)], D, 100, at(23, 0))).toBe("caution");
  });
});

describe("getIntakeAdviceState（帯2=22〜翌5時のペース判定、目安100ml。睡眠帯はほぼ飲まない前提）", () => {
  it("目安ちょうど(100ml)は注意", () => {
    expect(getIntakeAdviceState([water(22, 50, 100)], D, 100, at(23, 0))).toBe("caution");
  });
  it("目安の0.7倍(70ml)は褒める", () => {
    expect(getIntakeAdviceState([water(22, 50, 70)], D, 70, at(23, 0))).toBe("praise");
  });
  it("目安の0.7倍未満(69ml)は何も出さない", () => {
    expect(getIntakeAdviceState([water(22, 50, 69)], D, 69, at(23, 0))).toBeNull();
  });
});

describe("getIntakeAdviceState（日合計が目標2000ml以上なら、帯をまたいでも注意のまま）", () => {
  it("帯1で2000ml飲んだ直後に帯2に入っても注意のまま", () => {
    expect(getIntakeAdviceState([water(20, 0, 2000)], D, 2000, at(22, 0))).toBe("caution");
  });
  it("帯2単独の実績(50ml)は目安の半分で褒める水準にも届かないが、日合計2000mlが優先され注意", () => {
    const intakes = [water(20, 0, 1950), water(22, 10, 50)];
    expect(getIntakeAdviceState(intakes, D, 2000, at(23, 0))).toBe("caution");
  });
});

describe("getIntakeAdviceState（不具合再現: 16時台に合計200ml/400mlで誤って注意になっていた）", () => {
  it("16時に帯1の実績200ml(目安950mlの0.21倍)はもう注意にならない", () => {
    expect(getIntakeAdviceState([water(15, 50, 200)], D, 200, at(16, 0))).toBeNull();
  });
  it("16時に帯1の実績400ml(目安950mlの0.42倍)はもう注意にならない", () => {
    expect(getIntakeAdviceState([water(15, 50, 400)], D, 400, at(16, 0))).toBeNull();
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
