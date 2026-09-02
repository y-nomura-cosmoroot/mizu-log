# 記録日を暦日（0時起点）へ変更 + 内服タイミングの曜日指定

## Context

- 現状の記録日は **14:00〜翌13:59**（紙の記録表と同じ）。小計帯は 14〜21 / 22〜翌5 / 翌6〜13。
  これを **0:00〜23:59 の暦日**に変え、小計帯を **0〜7時 / 8〜15時 / 16〜23時**（8時間×3）にする。
  既存の localStorage データ（zustand persist v2）は壊さず暦日基準に読み替える。
- 内服タイミング（朝/昼/晩…）に **有効曜日（月〜日）** を持たせる。「朝＝月水金」なら
  その曜日だけチェック対象になり、飲み忘れ判定もそれに従う。既存データ（曜日なし）は全曜日。
- 記録日の切替は `src/lib/time.ts` に集約されているため中核は小さいが、時刻ドロップダウン
  （きょう/よくじつ 2段）・帯ラベル・助言ロジック・全テスト・ドキュメントに波及する。

## 確定事項（ユーザ回答 2026-09-02）

| 論点 | 決定 |
|---|---|
| 曜日の下限 | **最低1曜日は必須**。最後の1つはタップしても外れず、トースト「曜日は 1つ以上 えらんでください」 |
| 対象外の日の表示 | **薄く表示**。「のんだ！」ボタンは出さない。分母・飲み忘れ判定から除外。既にチェック済みなら ✓ を表示し**解除だけ**できる。チェック行には全タイミングにマスタと同じ月〜日チップを表示専用で並べ（表示中の日はリング）、曜日指定があるものにだけ「きょうは ◯よう日だからのむ日 / のまない日」の一文を出す（曜日と判定を同じ強調。毎日のタイミングは曜日で変わらないので一文なし。ユーザ指示 2026-09-02） |
| 移行前の退避 | **退避する**。`mizu-log.bak.v<旧version>` に1回だけ生エンベロープを保存（UIなし・失敗しても無視） |
| 帯の目安量 | **0〜7時:300 / 8〜15時:850 / 16〜23時:850**（合計 2000 = GOAL_ML） |

## 設計判断（Claude 判断・理由付き）

- **帯ラベル**は既存流儀に合わせ `"0〜7時" / "8〜15時" / "16〜23時"`（8時・16時は後ろの帯。`h<8→1, h<16→2, else 3`）
- **recordDate は recordedAt の暦日から再導出**（`recordedAt` が正、`recordDate` は派生キャッシュという既存設計どおり）。旧UIで「翌日側 3時」に先行記録した分は翌暦日に移り、その日が来るまで表示されないが**消えない**（正しい日付に出る）
- **medChecks の 0〜13時のチェックは翌暦日へ移動**。移動先の (日付, タイミング) が既に埋まっている場合は**元の日に据え置く（削除しない）**。旧記録日の午前と午後で同じタイミングを二重チェックした稀なケースのみ発生し、1件が1日ずれて残るだけでデータは失われない
- **未知／未来の version は初期化しない**。zustand persist は `version !== 現在` で `migrate` を呼び結果を**描画前に即書き戻す**ため、初期値を返すと全消去になる。形状正規化のみ行う
- **`migrate` も `merge` も絶対に throw しない**。throw すると `setHasHydrated(true)` に到達せず永久に白画面（`AppShell` は `ready && hasHydrated` でゲート）
- **2層構造**: `healAppData`（冪等・非破壊・形状のみ。`merge` で毎回実行）と `normalizeAppData`（heal + recordDate 再導出 + 不正レコード除去。`migrate` 内のみ）。medChecks の再配置は version 1|2 経由でのみ1回実行（冪等でない）
- **タイミング名は結合キー**（medChecks / Medicine.timings / testid / movedTiming）。正規化で名前を trim・書き換えしない
- `HOUR_CYCLE` / `hourOrder` / `RECORD_DAY_START_HOUR` は**削除**。`HOURS = [0..23]`、時刻ソートは `(a,b)=>a-b`
- **助言バブルの「促す」判定は最終飲水を暦日横断で探す**（前日 23:50 に飲んで当日 3:00 に開いたときに誤って促さない。旧モデルでは同一記録日だったため起きなかった）
- **日付跨ぎ追従（追加提案）**: `AppShell` は起動時に1回しか今日を計算しない。0時境界では「開いたまま寝て朝に使う」端末が**前日の日付に記録し続ける**ため、`visibilitychange`（表示復帰）と60秒間隔で今日を再計算し、「今日」を表示中なら表示日・時刻を追従させる
- **デザインモックは据え置き**（Claude Design 出力・gitignore 済み）。`docs/plans/02` の意図的差分表に #6（曜日UI）#7（時刻セレクタ1ブロック・帯ラベル）を追加し、CLAUDE.md にも「差分は表が正」と明記
- 死コード `medsForTiming` / `doseLabel`（lib/meds.ts）は触らない（スコープ外）
- 飲み忘れバナーが 0:30 に「朝・昼・晩 がまだです」と出るのは、旧モデルで 14:05 に出ていたのと同じ既存挙動。変更しない
- **既知の副作用**: 深夜0時以降に飲んだ「ねる前」は翌日の記録になる。README に「日付が変わってから飲んだ分は ‹ で前の日に戻ってチェック」と運用注記（UI追加はしない）

