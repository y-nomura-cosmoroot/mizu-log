import { describe, expect, it } from "vitest";
import type { IntakeRecord } from "@/types/records";
import { GOAL_ML } from "../constants";
import {
  ADVICE_MESSAGES,
  BAND_TARGET_ML,
  getIntakeAdviceState,
  pickAdviceMessage,
} from "../intakeAdvice";

const D = "2026-08-14";
/** 前日（暦日横断の確認用） */
const PREV = "2026-08-13";

const T1 = BAND_TARGET_ML[1];
const T2 = BAND_TARGET_ML[2];
const T3 = BAND_TARGET_ML[3];

/** 「褒める」下限(目安の0.7倍)にちょうど届くml。浮動小数の誤差を避けるため整数に丸める */
function praiseMl(target: number): number {
  return Math.round(target * 0.7);
}

/** 記録日=暦日なので recordedAt の日付は recordDate と同じ */
function water(h: number, m: number, ml = 100, date = D): IntakeRecord {
  return {
    id: `water-${date}-${h}-${m}-${ml}`,
    kind: "water",
    recordedAt: `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    recordDate: date,
    ml,
  };
}

/** 2026-08-14(金) の h:m */
function at(h: number, m: number): Date {
  return new Date(2026, 7, 14, h, m);
}

describe("BAND_TARGET_ML（帯ごとの目安摂取量）", () => {
  it("3帯の目安の合計は1日の目標 GOAL_ML と一致する", () => {
    const sum = Object.values(BAND_TARGET_ML).reduce((a, x) => a + x, 0);
    expect(sum).toBe(GOAL_ML);
  });
  it("帯1(0〜7時)は睡眠帯なので他の帯より少ない", () => {
    expect(T1).toBeLessThan(T2);
    expect(T1).toBeLessThan(T3);
  });
  it("全帯の目安は正の値", () => {
    for (const v of Object.values(BAND_TARGET_ML)) expect(v).toBeGreaterThan(0);
  });
});

describe("getIntakeAdviceState（促す: 最後の飲水から3時間以上）", () => {
  it("記録が1件もなく、0:00から3時間(180分)経過した3:00は促す", () => {
    expect(getIntakeAdviceState([], D, 0, at(3, 0))).toBe("urge");
  });
  it("記録が1件もなく、0:00から179分の2:59は促さない（帯1の実績0でペースもnull）", () => {
    expect(getIntakeAdviceState([], D, 0, at(2, 59))).toBeNull();
  });
  it("記録が1件もなく15:00なら促す", () => {
    expect(getIntakeAdviceState([], D, 0, at(15, 0))).toBe("urge");
  });
  it("9:00に飲んで12:00(ちょうど3時間)なら促す", () => {
    expect(getIntakeAdviceState([water(9, 0)], D, 100, at(12, 0))).toBe("urge");
  });
  it("9:00に飲んで12:00なら、日合計が目標に達していても促すが優先", () => {
    expect(getIntakeAdviceState([water(9, 0, GOAL_ML)], D, GOAL_ML, at(12, 0))).toBe("urge");
  });
  it("11:50に飲んで12:00(10分)なら促さない", () => {
    expect(getIntakeAdviceState([water(11, 50)], D, 100, at(12, 0))).not.toBe("urge");
  });
});

describe("getIntakeAdviceState（促す判定は暦日をまたいで最後の飲水を探す）", () => {
  const prevNight = [water(23, 50, 100, PREV)];

  it("前日23:50に飲んで当日2:00(130分)に開いても促さない", () => {
    const result = getIntakeAdviceState(prevNight, D, 0, new Date(2026, 7, 14, 2, 0));
    expect(result).not.toBe("urge");
  });
  it("前日23:50に飲んで当日2:59は、0:00起点なら179分だが実経過189分なので促す", () => {
    const result = getIntakeAdviceState(prevNight, D, 0, new Date(2026, 7, 14, 2, 59));
    expect(result).toBe("urge");
  });
  it("前日23:50に飲んで当日6:00(370分)なら促す", () => {
    const result = getIntakeAdviceState(prevNight, D, 0, new Date(2026, 7, 14, 6, 0));
    expect(result).toBe("urge");
  });
  it("現在時刻より後(未来)の飲水記録は最後の飲水として扱わない（記録なし扱いで0:00起点）", () => {
    const future = [water(15, 0)];
    expect(getIntakeAdviceState(future, D, 100, at(12, 0))).toBe("urge");
  });
  it("未来の記録があっても、現在時刻以前の最後の飲水で判定する", () => {
    const intakes = [water(9, 0), water(15, 0)];
    expect(getIntakeAdviceState(intakes, D, 200, at(12, 0))).toBe("urge");
  });
});

describe("getIntakeAdviceState（帯が変わった直後は1時間はペース判定しない）", () => {
  it("8:00ちょうど(帯2に入った直後)はnull", () => {
    expect(getIntakeAdviceState([water(7, 50, 50)], D, 50, at(8, 0))).toBeNull();
  });
  it("8:59(帯2に入ってまだ59分)もnull", () => {
    expect(getIntakeAdviceState([water(7, 50, 50)], D, 50, at(8, 59))).toBeNull();
  });
  it("9:00(帯2に入って60分)からはペース判定が始まる", () => {
    expect(getIntakeAdviceState([water(8, 50, T2)], D, T2, at(9, 0))).toBe("caution");
  });
  it("16:00ちょうど(帯3に入った直後)はnull", () => {
    expect(getIntakeAdviceState([water(15, 50, 50)], D, 50, at(16, 0))).toBeNull();
  });
  it("16:59(帯3に入ってまだ59分)もnull", () => {
    expect(getIntakeAdviceState([water(15, 50, 50)], D, 50, at(16, 59))).toBeNull();
  });
  it("17:00(帯3に入って60分)からはペース判定が始まる", () => {
    expect(getIntakeAdviceState([water(16, 50, T3)], D, T3, at(17, 0))).toBe("caution");
  });
});

describe("getIntakeAdviceState（帯1=0〜7時のペース判定）", () => {
  // 直近10分前に記録があることにして「促す」判定より先にペース判定を確認する
  it("目安ちょうど(1.0倍)は注意", () => {
    expect(getIntakeAdviceState([water(0, 50, T1)], D, T1, at(1, 0))).toBe("caution");
  });
  it("目安の0.7倍は褒める", () => {
    const ml = praiseMl(T1);
    expect(getIntakeAdviceState([water(0, 50, ml)], D, ml, at(1, 0))).toBe("praise");
  });
  it("目安の0.7倍未満は何も出さない", () => {
    const ml = praiseMl(T1) - 1;
    expect(getIntakeAdviceState([water(0, 50, ml)], D, ml, at(1, 0))).toBeNull();
  });
  it("6:30に200ml(起床後の1〜2杯)を飲んで7:00に開いても注意にはならない", () => {
    expect(getIntakeAdviceState([water(6, 30, 200)], D, 200, at(7, 0))).not.toBe("caution");
  });
});

describe("getIntakeAdviceState（帯2=8〜15時のペース判定）", () => {
  it("目安ちょうど(1.0倍)は注意", () => {
    expect(getIntakeAdviceState([water(8, 50, T2)], D, T2, at(9, 0))).toBe("caution");
  });
  it("目安の0.7倍は褒める", () => {
    const ml = praiseMl(T2);
    expect(getIntakeAdviceState([water(8, 50, ml)], D, ml, at(9, 0))).toBe("praise");
  });
  it("目安の0.7倍未満は何も出さない", () => {
    const ml = praiseMl(T2) - 1;
    expect(getIntakeAdviceState([water(8, 50, ml)], D, ml, at(9, 0))).toBeNull();
  });
  it("目安を超えていれば注意", () => {
    const ml = T2 + 50;
    expect(getIntakeAdviceState([water(8, 50, ml)], D, ml, at(9, 0))).toBe("caution");
  });
  it("帯内の複数記録は合算して判定する", () => {
    const intakes = [water(8, 10, T2 - 100), water(11, 50, 100)];
    expect(getIntakeAdviceState(intakes, D, T2, at(12, 0))).toBe("caution");
  });
  it("前の帯(帯1)の実績は帯2のペースに含めない", () => {
    // 帯1で目安超えでも、帯2に入って1時間後の帯2実績が少なければ帯2としてはnull
    const intakes = [water(6, 0, T1 + 100), water(8, 50, 50)];
    expect(getIntakeAdviceState(intakes, D, T1 + 150, at(9, 0))).toBeNull();
  });
});

describe("getIntakeAdviceState（帯3=16〜23時のペース判定）", () => {
  it("目安ちょうど(1.0倍)は注意", () => {
    expect(getIntakeAdviceState([water(16, 50, T3)], D, T3, at(17, 0))).toBe("caution");
  });
  it("目安の0.7倍は褒める", () => {
    const ml = praiseMl(T3);
    expect(getIntakeAdviceState([water(16, 50, ml)], D, ml, at(17, 0))).toBe("praise");
  });
  it("目安の0.7倍未満は何も出さない", () => {
    const ml = praiseMl(T3) - 1;
    expect(getIntakeAdviceState([water(16, 50, ml)], D, ml, at(17, 0))).toBeNull();
  });
});

describe("getIntakeAdviceState（日合計が目標以上なら、帯をまたいでも注意のまま）", () => {
  it("15:00に2000ml飲んで帯3に入った直後(16:00)でも、帯切替直後の判定停止より優先して注意", () => {
    expect(getIntakeAdviceState([water(15, 0, GOAL_ML)], D, GOAL_ML, at(16, 0))).toBe(
      "caution"
    );
  });
  it("帯3単独の実績(50ml)は褒める水準にも届かないが、2件合算の日合計2000mlが優先され注意", () => {
    const intakes = [water(15, 0, GOAL_ML - 50), water(16, 10, 50)];
    expect(getIntakeAdviceState(intakes, D, GOAL_ML, at(17, 0))).toBe("caution");
  });
  it("日合計が目標未満なら帯のペース判定に進む", () => {
    const intakes = [water(15, 0, GOAL_ML - 100), water(16, 10, 50)];
    expect(getIntakeAdviceState(intakes, D, GOAL_ML - 50, at(17, 0))).toBeNull();
  });
});

describe("ADVICE_MESSAGES / pickAdviceMessage", () => {
  it("3状態すべてにメッセージ候補が1件以上ある", () => {
    for (const state of ["urge", "praise", "caution"] as const) {
      expect(ADVICE_MESSAGES[state].length).toBeGreaterThan(0);
    }
  });
  it("状態に対応するメッセージ一覧の中から返す", () => {
    for (const state of Object.keys(ADVICE_MESSAGES) as Array<keyof typeof ADVICE_MESSAGES>) {
      const message = pickAdviceMessage(state);
      expect(ADVICE_MESSAGES[state]).toContain(message);
    }
  });
});
