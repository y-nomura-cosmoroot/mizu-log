import { describe, expect, it } from "vitest";
import type { MedChecks, Timing } from "@/types/records";
import { ALL_WEEKDAYS } from "../constants";
import { uncheckedTimings } from "../meds";
import {
  healAppData,
  initialAppData,
  migratePersisted,
  migrateV1toV2,
  normalizeAppData,
  normalizeFlag,
  normalizeIntake,
  normalizeMedChecks,
  normalizeMedicine,
  normalizeTiming,
  normalizeTimings,
  normalizeVital,
  normalizeWeekdays,
  rebucketLegacyMedChecks,
} from "../migrate";

const D = "2026-08-14";
const D_NEXT = "2026-08-15";
const ALL = [...ALL_WEEKDAYS];

/**
 * e2e/visual-helpers.ts の SEED_STATE を模した v2(14時起点)の persist state。
 * persist の migrate には {state, version} の state 部分だけが渡るので、ここでも state を返す。
 * 呼ぶたびに新しいオブジェクトを作る（テスト間で共有しない）
 */
function v2Envelope(overrides: Record<string, unknown> = {}) {
  return {
    intakes: [
      { id: "vw1", kind: "water", ml: 150, recordDate: D, recordedAt: "2026-08-14T15:10" },
      { id: "vw2", kind: "water", ml: 200, recordDate: D, recordedAt: "2026-08-14T16:00" },
      { id: "vw3", kind: "water", ml: 300, recordDate: D, recordedAt: "2026-08-14T22:00" },
      // 旧モデル: 翌6時の記録は記録日 8/14 のまま翌暦日の recordedAt を持つ
      { id: "vw4", kind: "water", ml: 120, recordDate: D, recordedAt: "2026-08-15T06:00" },
      { id: "vu1", kind: "urine", ml: 100, recordDate: D, recordedAt: "2026-08-14T15:30" },
      {
        id: "vp1",
        kind: "water",
        ml: 500,
        recordDate: "2026-08-13",
        recordedAt: "2026-08-13T18:00",
      },
    ],
    vitals: [
      {
        id: "vv1",
        recordDate: D,
        recordedAt: "2026-08-14T15:00",
        temp: "38.5",
        bpSys: "150",
        bpDia: "95",
        pulse: "120",
        weight: "70",
      },
      {
        id: "vv2",
        recordDate: D,
        recordedAt: "2026-08-15T06:30",
        temp: "36.5",
        bpSys: "",
        bpDia: "",
        pulse: "",
        weight: "",
      },
    ],
    flags: [
      { id: "vf1", kind: "stool", recordDate: D, recordedAt: "2026-08-14T15:00" },
      { id: "vf2", kind: "meal", recordDate: D, recordedAt: "2026-08-15T07:00" },
    ],
    medChecks: { [D]: { 朝: 8 } },
    timings: ["朝", "昼", "晩", "ねる前"],
    medicines: [
      { id: "vm1", name: "タケキャブ", doseAmount: "1", doseUnit: "錠", timings: ["朝", "晩"] },
      { id: "vm2", name: "マグミット", doseAmount: "2", doseUnit: "錠", timings: ["朝", "昼", "晩"] },
      { id: "vm3", name: "", doseAmount: "", doseUnit: "錠", timings: [] },
    ],
    ...overrides,
  };
}

/** v1: Medicine.dose が自由入力文字列 */
function v1Envelope(overrides: Record<string, unknown> = {}) {
  return v2Envelope({
    medicines: [
      { id: "m1", name: "グラセプター", dose: "1mg", timings: ["朝", "晩"] },
      { id: "m2", name: "プレドニン", dose: "2錠", timings: ["朝"] },
      { id: "m3", name: "", dose: "", timings: [] },
    ],
    ...overrides,
  });
}

function byId<T extends { id: string }>(list: T[], id: string): T {
  const found = list.find((x) => x.id === id);
  if (!found) throw new Error(`id ${id} not found`);
  return found;
}

// ---------------------------------------------------------------------------