## 実装手順

### Phase 0: 計画の保存

- この計画を `docs/plans/04-calendar-day-and-timing-weekdays.md` にコピー（Plan モード中は編集不可のため承認後に実施）

### Phase 1: 純粋ロジック + 単体テスト（UI無し、`npm run test` で確認）

**[src/lib/time.ts](../../src/lib/time.ts)**

- `getRecordDate(now) = formatCalendarDate(now)`、`toRecordedAt(date,h,m) = \`${date}T${pad2(h)}:${pad2(m)}\``、`elapsedMinutesInRecordDay(h,m) = h*60+m`（名前は維持）、`band(h)`: `h<8→1 / h<16→2 / else 3`
- 削除: `RECORD_DAY_START_HOUR`、`HOUR_CYCLE`、`hourOrder`
- 追加: `HOURS: ReadonlyArray<number> = [0..23]`、`WEEKDAY_LABELS`（旧 `YOBI` を export・日曜始まり）、`weekdayIndexOf(recordDate): Weekday`、`parseRecordedAt(recordedAt): Date`（ローカル naive）
- `formatDateLabel` / `weekdayOf` は `weekdayIndexOf` 経由に

**[src/lib/constants.ts](../../src/lib/constants.ts)**

- `BAND_DEFS` ラベル → `0〜7時 / 8〜15時 / 16〜23時`、コメント「記録日=暦日」
- 追加: `ALL_WEEKDAYS: readonly Weekday[] = [0..6]`、`WEEKDAY_ORDER: readonly Weekday[] = [1,2,3,4,5,6,0]`（表示順 月→日。保存値は `Date#getDay` 索引）

**[src/types/records.ts](../../src/types/records.ts)**

- 追加: `export type Weekday = 0|1|2|3|4|5|6;`、`export interface Timing { name: string; weekdays: Weekday[] }`（昇順・重複なし・空にしない）
- `AppData.timings: Timing[]`。`Medicine.timings: string[]`（名前）と `MedChecks` は不変
- コメント修正: L1（暦日）、L9（recordedAt の暦日 = recordDate）

**[src/lib/meds.ts](../../src/lib/meds.ts)**

- 追加: `makeTiming(name, weekdays = ALL_WEEKDAYS)`、`timingNames(timings)`、`isTimingActiveOn(t, date)`（`t.weekdays.includes(weekdayIndexOf(date))`）、`activeTimings(timings, date)`
- `uncheckedTimings(timings: Timing[], medChecks, date): string[]` → `activeTimings` で絞ってから未チェックを返す（HomeTab バナー / MedsHistory 判定 / 月ごと⚠️ の3経路がここ1箇所で曜日対応）
- `groupMedChecksByBandHour(timings: Timing[], ...)` → **全タイミング名**を対象（対象外曜日の実績も履歴には出す）、時刻ソート `(a,b)=>a-b`
- `sortMedicines(medicines, names: string[])` は不変（呼び出し側が `timingNames` を渡す）

**[src/lib/aggregate.ts](../../src/lib/aggregate.ts)**

