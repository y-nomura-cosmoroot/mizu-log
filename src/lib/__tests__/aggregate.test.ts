import { describe, expect, it } from "vitest";
import type { FlagRecord, IntakeRecord, VitalRecord } from "@/types/records";
import {
  barPct,
  buildMonthlySummary,
  countFlags,
  groupIntakesByBandHour,
  groupVitalEntriesByBandHour,
  sumForBand,
  sumForDay,
  sumForHour,
} from "../aggregate";

const D = "2026-08-14";

function intake(
  kind: "water" | "urine",
  h: number,
  m: number,
  ml: number,
  date = D
): IntakeRecord {
  const calDay = h < 14 ? "2026-08-15" : date;
  return {
    id: `${kind}-${h}-${m}-${ml}`,
    kind,
    recordedAt: `${calDay}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    recordDate: date,
    ml,
  };
}

describe("sumForHour / sumForDay（同一時間内の複数回入力は合算）", () => {
  const intakes = [
    intake("water", 15, 10, 150),
    intake("water", 15, 40, 100),
    intake("water", 16, 0, 200),
    intake("urine", 15, 20, 300),
  ];
  it("同じ15時の飲水2件が合算される", () => {
    expect(sumForHour(intakes, "water", D, 15)).toBe(250);
  });
  it("尿量は独立して集計される", () => {
    expect(sumForHour(intakes, "urine", D, 15)).toBe(300);
  });
  it("日合計", () => {
    expect(sumForDay(intakes, "water", D)).toBe(450);
    expect(sumForDay(intakes, "urine", D)).toBe(300);
  });
  it("別の記録日の分は含めない", () => {
    const other = [...intakes, intake("water", 15, 0, 999, "2026-08-13")];
    expect(sumForDay(other, "water", D)).toBe(450);
  });
});

describe("sumForBand（帯別小計）", () => {
  const intakes = [
    intake("water", 14, 0, 100), // 帯1
    intake("water", 21, 30, 50), // 帯1
    intake("water", 22, 0, 200), // 帯2
    intake("water", 3, 0, 30), // 帯2（翌暦日）
    intake("water", 6, 0, 40), // 帯3（翌暦日）
    intake("water", 13, 0, 60), // 帯3（翌暦日）
  ];
  it("帯1 = 14〜21時", () => {
    expect(sumForBand(intakes, "water", D, 1)).toBe(150);
  });
  it("帯2 = 22〜翌5時", () => {
    expect(sumForBand(intakes, "water", D, 2)).toBe(230);
  });
  it("帯3 = 翌6〜13時", () => {
    expect(sumForBand(intakes, "water", D, 3)).toBe(100);
  });
  it("3帯の合計 = 日合計（隙間なし）", () => {
    const total =
      sumForBand(intakes, "water", D, 1) +
      sumForBand(intakes, "water", D, 2) +
      sumForBand(intakes, "water", D, 3);
    expect(total).toBe(sumForDay(intakes, "water", D));
  });
});

describe("barPct（りれきの横向きバー用の割合）", () => {
  it("基準値ちょうどで100", () => {
    expect(barPct(500, 500)).toBe(100);
  });
  it("基準値の半分で50", () => {
    expect(barPct(250, 500)).toBe(50);
  });
  it("基準値を超えても100でクランプ", () => {
    expect(barPct(900, 500)).toBe(100);
  });
  it("0以下にはならない", () => {
    expect(barPct(0, 500)).toBe(0);
  });
});

describe("groupIntakesByBandHour（履歴グルーピング）", () => {
  const intakes = [
    intake("water", 15, 40, 100),
    intake("water", 15, 10, 150),
    intake("urine", 15, 20, 300),
    intake("water", 3, 0, 50),
  ];
  const groups = groupIntakesByBandHour(intakes, D);
  it("3帯が常に返る", () => {
    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.band)).toEqual([1, 2, 3]);
  });
  it("帯1の15時に飲水250/尿量300、個別3件が分昇順", () => {
    const h15 = groups[0].hours.find((h) => h.hour === 15)!;
    expect(h15.waterSum).toBe(250);
    expect(h15.urineSum).toBe(300);
    expect(h15.items.map((i) => i.ml)).toEqual([150, 300, 100]); // 10分,20分,40分
  });
  it("帯2に翌3時の記録", () => {
    expect(groups[1].hours.map((h) => h.hour)).toEqual([3]);
    expect(groups[1].waterSum).toBe(50);
  });
  it("記録の無い帯は時間行が空", () => {
    expect(groups[2].hours).toHaveLength(0);
  });
});

function vital(h: number, m: number, patch: Partial<VitalRecord> = {}): VitalRecord {
  const calDay = h < 14 ? "2026-08-15" : D;
  return {
    id: `v-${h}-${m}`,
    recordedAt: `${calDay}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    recordDate: D,
    temp: "",
    bpSys: "",
    bpDia: "",
    pulse: "",
    weight: "",
    ...patch,
  };
}