describe("migratePersisted（ディスパッチ）", () => {
  it("オブジェクトでない persisted は初期データ", () => {
    for (const bad of [null, "x", 42, []]) {
      expect(migratePersisted(bad, 2)).toEqual(initialAppData());
    }
  });

  it("version 1: dose 分割 + recordDate 再導出 + medChecks 移動 + timings オブジェクト化", () => {
    const out = migratePersisted(v1Envelope(), 1);

    // dose → doseAmount + doseUnit（dose キーは残さない）
    expect(byId(out.medicines, "m1")).toEqual({
      id: "m1",
      name: "グラセプター",
      doseAmount: "1",
      doseUnit: "mg",
      timings: ["朝", "晩"],
    });
    expect(byId(out.medicines, "m2")).toMatchObject({ doseAmount: "2", doseUnit: "錠" });
    expect(byId(out.medicines, "m3")).toMatchObject({ doseAmount: "", doseUnit: "錠" });
    for (const m of out.medicines) expect(m).not.toHaveProperty("dose");

    // 翌暦日の recordedAt を持つ記録は recordDate が翌暦日へ
    expect(byId(out.intakes, "vw4").recordDate).toBe(D_NEXT);
    expect(byId(out.intakes, "vw1").recordDate).toBe(D);
    expect(byId(out.vitals, "vv2").recordDate).toBe(D_NEXT);
    expect(byId(out.flags, "vf2").recordDate).toBe(D_NEXT);

    // 朝8時のチェックは翌暦日へ
    expect(out.medChecks).toEqual({ [D_NEXT]: { 朝: 8 } });

    // 文字列タイミング → 全曜日のオブジェクト
    expect(out.timings).toEqual([
      { name: "朝", weekdays: ALL },
      { name: "昼", weekdays: ALL },
      { name: "晩", weekdays: ALL },
      { name: "ねる前", weekdays: ALL },
    ]);
  });

  it("version 2: v2→v3 を適用し doseAmount/doseUnit はそのまま", () => {
    const out = migratePersisted(v2Envelope(), 2);
    expect(out.medicines).toEqual(v2Envelope().medicines);
    expect(byId(out.intakes, "vw4").recordDate).toBe(D_NEXT);
    expect(out.medChecks).toEqual({ [D_NEXT]: { 朝: 8 } });
    expect(out.timings.map((t) => t.name)).toEqual(["朝", "昼", "晩", "ねる前"]);
    for (const t of out.timings) expect(t.weekdays).toEqual(ALL);
  });

  it("version 3: medChecks は移動しない。オブジェクト timings は不変・文字列 timings は補修", () => {
    const timings: unknown[] = [{ name: "朝", weekdays: [1, 3, 5] }, "昼"];
    const out = migratePersisted(v2Envelope({ timings }), 3);
    expect(out.medChecks).toEqual({ [D]: { 朝: 8 } });
    expect(out.timings).toEqual([
      { name: "朝", weekdays: [1, 3, 5] },
      { name: "昼", weekdays: ALL },
    ]);
  });

  it("未知の version(0/99): 記録は保持し medChecks も移動しない（初期化しない）", () => {
    for (const version of [0, 99]) {
      const out = migratePersisted(v2Envelope(), version);
      expect(out).not.toEqual(initialAppData());
      expect(out.intakes).toHaveLength(6);
      expect(out.vitals).toHaveLength(2);
      expect(out.flags).toHaveLength(2);
      expect(out.medicines).toHaveLength(3);
      expect(out.medChecks).toEqual({ [D]: { 朝: 8 } });
    }
  });

  it("壊れた値の詰め合わせでも throw せず6キーとも配列/オブジェクトになる", () => {
    const poison = {
      timings: 5,
      intakes: "x",
      medChecks: [],
      medicines: [null, 3],
      vitals: {},
      flags: null,
    };
    for (const version of [1, 2, 3, 0, 99]) {
      const out = migratePersisted(poison, version);
      expect(Array.isArray(out.intakes)).toBe(true);
      expect(Array.isArray(out.vitals)).toBe(true);
      expect(Array.isArray(out.flags)).toBe(true);
      expect(Array.isArray(out.medicines)).toBe(true);
      expect(Array.isArray(out.timings)).toBe(true);
      expect(out.medChecks).toEqual({});
      expect(out.intakes).toEqual([]);
      expect(out.vitals).toEqual([]);
      expect(out.flags).toEqual([]);
      expect(out.medicines).toEqual([]);
      // timings 非配列（キー欠損相当）→ 初期タイミング
      expect(out.timings).toEqual(initialAppData().timings);
    }
  });

  it("プロパティ参照自体が throw するオブジェクトでも初期データにフォールバックする", () => {
    const evil = {
      get intakes(): never {
        throw new Error("boom");
      },
    };
    for (const version of [1, 2, 3]) {
      expect(() => migratePersisted(evil, version)).not.toThrow();
      expect(migratePersisted(evil, version)).toEqual(initialAppData());
    }
  });
});