- `hourOrder` import 削除、L78/L179 のソートを `(a,b)=>a-b`
- `buildMonthlySummary(..., timings: Timing[], ...)` 型変更のみ（日ごとに `uncheckedTimings` へ date を渡しているので曜日は自動で効く）

**[src/lib/intakeAdvice.ts](../../src/lib/intakeAdvice.ts)**

- `export const BAND_TARGET_ML = { 1: 300, 2: 850, 3: 850 }`（export して合計 === GOAL_ML の不変条件テスト）
- 「促す」判定: `intakes` の water で `recordedAt <= now文字列` の最大値を取り、`now` との実経過分で判定。記録が1件も無いときだけ 0:00 起点にフォールバック
- 帯ペース判定（`% BAND_MINUTES`、`band(now.getHours())`）はそのまま（0:00 は帯境界かつ記録日開始）

**単体テスト**

- [time.test.ts](../../src/lib/__tests__/time.test.ts): 全面書き換え（暦日、band 境界 7/8・15/16・23/0、HOURS、toRecordedAt が日付を跨がない、weekdayIndexOf 7日分、WEEKDAY_LABELS 整合）。HOUR_CYCLE/hourOrder の describe 削除
- [aggregate.test.ts](../../src/lib/__tests__/aggregate.test.ts): `intake()/vital()/flag()` の `h<14 ? "2026-08-15"` ハックを撤去、帯インデックス期待値を再導出（15時→groups[1]、3時→groups[0]）、`buildMonthlySummary` に曜日ケース追加（晩=[1] のとき 8/10(月) ⚠️ / 8/12(水) ⚠️なし / 朝=[0] のみのとき 8/10 記録ありでも ⚠️なし）
- [meds.test.ts](../../src/lib/__tests__/meds.test.ts): `TIMINGS` を Timing 化、`isTimingActiveOn` / `activeTimings` / `makeTiming`、`uncheckedTimings` に「対象外は未チェックでも含めない」「対象外のチェック実績は影響しない」、`groupMedChecksByBandHour` 帯再割当（{朝8,昼12,晩19} → [empty, [8,12], [19]]）＋「対象外でも実績は出る」＋「hour 0 は帯1」
- [intakeAdvice.test.ts](../../src/lib/__tests__/intakeAdvice.test.ts): 数値を `BAND_TARGET_ML[n]` でパラメタ化、帯境界 8:00/16:00 の1時間抑制、「6:30 に 200ml は注意にならない」、「前日 23:50 飲水 → 当日 3:00 は促さない／6時間空けば促す」、記録なし 3:00 → 促す、合計不変条件

### Phase 2: 移行モジュールとストア

**新規 [src/lib/migrate.ts](../../src/lib/migrate.ts)**（React・store 非依存。import は types / constants / `parseDoseText` / `addDays` / `newId` のみ）

```ts
export const PERSIST_VERSION = 3;
const LEGACY_DAY_START_HOUR = 14;            // 移行専用
export function initialAppData(): AppData    // 毎回新しい配列。timings は DEFAULT_TIMINGS を makeTiming
export function healAppData(raw): AppData    // 冪等・非破壊: 欠損キー→既定値、string timing→object、weekdays 整形(整数0..6 dedupe 昇順、空/非配列→ALL)、名前は書き換えない、レコードは1件も捨てない
export function normalizeAppData(raw): AppData // heal + recordDate := recordedAt.slice(0,10)（/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ 前方一致時）+ 型不正レコードの除去（kind 不正・ml 非有限・両日付不正、hour が 0..23 の整数でない medChecks）
export function rebucketLegacyMedChecks(checks): MedChecks // pass1: hour>=14 と日付キー不正は据え置き / pass2: hour<14 を addDays(date,1) へ、埋まっていれば元の日に据え置き。空になった日は削除。入力は変更しない
export function migrateV1toV2(data)          // medicines が配列でなくても throw しない。dose 文字列は parseDoseText、既に doseAmount を持つ要素は素通し
export function migrateV2toV3(data): AppData // normalizeAppData → medChecks を rebucket
export function migratePersisted(persisted, version): AppData
  // try { 非オブジェクト→initialAppData; v1→V1toV2→V2toV3; v2→V2toV3; それ以外→normalizeAppData（再配置しない） } catch { normalizeAppData → 失敗時 initialAppData }
```

