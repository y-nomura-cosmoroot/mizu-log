import { expect, test, type Page } from "@playwright/test";
import { openSeeded } from "./visual-helpers";

// localStorage(zustand persist)の版移行 E2E（chromium プロジェクト）。
// 移行ロジック本体は src/lib/migrate.ts（単体テストは src/lib/__tests__/migrate.test.ts）。
// ここでは「旧エンベロープを注入して起動したとき、画面と localStorage がどうなるか」だけを見る。
// 時刻は visual-helpers の openSeeded が T0 = 2026-08-14(金) 15:00+09:00 に固定する。
//
// persist の挙動（zustand 5）: version が数値かつ現在(3)と不一致なら migrate → 描画前に書き戻し。
// version が無い（数値でない）エンベロープは migrate を通らず merge(healAppData) だけで、
// 書き戻しは次の store 書き込みまで起きない（テスト4 で1回記録してから localStorage を読む理由）。

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

/** 旧モデル(v2, 記録日=14時起点)のエンベロープ state。0〜13時の記録は「記録日の翌暦日」の recordedAt を持つ */
const V2_STATE = {
  intakes: [
    // 旧記録日 8/13 の「翌朝6時」→ 暦日では 8/14（帯1）
    { id: "m1", kind: "water", ml: 120, recordDate: "2026-08-13", recordedAt: "2026-08-14T06:00" },
    // 8/14 15:10（帯2）
    { id: "m2", kind: "water", ml: 150, recordDate: "2026-08-14", recordedAt: "2026-08-14T15:10" },
    // 8/13 18:00 → 暦日でも 8/13
    { id: "m3", kind: "water", ml: 500, recordDate: "2026-08-13", recordedAt: "2026-08-13T18:00" },
  ],
  vitals: [],
  flags: [],
  medChecks: {
    // 朝:8 と 昼:12 は 0〜13時 → 暦日では 8/14 の分。ただし 8/14 の 朝 は既に 15 で埋まっている（衝突）
    "2026-08-13": { 朝: 8, 晩: 19, 昼: 12 },
    "2026-08-14": { 朝: 15 },
  },
  timings: ["朝", "昼", "晩"],
  medicines: [
    { id: "mm1", name: "タケキャブ", doseAmount: "1", doseUnit: "錠", timings: ["朝"] },
  ],
};

interface StoredEnvelope {
  version?: number;
  state: {
    intakes: Array<{ id: string; recordDate: string; recordedAt: string; ml: number }>;
    medChecks: Record<string, Record<string, number>>;
    timings: unknown[];
    medicines: Array<Record<string, unknown>>;
  };
}

/** "mizu-log" の version（未保存なら null）。expect.poll で書き戻し完了を待つのに使う */
function storedVersion(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("mizu-log");
    if (!raw) return null;
    const v = (JSON.parse(raw) as { version?: unknown }).version;
    return typeof v === "number" ? v : null;
  });
}

/** localStorage のエンベロープを読む（無ければテスト失敗） */
async function readEnvelope(page: Page, key: string): Promise<StoredEnvelope> {
  const raw = await page.evaluate((k) => localStorage.getItem(k), key);
  expect(raw, `localStorage["${key}"] が存在しない`).not.toBeNull();
  return JSON.parse(raw as string) as StoredEnvelope;
}