// ---------------------------------------------------------------------------

describe("recordDate 再導出（recordedAt の暦日が正）", () => {
  const nextDay = { recordDate: D, recordedAt: "2026-08-15T06:00" };

  it("recordDate と recordedAt の暦日が食い違えば recordedAt 側に揃える", () => {
    expect(normalizeIntake({ id: "a", kind: "water", ml: 100, ...nextDay })).toMatchObject({
      recordDate: D_NEXT,
      recordedAt: "2026-08-15T06:00",
    });
    expect(normalizeVital({ id: "b", ...nextDay })).toMatchObject({ recordDate: D_NEXT });
    expect(normalizeFlag({ id: "c", kind: "stool", ...nextDay })).toMatchObject({
      recordDate: D_NEXT,
    });
  });

  it("同一暦日ならそのまま", () => {
    const same = { recordDate: D, recordedAt: "2026-08-14T15:10" };
    expect(normalizeIntake({ id: "a", kind: "water", ml: 100, ...same })).toEqual({
      id: "a",
      kind: "water",
      ml: 100,
      ...same,
    });
    expect(normalizeVital({ id: "b", ...same })).toMatchObject(same);
    expect(normalizeFlag({ id: "c", kind: "meal", ...same })).toMatchObject(same);
  });

  it("recordedAt が不正でも recordDate が正しければ据え置き（文字列はそのまま残す）", () => {
    for (const recordedAt of ["2026-08-14 15:10", ""]) {
      const out = normalizeIntake({ id: "a", kind: "water", ml: 1, recordDate: D, recordedAt });
      expect(out).toMatchObject({ recordDate: D, recordedAt });
      expect(normalizeVital({ id: "b", recordDate: D, recordedAt })).toMatchObject({
        recordDate: D,
        recordedAt,
      });
      expect(normalizeFlag({ id: "c", kind: "stool", recordDate: D, recordedAt })).toMatchObject({
        recordDate: D,
        recordedAt,
      });
    }
    // 文字列でない recordedAt は "" に落ちるが recordDate は据え置き
    expect(
      normalizeIntake({ id: "a", kind: "water", ml: 1, recordDate: D, recordedAt: 123 })
    ).toMatchObject({ recordDate: D, recordedAt: "" });
  });

  it("recordedAt と recordDate の両方が不正なら捨てる", () => {
    const bad = { recordDate: "8/14", recordedAt: "bad" };
    expect(normalizeIntake({ id: "a", kind: "water", ml: 1, ...bad })).toBeNull();
    expect(normalizeVital({ id: "b", ...bad })).toBeNull();
    expect(normalizeFlag({ id: "c", kind: "stool", ...bad })).toBeNull();
    expect(normalizeIntake({ id: "a", kind: "water", ml: 1 })).toBeNull();
    expect(normalizeVital({ id: "b", recordDate: 20260814, recordedAt: null })).toBeNull();
  });

  it("秒付き recordedAt('…T15:10:00') も受け付けて暦日を導出する", () => {
    const out = normalizeIntake({
      id: "a",
      kind: "water",
      ml: 1,
      recordDate: "2026-08-13",
      recordedAt: "2026-08-14T15:10:00",
    });
    expect(out).toMatchObject({ recordDate: D, recordedAt: "2026-08-14T15:10:00" });
  });

  it("intake: ml は数値化、数値化できない/kind 不正は捨てる", () => {
    const base = { id: "a", recordDate: D, recordedAt: "2026-08-14T15:10" };
    expect(normalizeIntake({ ...base, kind: "water", ml: "150" })?.ml).toBe(150);
    expect(normalizeIntake({ ...base, kind: "urine", ml: 0 })?.ml).toBe(0);
    expect(normalizeIntake({ ...base, kind: "water", ml: "abc" })).toBeNull();
    expect(normalizeIntake({ ...base, kind: "water" })).toBeNull();
    expect(normalizeIntake({ ...base, kind: "tea", ml: 100 })).toBeNull();
    expect(normalizeFlag({ ...base, kind: "water" })).toBeNull();
  });

  it("vital: 数値の項目は文字列化、欠損は空文字", () => {
    const out = normalizeVital({
      id: "v",
      recordDate: D,
      recordedAt: "2026-08-14T15:00",
      temp: 36.5,
      bpSys: 120,
      bpDia: 80,
    });
    expect(out).toEqual({
      id: "v",
      recordDate: D,
      recordedAt: "2026-08-14T15:00",
      temp: "36.5",
      bpSys: "120",
      bpDia: "80",
      pulse: "",
      weight: "",
    });
    expect(normalizeVital({ id: "v", recordDate: D, recordedAt: "2026-08-14T15:00", pulse: null }))
      .toMatchObject({ pulse: "" });
  });

  it("id が欠けていれば非空の文字列を振る", () => {
    const out = normalizeIntake({ kind: "water", ml: 1, recordDate: D, recordedAt: "2026-08-14T15:10" });
    expect(typeof out?.id).toBe("string");
    expect(out?.id.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe("rebucketLegacyMedChecks（14時起点 → 暦日）", () => {
  it("0〜13時のチェックだけ翌暦日へ移動し、14時以降は据え置き", () => {
    expect(rebucketLegacyMedChecks({ [D]: { 朝: 8, 昼: 12, 晩: 19 } })).toEqual({
      [D]: { 晩: 19 },
      [D_NEXT]: { 朝: 8, 昼: 12 },
    });
  });

  it("境界: 13時は移動、14時は据え置き", () => {
    expect(rebucketLegacyMedChecks({ [D]: { 昼: 13, 晩: 14 } })).toEqual({
      [D]: { 晩: 14 },
      [D_NEXT]: { 昼: 13 },
    });
  });

  it("月末・年末をまたいで翌暦日へ", () => {
    expect(rebucketLegacyMedChecks({ "2026-08-31": { 朝: 8 } })).toEqual({
      "2026-09-01": { 朝: 8 },
    });
    expect(rebucketLegacyMedChecks({ "2026-12-31": { 朝: 8 } })).toEqual({
      "2027-01-01": { 朝: 8 },
    });
  });

  it("移動先が埋まっていれば元の日に据え置き（両方残す・削除しない）", () => {
    expect(
      rebucketLegacyMedChecks({ "2026-08-13": { 朝: 8 }, [D]: { 朝: 15 } })
    ).toEqual({ "2026-08-13": { 朝: 8 }, [D]: { 朝: 15 } });
  });

  it("移動先の別タイミングとは衝突せずマージされる", () => {
    expect(
      rebucketLegacyMedChecks({ "2026-08-13": { 朝: 8 }, [D]: { 晩: 19 } })
    ).toEqual({ [D]: { 朝: 8, 晩: 19 } });
  });

  it("連日の朝チェックはそれぞれ1日ずつ後ろへ（先に翌日側が空くので衝突しない）", () => {
    expect(
      rebucketLegacyMedChecks({ "2026-08-13": { 朝: 8 }, [D]: { 朝: 9 } })
    ).toEqual({ [D]: { 朝: 8 }, [D_NEXT]: { 朝: 9 } });
  });

  it("連鎖: 末尾が据え置き(15時)なら手前の日も順に据え置きになり何も動かない", () => {
    const input: MedChecks = {
      "2026-08-12": { 朝: 8 },
      "2026-08-13": { 朝: 9 },
      [D]: { 朝: 15 },
    };
    expect(rebucketLegacyMedChecks(input)).toEqual({
      "2026-08-12": { 朝: 8 },
      "2026-08-13": { 朝: 9 },
      [D]: { 朝: 15 },
    });
  });

  it("hour 0 も正当な値として移動し、空になった元の日付キーは残さない", () => {
    const out = rebucketLegacyMedChecks({ "2026-08-13": { 朝: 0 } });
    expect(out).toEqual({ [D]: { 朝: 0 } });
    expect(out).not.toHaveProperty("2026-08-13");
  });

  it("'YYYY-MM-DD' でない日付キーはそのまま据え置き", () => {
    expect(rebucketLegacyMedChecks({ today: { 朝: 8 } })).toEqual({ today: { 朝: 8 } });
  });

  it("キーの挿入順に結果が依存しない", () => {
    const a: MedChecks = {
      "2026-08-13": { 朝: 8 },
      [D]: { 朝: 15, 晩: 19 },
      [D_NEXT]: { 昼: 12 },
    };
    const b: MedChecks = {
      [D_NEXT]: { 昼: 12 },
      [D]: { 晩: 19, 朝: 15 },
      "2026-08-13": { 朝: 8 },
    };
    expect(Object.keys(a)).not.toEqual(Object.keys(b));
    const expected: MedChecks = {
      "2026-08-13": { 朝: 8 },
      [D]: { 朝: 15, 晩: 19 },
      "2026-08-16": { 昼: 12 },
    };
    expect(rebucketLegacyMedChecks(a)).toEqual(expected);
    expect(rebucketLegacyMedChecks(b)).toEqual(expected);
  });

  it("入力を破壊しない", () => {
    const input: MedChecks = { "2026-08-13": { 朝: 8 }, [D]: { 朝: 9, 晩: 19 } };
    const snapshot = structuredClone(input);
    rebucketLegacyMedChecks(input);
    expect(input).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------

describe("normalizeMedChecks", () => {
  it("数字文字列の hour は数値化する", () => {
    expect(normalizeMedChecks({ [D]: { 朝: "8" } })).toEqual({ [D]: { 朝: 8 } });
  });

  it("整数 0..23 以外の hour は除く", () => {
    expect(
      normalizeMedChecks({
        [D]: { a: null, b: 24, c: -1, d: 3.5, e: "abc", f: "", g: 12 },
      })
    ).toEqual({ [D]: { g: 12 } });
  });

  it("空になった日付は除く", () => {
    expect(normalizeMedChecks({ [D]: { 朝: null }, "2026-08-13": { 朝: 8 } })).toEqual({
      "2026-08-13": { 朝: 8 },
    });
  });

  it("hour 0 は残す", () => {
    expect(normalizeMedChecks({ [D]: { 朝: 0 } })).toEqual({ [D]: { 朝: 0 } });
    expect(normalizeMedChecks({ [D]: { 朝: "0" } })).toEqual({ [D]: { 朝: 0 } });
  });

  it("オブジェクトでない入力や日は捨てる", () => {
    expect(normalizeMedChecks(null)).toEqual({});
    expect(normalizeMedChecks([])).toEqual({});
    expect(normalizeMedChecks("x")).toEqual({});
    expect(normalizeMedChecks({ [D]: 8, "2026-08-13": [8], "2026-08-12": { 朝: 8 } })).toEqual({
      "2026-08-12": { 朝: 8 },
    });
  });
});

// ---------------------------------------------------------------------------

describe("normalizeTimings / normalizeTiming / normalizeWeekdays", () => {
  it("文字列配列 → 全曜日のオブジェクト", () => {
    expect(normalizeTimings(["朝", "昼", "晩"])).toEqual([
      { name: "朝", weekdays: ALL },
      { name: "昼", weekdays: ALL },
      { name: "晩", weekdays: ALL },
    ]);
  });

  it("オブジェクトはそのまま通す（冪等）", () => {
    const timings: Timing[] = [
      { name: "朝", weekdays: [1, 2, 3, 4, 5] },
      { name: "晩", weekdays: [0, 6] },
    ];
    expect(normalizeTimings(timings)).toEqual(timings);
    expect(normalizeTimings(normalizeTimings(timings))).toEqual(timings);
  });

  it("文字列とオブジェクトの混在", () => {
    expect(normalizeTimings(["朝", { name: "晩", weekdays: [5] }])).toEqual([
      { name: "朝", weekdays: ALL },
      { name: "晩", weekdays: [5] },
    ]);
  });

  it("weekdays は整数 0..6 のみ・重複除去・昇順", () => {
    expect(normalizeWeekdays([5, 1, 1, 7, -1, "3"])).toEqual([1, 5]);
  });

  it("weekdays 欠損・空・非配列は全曜日", () => {
    expect(normalizeWeekdays(undefined)).toEqual(ALL);
    expect(normalizeWeekdays([])).toEqual(ALL);
    expect(normalizeWeekdays([7, "x"])).toEqual(ALL);
    expect(normalizeWeekdays("1")).toEqual(ALL);
    expect(normalizeTiming({ name: "朝" })).toEqual({ name: "朝", weekdays: ALL });
    expect(normalizeTiming({ name: "朝", weekdays: [] })).toEqual({ name: "朝", weekdays: ALL });
  });

  it("名前が重複したら先勝ち", () => {
    expect(normalizeTimings(["朝", { name: "朝", weekdays: [1] }, "朝"])).toEqual([
      { name: "朝", weekdays: ALL },
    ]);
    expect(normalizeTimings([{ name: "朝", weekdays: [1] }, "朝"])).toEqual([
      { name: "朝", weekdays: [1] },
    ]);
  });

  it("空文字・null・数値・名前なしオブジェクトは除く", () => {
    expect(normalizeTiming("")).toBeNull();
    expect(normalizeTiming(null)).toBeNull();
    expect(normalizeTiming(7)).toBeNull();
    expect(normalizeTiming({ weekdays: [1] })).toBeNull();
    expect(normalizeTiming({ name: "", weekdays: [1] })).toBeNull();
    expect(normalizeTimings(["", null, 7, "昼"])).toEqual([{ name: "昼", weekdays: ALL }]);
  });

  it("timings キー欠損（非配列）は初期タイミング、[] は [] のまま", () => {
    expect(normalizeTimings(undefined)).toEqual([
      { name: "朝", weekdays: ALL },
      { name: "昼", weekdays: ALL },
      { name: "晩", weekdays: ALL },
    ]);
    expect(normalizeTimings(5)).toEqual(initialAppData().timings);
    expect(normalizeTimings([])).toEqual([]);
  });

  it("名前は trim しない（medChecks の結合キーと一致し続ける）", () => {
    expect(normalizeTiming("朝 ")).toEqual({ name: "朝 ", weekdays: ALL });
    const out = migratePersisted(
      v2Envelope({ timings: ["朝 "], medChecks: { [D]: { "朝 ": 15 } } }),
      2
    );
    expect(out.timings).toEqual([{ name: "朝 ", weekdays: ALL }]);
    expect(out.medChecks).toEqual({ [D]: { "朝 ": 15 } });
    // 8/14(金) は全曜日に含まれる → チェック済みとして結合できる
    expect(uncheckedTimings(out.timings, out.medChecks, D)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe("medicines（migrateV1toV2 / normalizeMedicine）", () => {
  it("migrateV1toV2: dose を分割し、既に v2 形式の項目はそのまま通す", () => {
    const out = migrateV1toV2({
      medicines: [
        { id: "a", name: "A", dose: "250mg", timings: ["昼"] },
        { id: "b", name: "B", dose: "1袋", timings: [] },
        { id: "c", name: "C", dose: "", timings: [] },
        { id: "d", name: "D", doseAmount: "3", doseUnit: "g", timings: ["朝"] },
      ],
      intakes: [{ id: "x" }],
    });
    expect(out.medicines).toEqual([
      { id: "a", name: "A", doseAmount: "250", doseUnit: "mg", timings: ["昼"] },
      { id: "b", name: "B", doseAmount: "1", doseUnit: "袋", timings: [] },
      { id: "c", name: "C", doseAmount: "", doseUnit: "錠", timings: [] },
      { id: "d", name: "D", doseAmount: "3", doseUnit: "g", timings: ["朝"] },
    ]);
    // 他のキーは触らない
    expect(out.intakes).toEqual([{ id: "x" }]);
  });

  it("migrateV1toV2: dose が文字列でない項目は空の量として扱う", () => {
    const out = migrateV1toV2({ medicines: [{ id: "a", name: "A", dose: 2, timings: [] }] });
    expect(out.medicines).toEqual([
      { id: "a", name: "A", doseAmount: "", doseUnit: "錠", timings: [] },
    ]);
  });

  it("medicines が undefined / null / 'x' / [null, 3] でも throw せず他は移行される", () => {
    for (const medicines of [undefined, null, "x", [null, 3]]) {
      const env = v1Envelope({ medicines });
      expect(() => migrateV1toV2(env)).not.toThrow();
      expect(migrateV1toV2(env).medicines).toEqual([]);

      const out = migratePersisted(env, 1);
      expect(out.medicines).toEqual([]);
      expect(out.intakes).toHaveLength(6);
      expect(byId(out.intakes, "vw4").recordDate).toBe(D_NEXT);
      expect(out.medChecks).toEqual({ [D_NEXT]: { 朝: 8 } });
      expect(out.timings.map((t) => t.name)).toEqual(["朝", "昼", "晩", "ねる前"]);
    }
  });

  it("normalizeMedicine: 不正な単位は錠、数値の量は文字列化", () => {
    expect(
      normalizeMedicine({ id: "a", name: "A", doseAmount: 2, doseUnit: "cc", timings: [] })
    ).toEqual({ id: "a", name: "A", doseAmount: "2", doseUnit: "錠", timings: [] });
    for (const unit of ["錠", "袋", "mg", "g"]) {
      expect(normalizeMedicine({ id: "a", doseUnit: unit })?.doseUnit).toBe(unit);
    }
  });

  it("normalizeMedicine: timings は文字列配列のみ（非配列→[]、非文字列要素は除く、孤児名は残す）", () => {
    expect(normalizeMedicine({ id: "a", timings: "朝" })?.timings).toEqual([]);
    expect(normalizeMedicine({ id: "a", timings: ["朝", 3] })?.timings).toEqual(["朝"]);
    expect(normalizeMedicine({ id: "a", timings: ["ねる前"] })?.timings).toEqual(["ねる前"]);
  });

  it("normalizeMedicine: id 欠損は非空文字列を振る。name 欠損は空文字", () => {
    const out = normalizeMedicine({ name: "A" });
    expect(typeof out?.id).toBe("string");
    expect(out?.id.length).toBeGreaterThan(0);
    expect(normalizeMedicine({ id: "a" })).toEqual({
      id: "a",
      name: "",
      doseAmount: "",
      doseUnit: "錠",
      timings: [],
    });
    expect(normalizeMedicine(null)).toBeNull();
    expect(normalizeMedicine("x")).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe("healAppData（形状のみ・レコードを捨てない）", () => {
  it("オブジェクトの記録はどんな内容でも件数を減らさない", () => {
    const garbage = [{}, { garbage: 1 }, { recordedAt: 5, recordDate: null, ml: "x" }];
    const out = healAppData({ intakes: garbage, vitals: garbage, flags: garbage });
    expect(out.intakes).toHaveLength(3);
    expect(out.vitals).toHaveLength(3);
    expect(out.flags).toHaveLength(3);
    // 内容は捨てないが、日付2項目だけは文字列に揃える（描画中の slice で throw しないため）
    expect(out.intakes).toEqual([
      { recordedAt: "", recordDate: "" },
      { garbage: 1, recordedAt: "", recordDate: "" },
      { ml: "x", recordedAt: "", recordDate: "" },
    ]);
  });

  it("日付2項目が文字列ならそのまま残す", () => {
    const rec = { id: "a", kind: "water", ml: 1, recordedAt: "2026-08-14T15:10", recordDate: "2026-08-14" };
    expect(healAppData({ intakes: [rec] }).intakes).toEqual([rec]);
  });

  it("配列中のオブジェクトでない要素だけ除く", () => {
    const out = healAppData({ intakes: [null, 3, "x", { id: "a" }] });
    expect(out.intakes).toEqual([{ id: "a", recordedAt: "", recordDate: "" }]);
  });

  it("文字列 timings はオブジェクトに直す", () => {
    expect(healAppData({ timings: ["朝", "ねる前"] }).timings).toEqual([
      { name: "朝", weekdays: ALL },
      { name: "ねる前", weekdays: ALL },
    ]);
  });

  it("null / undefined / 非オブジェクトは初期データ", () => {
    expect(healAppData(null)).toEqual(initialAppData());
    expect(healAppData(undefined)).toEqual(initialAppData());
    expect(healAppData("x")).toEqual(initialAppData());
    expect(healAppData([])).toEqual(initialAppData());
  });

  it("空オブジェクトからでも6キーとも配列/オブジェクトで揃う", () => {
    const out = healAppData({});
    expect(out).toEqual(initialAppData());
    const broken = healAppData({
      intakes: "x",
      vitals: 1,
      flags: null,
      medChecks: [],
      timings: 5,
      medicines: {},
    });
    expect(broken).toEqual(initialAppData());
  });

  it("v2 シードはそのままの件数で通り、timings だけ補修される", () => {
    const out = healAppData(v2Envelope());
    expect(out.intakes).toEqual(v2Envelope().intakes);
    expect(out.vitals).toEqual(v2Envelope().vitals);
    expect(out.flags).toEqual(v2Envelope().flags);
    expect(out.medicines).toEqual(v2Envelope().medicines);
    expect(out.medChecks).toEqual({ [D]: { 朝: 8 } });
    expect(out.timings.map((t) => t.name)).toEqual(["朝", "昼", "晩", "ねる前"]);
  });
});

// ---------------------------------------------------------------------------

describe("冪等性", () => {
  it("normalizeAppData を2回かけても結果は変わらない", () => {
    const x = v2Envelope({
      intakes: [
        ...v2Envelope().intakes,
        { id: "s1", kind: "water", ml: "150", recordDate: D, recordedAt: "2026-08-14T15:10" },
        { id: "bad", kind: "tea", ml: 1, recordDate: D, recordedAt: "2026-08-14T15:10" },
      ],
      medChecks: { [D]: { 朝: "8", 昼: null }, "2026-08-13": { 晩: 19 } },
      timings: ["朝", { name: "晩", weekdays: [5, 1, 1, 7] }],
      medicines: [{ id: "m", name: "A", doseAmount: 2, doseUnit: "cc", timings: ["朝", 3] }],
    });
    const once = normalizeAppData(x);
    expect(normalizeAppData(once)).toEqual(once);
    expect(normalizeAppData(normalizeAppData(once))).toEqual(once);
  });

  it("healAppData も冪等", () => {
    const once = healAppData(v2Envelope());
    expect(healAppData(once)).toEqual(once);
  });

  it("initialAppData は毎回新しい配列/オブジェクトを返す", () => {
    const a = initialAppData();
    const b = initialAppData();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.intakes).not.toBe(b.intakes);
    expect(a.vitals).not.toBe(b.vitals);
    expect(a.flags).not.toBe(b.flags);
    expect(a.medChecks).not.toBe(b.medChecks);
    expect(a.timings).not.toBe(b.timings);
    expect(a.timings[0]).not.toBe(b.timings[0]);
    expect(a.timings[0].weekdays).not.toBe(b.timings[0].weekdays);
    expect(a.medicines).not.toBe(b.medicines);
  });
});