- hour 判定は必ず `Number.isInteger(h) && h >= 0 && h <= 23`、空判定は `Object.keys(x).length === 0`（**hour 0 は正当な値**。falsy 判定禁止）
- ファイル冒頭コメント: 「migrate/merge は絶対に throw しない（白画面）」「rebucket は冪等でないので version 1|2 経由のみ」

**[src/stores/useAppStore.ts](../../src/stores/useAppStore.ts)**

- インライン `initialData` / `migrate` / `parseDoseText` import を撤去し `initialAppData()` を spread
- persist: `version: PERSIST_VERSION`、`migrate: (p, v) => { snapshotLegacy(p, v); return migratePersisted(p, v); }`、`merge: (p, c) => { try { return { ...c, ...healAppData(p) }; } catch { return c; } }`（`set(state, true)` の replace モードなので `...c` を先に）
- `snapshotLegacy(persisted, version)`: `localStorage.getItem("mizu-log.bak.v"+version)` が無ければ `JSON.stringify({state: persisted, version})` を保存。全体 try/catch、`typeof localStorage` ガード
- `addTiming(name)` → 名前で dedupe（`some(t => t.name === v)`）し `makeTiming(v)` を push。`removeTiming(name)` → 名前で filter（薬タグからの除去はそのまま）。`moveTiming` 不変
- 追加 `toggleTimingWeekday(name, weekday)`: ON かつ `weekdays.length === 1` なら `s` を返す（最後の1つは外せない）。それ以外は add/remove して昇順維持
- `onRehydrateStorage` の脇にコメント: 「hasHydrated を立てる経路は必ず setItem を伴うため、ここでエラー回復すると未移行データを上書きする。migrate を total にするのが唯一の対策」

**単体テスト 新規 [src/lib/__tests__/migrate.test.ts](../../src/lib/__tests__/migrate.test.ts)**（node 環境、関数直呼び）

- ディスパッチ: 非オブジェクト→初期値 / v1 チェーン（dose 分割 + 暦日化 + rebucket + 曜日付与） / v2 / v3（再配置しない） / version 0・99（レコード保持・再配置しない） / 毒入り形状でも throw しない・6キー全部が配列 or オブジェクト
- recordDate 再導出: 翌暦日レコード→移動、同日→不変、recordedAt 不正＋recordDate 正→据え置き、両不正→除去、秒付き→受理、ml "150"→150、kind 不正→除去
- rebucket: 基本移動、境界 13/14、月末・年末跨ぎ、**衝突は元の日に据え置き**（`{8/13:{朝:8}, 8/14:{朝:15}}` → 両方残る）、非衝突マージ、連鎖 `{8/13:{朝:8}, 8/14:{朝:9}}` → `{8/14:{朝:8}, 8/15:{朝:9}}`、**hour 0 の移動**、hour "8"→8、不正 hour 除去、空日削除、日付キー不正は据え置き、順序非依存、入力非破壊
- timings: string→object 全7曜日、object 素通し（冪等）、weekdays `[5,1,1,7,-1,"3"]`→`[1,5]`、欠損/空→ALL、名前重複は先勝ち、`timings: []` は `[]`、**名前は trim しない**（`"朝 "` と medChecks キー `"朝 "` の整合を確認）
- medicines: v1 `medicines` が undefined / null / "x" / `[null, 3]` でも throw せず他は移行、`doseUnit` 不正→"錠"、`timings` 非配列→[]
- `healAppData` はレコード数を減らさない、`normalizeAppData(normalizeAppData(x))` が冪等、`initialAppData()` が毎回新配列

### Phase 3: UI（実装 → ユーザ目視確認 → OK 後にテスト）

**時刻セレクタ [src/components/Header.tsx](../../src/components/Header.tsx) / [Header.module.css](../../src/components/Header.module.css)**

- `HOURS.map(hourChip)` の1ブロック（4列×6行 = 帯ごとに2行）。「よくじつ」セクション・`addDays` import・`hourChip` の `isTodaySide` 引数・`data-side` を削除
- CSS: `.sectionLabelNext` `.hourGridNext` `.hourChip[data-side=…]` を削除し、`.hourChip` に `background: var(--c-primary-100); color: var(--c-primary-700)` を統合（`[data-selected]` `[data-now]` は後ろのまま）。`.hourGrid` padding `10px 14px 14px`