test.describe("localStorage 版移行", () => {
  test("v2→v3: 起動時に移行され、記録は暦日基準で並び直し、旧データは退避される", async ({
    page,
  }) => {
    await openSeeded(page, "/", { version: 2, state: V2_STATE });

    // 飲水: m1(8/14 6時) が 8/14 へ移り 120+150。6時=帯1・15時=帯2、帯3 は記録なし
    await expect(page.getByTestId("water-day-total")).toHaveText("270ml");
    await expect(page.getByTestId("subtotal-w1")).toHaveText("120");
    await expect(page.getByTestId("subtotal-w2")).toHaveText("150");
    await expect(page.getByTestId("subtotal-w3")).toHaveText("—");

    // おくすり: 昼:12 は 8/13→8/14 へ移動、朝:15 は据え置き → 8/14 は 朝・昼 の 2/3
    await page.getByTestId("nav-meds").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("2 / 3 かんりょう");

    // 履歴(おくすり) 8/14: 12時に昼、15時に朝
    await page.getByTestId("nav-history").click();
    await page.getByTestId("hist-sub-meds").click();
    await expect(page.getByTestId("meds-hour-row-12")).toContainText("昼");
    await expect(page.getByTestId("meds-hour-row-15")).toContainText("朝");

    // 8/13: 朝:8 は移動先 (8/14, 朝) が埋まっていたので元の日に据え置き（削除されない）。
    // 晩:19 も残る。昼 が未チェック → ⚠️
    await page.getByTestId("prev-day").click();
    await expect(page.getByTestId("date-label")).toContainText("8/13(木)");
    await expect(page.getByTestId("meds-hour-row-8")).toContainText("朝");
    await expect(page.getByTestId("meds-hour-row-19")).toContainText("晩");
    await expect(page.getByTestId("meds-result-card")).toHaveAttribute("data-ok", "false");

    // localStorage: 移行結果が version 3 で書き戻されている
    await expect.poll(() => storedVersion(page)).toBe(3);
    const env = await readEnvelope(page, "mizu-log");
    expect(env.version).toBe(3);
    expect(env.state.intakes.find((x) => x.id === "m1")?.recordDate).toBe("2026-08-14");
    expect(env.state.medChecks["2026-08-14"]).toEqual({ 朝: 15, 昼: 12 });
    expect(env.state.medChecks["2026-08-13"]).toEqual({ 朝: 8, 晩: 19 });
    expect(env.state.timings[0]).toEqual({ name: "朝", weekdays: ALL_WEEKDAYS });

    // 退避: 移行前の生エンベロープが "mizu-log.bak.v2" にそのまま残る
    const bak = await readEnvelope(page, "mizu-log.bak.v2");
    expect(bak.version).toBe(2);
    expect(bak.state.medChecks).toEqual(V2_STATE.medChecks);
    expect(bak.state.intakes.find((x) => x.id === "m1")?.recordDate).toBe("2026-08-13");
    expect(bak.state.timings).toEqual(["朝", "昼", "晩"]);
  });

  test("v1→v3 チェーン: dose 文字列が分割される", async ({ page }) => {
    await openSeeded(page, "/?tab=meds", {
      version: 1,
      state: {
        intakes: [],
        vitals: [],
        flags: [],
        medChecks: {},
        timings: ["朝"],
        medicines: [{ id: "x", name: "タケキャブ", dose: "1mg", timings: ["朝"] }],
      },
    });

    // v1→v2 で dose "1mg" → doseAmount "1" + doseUnit "mg"、v2→v3 で timings が曜日付きに
    await page.getByTestId("toggle-master").click();
    await expect(page.getByTestId("med-name-0")).toHaveValue("タケキャブ");
    await expect(page.getByTestId("med-dose-0")).toHaveValue("1");
    await expect(page.getByTestId("med-unit-0")).toHaveValue("mg");

    await expect.poll(() => storedVersion(page)).toBe(3);
    const env = await readEnvelope(page, "mizu-log");
    expect(env.state.medicines[0]).toMatchObject({ doseAmount: "1", doseUnit: "mg" });
    expect(env.state.medicines[0]).not.toHaveProperty("dose");
    expect(env.state.timings[0]).toEqual({ name: "朝", weekdays: ALL_WEEKDAYS });

    const bak = await readEnvelope(page, "mizu-log.bak.v1");
    expect(bak.version).toBe(1);
    expect(bak.state.medicines[0]).toMatchObject({ dose: "1mg" });
  });

  test("未知の version でも記録は消えない", async ({ page }) => {
    // v3 形状（recordDate = recordedAt の暦日）だが timings は文字列のまま、version は未来の 99
    const v3Shaped = {
      ...V2_STATE,
      intakes: V2_STATE.intakes.map((x) => ({ ...x, recordDate: x.recordedAt.slice(0, 10) })),
    };
    await openSeeded(page, "/", { version: 99, state: v3Shaped });

    // 記録は保持される（m1 は 8/14 6時なので 120+150）
    await expect(page.getByTestId("water-day-total")).toHaveText("270ml");

    // medChecks は再配置されない（再配置は v1|v2 経由のみ）。8/14 は 朝:15 だけ
    await page.getByTestId("nav-meds").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("1 / 3 かんりょう");

    // localStorage: 形状正規化だけ行い version 3 で書き戻す（初期化しない）
    await expect.poll(() => storedVersion(page)).toBe(3);
    const env = await readEnvelope(page, "mizu-log");
    expect(env.state.intakes).toHaveLength(3);
    expect(env.state.medChecks).toEqual(V2_STATE.medChecks);
    expect(env.state.timings).toEqual([
      { name: "朝", weekdays: ALL_WEEKDAYS },
      { name: "昼", weekdays: ALL_WEEKDAYS },
      { name: "晩", weekdays: ALL_WEEKDAYS },
    ]);
  });

  test("version なしのエンベロープでも白画面にならない", async ({ page }) => {
    await openSeeded(page, "/", { state: V2_STATE });
    await expect(page.getByTestId("date-label")).toBeVisible();

    // migrate は通らず merge(healAppData) で文字列 timings が {name, weekdays} に直され、曜日判定が動く。
    // medChecks は据え置き（8/14 は 朝:15 のみ）
    await page.getByTestId("nav-meds").click();
    await expect(page.getByTestId("meds-progress")).toBeVisible();
    await expect(page.getByTestId("meds-progress")).toHaveText("1 / 3 かんりょう");

    // version 不一致ではないので起動時の書き戻しは無い → 1回チェックして persist に書かせる
    await page.getByTestId("drank-btn-昼").click();
    await expect(page.getByTestId("meds-progress")).toHaveText("2 / 3 かんりょう");

    await expect.poll(() => storedVersion(page)).toBe(3);
    const env = await readEnvelope(page, "mizu-log");
    expect(env.state.timings[0]).toEqual({ name: "朝", weekdays: ALL_WEEKDAYS });
    expect(env.state.intakes).toHaveLength(3);
    expect(env.state.medChecks["2026-08-14"]).toEqual({ 朝: 15, 昼: 15 });
  });
});