function flag(kind: "stool" | "meal", h: number): FlagRecord {
  const calDay = h < 14 ? "2026-08-15" : D;
  return {
    id: `f-${kind}-${h}-${Math.random()}`,
    kind,
    recordedAt: `${calDay}T${String(h).padStart(2, "0")}:00`,
    recordDate: D,
  };
}

describe("groupVitalEntriesByBandHour", () => {
  it("同一項目は同時間の最新値が行サマリになる", () => {
    const vitals = [vital(15, 10, { temp: "36.5" }), vital(15, 50, { temp: "37.8" })];
    const groups = groupVitalEntriesByBandHour(vitals, [], D);
    const h15 = groups[0].hours.find((h) => h.hour === 15)!;
    expect(h15.summary?.temp).toBe("37.8");
    expect(h15.items).toHaveLength(2);
  });
  it("便・食事は件数として集計される", () => {
    const flags = [flag("stool", 9), flag("stool", 9), flag("meal", 9)];
    const groups = groupVitalEntriesByBandHour([], flags, D);
    const h9 = groups[2].hours.find((h) => h.hour === 9)!;
    expect(h9.stoolCount).toBe(2);
    expect(h9.mealCount).toBe(1);
    expect(h9.summary).toBeNull();
  });
  it("記録が無い帯はempty", () => {
    const groups = groupVitalEntriesByBandHour([], [flag("meal", 8)], D);
    expect(groups[0].empty).toBe(true);
    expect(groups[1].empty).toBe(true);
    expect(groups[2].empty).toBe(false);
  });
});

describe("groupVitalEntriesByBandHour: 部分入力レコードの行サマリ統合（バイタルは全項目任意）", () => {
  const summaryOf = (vitals: VitalRecord[], hour: number) => {
    const groups = groupVitalEntriesByBandHour(vitals, [], D);
    for (const b of groups) {
      const g = b.hours.find((h) => h.hour === hour);
      if (g) return g.summary;
    }
    return null;
  };

  it("バグ報告の再現: 1回目=体温+体重、2回目=血圧+脈拍 → 全項目が表示される", () => {
    const vitals = [
      vital(14, 0, { temp: "34.0", weight: "68" }),
      vital(14, 0, { bpSys: "119", bpDia: "75", pulse: "77" }),
    ];
    expect(summaryOf(vitals, 14)).toEqual({
      temp: "34.0",
      bpSys: "119",
      bpDia: "75",
      pulse: "77",
      weight: "68",
    });
  });

  it("同じ項目が複数レコードにある場合は後の記録が優先される", () => {
    const vitals = [
      vital(14, 10, { temp: "36.5", pulse: "60" }),
      vital(14, 40, { temp: "37.2", weight: "55.5" }),
    ];
    expect(summaryOf(vitals, 14)).toEqual({
      temp: "37.2",
      bpSys: "",
      bpDia: "",
      pulse: "60",
      weight: "55.5",
    });
  });

  it("血圧は上下ペアで採用される（上が入っているレコードの上下を使う）", () => {
    const vitals = [
      vital(14, 10, { bpSys: "110", bpDia: "70" }),
      vital(14, 40, { bpSys: "125", bpDia: "" }),
    ];
    const s = summaryOf(vitals, 14)!;
    expect(s.bpSys).toBe("125");
    expect(s.bpDia).toBe(""); // 後のレコードのペアをそのまま採用
  });

  it("全組み合わせ網羅: 2レコード×各項目(体温/血圧/脈拍/体重)の有無 256通りで、項目ごとに最新の非空値が採用される", () => {
    // 項目キー: t=体温, b=血圧(上下ペア), p=脈拍, w=体重
    const FIELDS = ["t", "b", "p", "w"] as const;
    type Field = (typeof FIELDS)[number];
    const VALUES: Record<"r1" | "r2", Record<Field, Partial<VitalRecord>>> = {
      r1: {
        t: { temp: "36.0" },
        b: { bpSys: "110", bpDia: "70" },
        p: { pulse: "60" },
        w: { weight: "50" },
      },
      r2: {
        t: { temp: "37.5" },
        b: { bpSys: "125", bpDia: "82" },
        p: { pulse: "72" },
        w: { weight: "55.5" },
      },
    };
    const subsets: Field[][] = [];
    for (let bits = 0; bits < 16; bits++) {
      subsets.push(FIELDS.filter((_, i) => bits & (1 << i)));
    }

    let checked = 0;
    for (const s1 of subsets) {
      for (const s2 of subsets) {
        // UI上、全項目空のレコードは保存できないため空レコードは作らない
        const vitals: VitalRecord[] = [];
        if (s1.length) {
          vitals.push(
            vital(14, 10, Object.assign({}, ...s1.map((f) => VALUES.r1[f])))
          );
        }
        if (s2.length) {
          vitals.push(
            vital(14, 40, Object.assign({}, ...s2.map((f) => VALUES.r2[f])))
          );
        }
        const summary = summaryOf(vitals, 14);
        if (!vitals.length) {
          expect(summary).toBeNull();
          continue;
        }
        // 期待値: 項目ごとに「後のレコードにあればr2の値、無ければr1の値、どちらにも無ければ空」
        const pick = (f: Field): Partial<VitalRecord> =>
          s2.includes(f) ? VALUES.r2[f] : s1.includes(f) ? VALUES.r1[f] : {};
        const expected = {
          temp: pick("t").temp ?? "",
          bpSys: pick("b").bpSys ?? "",
          bpDia: pick("b").bpDia ?? "",
          pulse: pick("p").pulse ?? "",
          weight: pick("w").weight ?? "",
        };
        expect(summary, `s1=[${s1}] s2=[${s2}]`).toEqual(expected);
        checked++;
      }
    }
    expect(checked).toBe(255); // 両方空の1通りを除く全組み合わせ
  });
});