**[src/stores/useUiStore.ts](../../src/stores/useUiStore.ts)**

- `selHour` 初期値 0、`stepSelHour` → `(s.selHour + delta + 24) % 24`、`HOUR_CYCLE` import 削除
- 追加: `todayKey: RecordDate`（`init` で設定）、`syncDay(now)`: 今日が変わっていて `viewDate === 旧todayKey` なら `viewDate`/`selHour` を追従、そうでなければ `todayKey` のみ更新

**[src/components/AppShell.tsx](../../src/components/AppShell.tsx)**

- `init` 後の `useEffect` で `document.visibilitychange`（visible 時）と `setInterval(60_000)` から `syncDay(new Date())`。クリーンアップあり

**タイミングマスタ [src/components/meds/TimingMasterCard.tsx](../../src/components/meds/TimingMasterCard.tsx) / [TimingMasterCard.module.css](../../src/components/meds/TimingMasterCard.module.css)**

- 行を2段ブロックに: 外側 `div`（`data-testid="timing-master-row-${t.name}"` と `medsStyles.isMoved` は**外側に残す**＝rowpop テスト維持）→ `.rowMain`（≡ 名前 ↑ ↓ けす、testid 不変）＋ `.weekdayGrid`（`repeat(7, 1fr)`、`WEEKDAY_ORDER` の順）
- チップ: `<button type="button" data-testid={\`timing-weekday-${t.name}-${wd}\`} data-on={on} aria-pressed={on}>{WEEKDAY_LABELS[wd]}</button>`。最後の1つを外そうとしたら `showToast("曜日は 1つ以上 えらんでください")`（store は変更しない）
- CSS（tokens のみ、`[data-on="true"]` は `"false"` の**後**に書く）:
  `.row { display:flex; flex-direction:column; gap:8px; background:var(--c-surface-soft); border-radius:var(--r-12); padding:9px 12px }`、
  `.weekdayChip { border:1.5px solid transparent; border-radius:var(--r-pill); width:100%; box-sizing:border-box; padding:7px 0; font-size:var(--fs-12); font-weight:var(--fw-bold) }`、
  OFF `background:#fff; border-color:var(--c-line-input); color:var(--c-muted-500)`、ON `background:var(--c-primary-500); color:#fff; font-weight:var(--fw-black)`
  （行内幅 338px ÷ 7 ≈ 44px。薬タグ `.tagOn/.tagOff` と同じ配色）
- `add()` の dedupe を `timings.some(t => t.name === v)` に、`markMovedTiming(timings[i].name)`

**きょうの分 [src/components/meds/MedsTab.tsx](../../src/components/meds/MedsTab.tsx) / [TimingCheckRow.tsx](../../src/components/meds/TimingCheckRow.tsx)**

- `const active = activeTimings(timings, viewDate)`（曜日は **viewDate** から。`new Date()` は使わない）。進捗 `done / active.length`（done は active のチェック数）。行は**マスタ順で全タイミング**を出し、対象外には `inactive` を渡す
- `TimingCheckRow({ timing: Timing, inactive })`: `inactive` なら root に `data-inactive="true"`（薄色 CSS）、「のんだ！」ボタン非表示。`inactive && checked` のときだけ ✓ ボタンを出して解除できる。行は `.rowMain` + `.dayLine`（`weekdays.length < 7` のときだけ。`timing-day-label-<name>`、`data-on` で のむ日/のまない日、曜日と判定は同じ `.dayEmph`）+ `.weekdayChips`（常時。`timing-row-weekday-<name>-<wd>` に `data-on` / `data-today`）
- `active.length === 0 && timings.length > 0` のとき `data-testid="meds-empty-note"`「この日は のむおくすりが ありません」を行の上に表示（`panel` + module override）

**[src/components/meds/MedicineMasterCard.tsx](../../src/components/meds/MedicineMasterCard.tsx)**: `const names = timingNames(timings)` を `sortMedicines` とタグ行に（曜日で絞らない）

**[src/components/history/MedsHistory.tsx](../../src/components/history/MedsHistory.tsx)**: 呼び出しは型が流れるだけ。`activeTimings(...).length === 0` のとき結果カードを 🗓「のむおくすりの ない日」「この日は のむおくすりが ありません」（`data-ok` は true のまま、CSS セレクタ互換）

**[HomeTab.tsx](../../src/components/home/HomeTab.tsx) / [MonthlyHistory.tsx](../../src/components/history/MonthlyHistory.tsx)**: コード変更なし（lib 側で曜日対応）

→ ここでユーザに目視確認を依頼（430px、ポート3000）: 時刻ドロップダウン1ブロック、帯ラベル、マスタの曜日チップ ON/OFF、対象外行の薄色表示、空の日の文言、記録なしの日の助言バブル（15:00 に「そろそろ水分を…」が出るのは仕様変更）

### Phase 4: E2E（目視 OK 後）

- [e2e/helpers.ts](../../e2e/helpers.ts): コメントのみ（T0 = 2026-08-14(金) 15:00 は暦日でも記録日 8/14、15時=帯2。金曜であることに曜日テストが依存）
- [e2e/home-record.spec.ts](../../e2e/home-record.spec.ts): L19 `subtotal-w1`→`w2`、L27 `subtotal-u1`→`u2`
- [e2e/history-edit.spec.ts](../../e2e/history-edit.spec.ts): L29 `band-w1`→`band-w2`
- [e2e/time-navigation.spec.ts](../../e2e/time-navigation.spec.ts): (c-1) 「よくじつ」アサート削除→「きょう」あり・「よくじつ」なし・`hour-chip-0/23` 可視、3時=帯1 / 14時=帯2 / w3 "—"、0時で ‹ → 23時（帯3）。(d) を **0時境界**へ全面書き換え（23:30 → 記録 → `setSystemTime(8/15 00:05)` → reload → 8/15(土)・0時・0ml、0時台の記録は帯1、‹ で 8/14 に 100ml）。**(e) 追加**: reload せず `page.clock.runFor(60_000)` で日付追従（syncDay）を確認
- [e2e/persistence.spec.ts](../../e2e/persistence.spec.ts): `version` 3、`state.timings[0]` が `{name:"朝", weekdays:[0..6]}`
- [e2e/meds.spec.ts](../../e2e/meds.spec.ts): f-1 に「追加したタイミングの曜日チップは全部 ON」。**f-4 曜日**: 金に昼をチェック → マスタで `timing-weekday-昼-5` OFF → 昼行が `data-inactive="true"`・「きょうは 金よう日だからのまない日」・表示専用チップ（金=OFF+`data-today`、他ON）、朝は一文なしで全ONチップ・`drank-btn-昼` なし・✓ で解除できる・進捗 "0 / 2"・バナー「朝・晩 がまだです」→ ‹ 8/13(木) では昼が有効で "0 / 3" → 月ごと一覧の 8/14 に ⚠️ なし → localStorage `timings[1].weekdays` = `[0,1,2,3,4,6]` → reload 後も維持。**f-5 空の日**: 朝昼晩の金を OFF → `meds-empty-note`・"0 / 0"・バナーなし・履歴カード「のむおくすりの ない日」。**f-6 下限**: 最後の曜日をタップ → `data-on` true のまま・トースト表示
- [e2e/visual-helpers.ts](../../e2e/visual-helpers.ts): `version: 3` ×2、timings を Timing 化（**ねる前は `[1,3,5]`** で OFF チップを撮る。8/14 は金なので有効・進捗 1/4 は不変。コメントで T0 依存を明記）、vw4 を `2026-08-14T06:00`（帯1）へ、帯コメント更新、**`openSeeded` に `Math.random = () => 0` の init script**（助言メッセージがランダムで home-empty が不安定になるのを防ぐ）
- **新規 [e2e/migration.spec.ts](../../e2e/migration.spec.ts)**: 1つの v2 シード `{intakes: m1(120, recordDate 8/13, recordedAt 8/14T06:00), m2(150, 8/14T15:10), m3(500, 8/13T18:00); medChecks {8/13:{朝:8, 晩:19, 昼:12}, 8/14:{朝:15}}; timings ["朝","昼","晩"]}` → T0 で `water-day-total` 270ml・w1 120・w2 150、`meds-progress` "2 / 3"（昼:12 が 8/14 へ移動、朝:15 は据え置き）、‹ 8/13: 朝:8（衝突で据え置き）と 晩:19 が履歴に残り 昼 が未（data-ok false）、localStorage: `version` 3・m1 の recordDate 8/14・timings が object・**`mizu-log.bak.v2` が存在し元の medChecks を含む**。テスト2: v1 エンベロープ（dose "1mg"）→ `med-dose-0`="1" `med-unit-0`="mg"。テスト3: version 99 → レコード保持・再配置なし。テスト4: version なし → 白画面にならず timings が heal される
- 動作確認: `npx playwright test --project=chromium`（home-record / monthly-history は `--repeat-each=3` でバブル出現によるレイアウト揺れのフレークが無いことを確認）
- 視覚回帰: まず `npx playwright test --project=visual` を**更新せずに**実行して実際の差分一覧を出し、ユーザと確認 → OK 後 `--update-snapshots`。input-* 5枚は差分なしが期待値（サニティ）