describe("countFlags", () => {
  it("記録日・種別で数える", () => {
    const flags = [flag("stool", 9), flag("stool", 20), flag("meal", 12)];
    expect(countFlags(flags, "stool", D)).toBe(2);
    expect(countFlags(flags, "meal", D)).toBe(1);
    expect(countFlags(flags, "stool", "2026-08-13")).toBe(0);
  });
});

describe("buildMonthlySummary（月ごと一覧）", () => {
  const timings = ["朝", "晩"];
  const intakes = [
    intake("water", 15, 0, 500, "2026-08-10"),
    intake("water", 16, 0, 200, "2026-08-10"),
    intake("urine", 15, 0, 250, "2026-08-10"),
    intake("water", 15, 0, 100, "2026-07-31"), // 前月分は含めない
  ];
  const flags: FlagRecord[] = [
    { id: "mf1", kind: "stool", recordDate: "2026-08-10", recordedAt: "2026-08-10T15:00" },
    { id: "mf2", kind: "stool", recordDate: "2026-08-10", recordedAt: "2026-08-10T16:00" },
    { id: "mf3", kind: "meal", recordDate: "2026-08-10", recordedAt: "2026-08-10T18:00" },
  ];
  const medChecks = {
    "2026-08-10": { 朝: 8 },
    "2026-08-12": { 朝: 8, 晩: 19 },
  };
  const days = buildMonthlySummary(
    intakes, [], flags, medChecks, timings, 2026, 7, "2026-08-14"
  );

  it("今日までの日数分の行になる（未来日は出さない）", () => {
    expect(days).toHaveLength(14);
    expect(days[0].date).toBe("2026-08-01");
    expect(days[13].date).toBe("2026-08-14");
  });
  it("日別に飲水/尿/便/食事が集計される", () => {
    const d10 = days[9];
    expect(d10.day).toBe(10);
    expect(d10.waterMl).toBe(700);
    expect(d10.urineMl).toBe(250);
    expect(d10.stoolCount).toBe(2);
    expect(d10.mealCount).toBe(1);
    expect(d10.hasRecords).toBe(true);
  });
  it("飲み忘れは「記録がある日」だけ判定する", () => {
    expect(days[9].medsMissed).toBe(true); // 8/10: 朝のみチェック
    expect(days[11].medsMissed).toBe(false); // 8/12: 全チェック
    expect(days[0].hasRecords).toBe(false); // 8/1: 記録なし
    expect(days[0].medsMissed).toBe(false); // → 判定しない
  });
  it("バイタルだけの日も記録ありとして扱う", () => {
    const vitals: VitalRecord[] = [
      {
        id: "mv1",
        recordDate: "2026-08-05",
        recordedAt: "2026-08-05T15:00",
        temp: "36.5",
        bpSys: "",
        bpDia: "",
        pulse: "",
        weight: "",
      },
    ];
    const withV = buildMonthlySummary([], vitals, [], {}, timings, 2026, 7, "2026-08-14");
    expect(withV[4].hasRecords).toBe(true);
    expect(withV[4].medsMissed).toBe(true); // 未チェックなので飲み忘れ扱い
  });
  it("過去月は末日まで、未来月は空配列", () => {
    expect(buildMonthlySummary([], [], [], {}, timings, 2026, 6, "2026-08-14")).toHaveLength(31);
    expect(buildMonthlySummary([], [], [], {}, timings, 2026, 8, "2026-08-14")).toHaveLength(0);
  });
});