### Phase 5: ドキュメント

- [README.md](../../README.md) L40-41（暦日・新帯）、L28-30（曜日指定・のまない日の表示）、L71-72（0時境界・移行）、記録のルールに「0時以降に飲んだ分は ‹ で前日に戻ってチェック」
- [CLAUDE.md](../../CLAUDE.md) L13（暦日・新帯）、L18 脇に「モックとの差分は docs/plans/02 の表が正」、L52（persist v3・migrate.ts・退避キー・衝突は据え置き）、L76（翌暦日ハマりどころ → 「recordedAt の暦日 = recordDate（v3 不変条件）」に置換）、L78（曜日は表示日の曜日で判定、履歴は曜日無関係）、ハマりどころに「migrate/merge は throw させない」「HOURS のみ、hourOrder 削除」
- [.claude/rules/styling.md](../../.claude/rules/styling.md) L45（サイド配色の例 → `data-on` ON/OFF 記述順の例）、L62（20→21ショット）、L65（version:3）
- [docs/plans/02-mizu-log-implementation.md](./02-mizu-log-implementation.md) L11/L18/L58/L77-84/L130/L135/L144 更新、意図的差分表に #6（曜日チップ）#7（時刻セレクタ1ブロック・帯ラベル）、E2E 表に migration 行
- [docs/plans/03-inline-style-to-css-migration.md](./03-inline-style-to-css-migration.md) L56/L67（21枚）、L60-61（version 3・同一暦日シード）、Math.random 固定の注記
- [docs/plans/01-mizu-log-requirements.md](./01-mizu-log-requirements.md) / [01-mizu-log-design-brief.md](./01-mizu-log-design-brief.md): 本文は書き換えず末尾に「変更履歴」節を追記（2026-09 暦日化・曜日指定）
- 学習の書き残し提案（CLAUDE.md ルールに従い実装完了後に確認）: 「zustand persist の migrate/merge は throw 禁止・未知 version を初期化しない」「hour 0 の falsy 罠」を `.claude/rules/` に残すか

## 検証

1. `npm run test` — Phase 1・2 の単体テスト全緑（migrate.test.ts 含む）
2. `npm run lint && npm run build` — 削除した export の参照漏れ（`addDays`/`HOUR_CYCLE`/`hourOrder`）と `string[]` 前提の消費側を型で検出
3. ユーザ目視（ポート3000・430px）: 上記 Phase 3 の観点 + 実データの v2 localStorage を一度読み込ませ、白画面にならず合計・履歴が暦日で並び、`mizu-log.bak.v2` が作られることを DevTools で確認。境界スモーク: DevTools で 23:59→00:01 に日付ラベルと合計が切り替わる
4. `npx playwright test --project=chromium`（新規 migration / 曜日 / 0時境界 / 日付追従 を含む全緑）
5. `npx playwright test --project=visual` で差分一覧を確認 → OK 後 `--update-snapshots` → 再実行で緑。PNG 差分は後のコミットに含める
6. コミットは行わない（ユーザの検証完了の合図と明示の指示を待つ）
