# mizu-log 実装計画（デザイン確定後）

## Context

要件定義（[01-mizu-log-requirements.md](01-mizu-log-requirements.md)）とデザインブリーフを経て、Claude Designで作成したデザインモックが [design/mizu-log App.dc.html](../../design/mizu-log%20App.dc.html) に確定した。**このモックが実装すべきUI・挙動の正**。本計画はモックをNext.jsアプリとして実装し、Vercelにデプロイ可能な状態にするもの。最終フェーズはPlaywrightによるE2Eテストで、**全テストがパスすることがプロジェクトの完了条件**。

### モックの構造（読解・検証済み）

ボトムナビ4タブのモバイルSPA（max-width:430px、Noto Sans JP、水色基調）:

1. **home（飲水量/尿量）**: 日付ナビ+カレンダー（未来日不可）、⏰時刻セレクタ（記録日の24時間を14時→翌13時順）、画面全体が左右2分割の水タンク（左=飲水/青、右=尿量/黄、日合計/2000mlで水位）、クイックボタン＋50/＋100/＋150/＋200+自由入力、今日の合計、飲み忘れアラートバナー、帯小計バー（14〜21時/22〜翌5時/翌6〜13時/合計）
2. **input（バイタル）**: バイタルカード（体温select 34.0〜41.0、血圧上下、脈拍、体重、人体SVGが体温で色変化: 平熱=青/37℃〜=オレンジ微熱/38℃〜=赤高熱）、1保存=1レコード（全項目空は拒否）、便・食事のワンタップカード（回数表示）
3. **meds（おくすり）**: きょうの分 X/Y、チェックモード（タイミング行、未=黄+「のんだ!」/済=✓）⇔マスタ編集モード（タイミング↑↓/削除/追加、薬の名前・量・タイミングタグ）
4. **history（りれき）**: サブタブ3つ（飲水量/尿量・バイタル・おくすり）。帯カード→時間ごとの折りたたみ行→個別記録（なおす/けす）。1日の合計。おくすりは飲み忘れ結果カード（⚠️/🎉）

共通: ボトムシート編集（ml=±10ステッパー、バイタル=全項目フォーム）、トースト（2.2秒）、rowpopアニメーション。

**時間ロジック**: 記録日=14時起点（現在時刻が14時未満なら前日の記録日）。band(h)= 14〜21時→帯1、22〜翌5時→帯2、翌6〜13時→帯3（8時間×3）。時刻の並び順キー=(h+10)%24。分は「今の記録日かつ選択時刻=現在時なら現在分、他は0分」。

### スコープ決定（ユーザー確認済み）

- **バックアップ（エクスポート/インポート）機能は作らない**（今後も追加予定なし）
- **タンク満タン基準 = 2000ml 固定**（定数）
- **クイックボタン = ＋50/＋100/＋150/＋200**（飲水・尿量共通。モックの画面表示のまま）
- 初期データ: タイミングマスタ「朝・昼・晩」のみ。記録・薬は空（モックのサンプルデータは投入しない）

## 技術スタック・方針

- **Next.js (App Router) + TypeScript**、`src/` ディレクトリ構成
- **Tailwindは使わない**。モックは100%インラインstyleのため、`React.CSSProperties` オブジェクトへ1対1で忠実に移植（動的スタイルはモック同様JS生成）。グローバルは `globals.css` に body+`@keyframes spinwave/toastin/rowpop` のみ。頻出チップ系は `src/lib/styles.ts` に定数化
- フォントは `next/font/google` の `Noto_Sans_JP`（400/500/700/900）
- 状態管理: **Zustand**。永続データは `persist` ミドルウェアで localStorage 単一キー `mizu-log`（`{state, version}` エンベロープ+`migrate`+`partialize`）。UI状態（タブ/表示日/選択時刻/トースト/シート）は非永続の別ストア
- SSR対策: `onRehydrateStorage` で `hasHydrated` フラグ、`AppShell` はハイドレーション完了までシェルのみ描画
- **検索除け**: `app/layout.tsx` の Metadata API で `robots: { index: false, follow: false }` → **`<meta name="robots" content="noindex, nofollow">` を出力** + `app/robots.ts` で `Disallow: /`
- テスト: **Vitest**（lib/のユニット）+ **Playwright**（E2E、chromium）
- **コミットはユーザー検証完了の合図まで一切しない**（CLAUDE.md規約。git init のみ行う）

## セットアップ（Windows / PowerShell）

リポジトリ直下が非空（CLAUDE.md/docs/design）のため `create-next-app` は一時フォルダ経由:

```powershell
npx create-next-app@latest _scaffold --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-npm --yes
Get-ChildItem _scaffold -Force | Where-Object { $_.Name -ne '.gitignore' } | Move-Item -Destination . -Force
# _scaffold\.gitignore の内容(node_modules/.next等)を既存 .gitignore に手動マージ + playwright-report/ test-results/ を追記
Remove-Item _scaffold -Recurse -Force
npm i zustand
npm i -D vitest @playwright/test
npx playwright install chromium
git init
```

scripts: `dev` / `build` / `start` / `lint` / `test`(vitest run) / `test:watch` / `e2e`(playwright test) / `e2e:ui`

## データモデル（src/types/records.ts）

```typescript
export type RecordDate = string;   // 'YYYY-MM-DD' 14時起点の記録日
export type IntakeKind = 'water' | 'urine';

export interface IntakeRecord {    // 飲水・尿量: 個別記録を全保持、集計は表示時
  id: string;
  kind: IntakeKind;
  recordedAt: string;      // 'YYYY-MM-DDTHH:mm' ローカルnaive ISO（正）
  recordDate: RecordDate;  // 派生キャッシュ（集計キー）
  ml: number;
}

export interface VitalRecord {     // バイタル: 1保存=1レコード、空文字=未入力
  id: string; recordedAt: string; recordDate: RecordDate;
  temp: string; bpSys: string; bpDia: string; pulse: string; weight: string;
}

export type FlagKind = 'stool' | 'meal';
export interface FlagRecord { id: string; kind: FlagKind; recordedAt: string; recordDate: RecordDate; }

export type MedChecks = Record<RecordDate, Record<string, number>>; // 記録日×タイミング名→チェック時の時(0-23)

export interface Medicine { id: string; name: string; dose: string; timings: string[]; }

export interface AppData {
  intakes: IntakeRecord[]; vitals: VitalRecord[]; flags: FlagRecord[];
  medChecks: MedChecks; timings: string[]; medicines: Medicine[];
}
```

### モックとの意図的な差分（この通り実装する）

| # | モック | 実装 | 理由 |
|---|---|---|---|
| 1 | メモリ内サンプルデータ | 空データ+タイミング「朝/昼/晩」 | 実運用開始状態 |
| 2 | バイタル空判定に血圧下(d)を含めない | 5項目全空のときのみ「どれか1つ入れてね」 | 血圧下のみ入力の記録消失防止 |
| 3 | 便・食事の削除は「日+時の最初の1件」 | id指定で削除 | 正確性 |
| 4 | バイタル編集は参照同一性で特定 | idで特定 | 永続化と両立 |
| 5 | 履歴アコーディオン開閉がサブタブ間で共有 | サブタブローカルstate | 簡素化 |

## ディレクトリ構成とモック→コンポーネント対応

```text
src/
  app/        layout.tsx(robotsメタ+フォント) / page.tsx / robots.ts / globals.css
  components/ AppShell.tsx(タブ+?tab=同期+ハイドレーションゲート) / Header.tsx / CalendarPopup.tsx
              TimeSelector.tsx(3画面共通) / BottomNav.tsx / Toast.tsx
    home/     HomeTab / TankBackground / IntakePanel(kind='water'|'urine') / MedsAlertBanner / SubtotalBar
    input/    InputTab / VitalsCard / BodyFigure(人体SVG, data-fever属性) / StoolMealCard
    meds/     MedsTab / TimingCheckRow / TimingMasterCard / MedicineMasterCard
    history/  HistoryTab / WaterUrineHistory / VitalHistory / MedsHistory / HourAccordionRow
    sheets/   BottomSheet / MlEditSheet / VitalEditSheet
  lib/        constants.ts(GOAL_ML=2000, QUICK_AMOUNTS=[50,100,150,200], 帯定義)
              time.ts / aggregate.ts / meds.ts / calendar.ts / styles.ts / id.ts
  stores/     useAppStore.ts(persist v1) / useUiStore.ts
  types/      records.ts
e2e/          Playwrightテスト
src/lib/__tests__/  Vitestユニットテスト
```

モックの行対応: L23-62→Header+CalendarPopup、L66-91(+L272-297,L369-394の複製)→TimeSelector共通化、L94-150→homeタブ各部、L157-265→history3サブタブ、L299-363→inputタブ、L397-451→medsタブ、L455-492→シート+トースト、L494-498→BottomNav。

E2E安定化のため主要素に `data-testid` を設計段階から付与（`water-hour-ml`, `water-day-total`, `subtotal-w1`, `quick-water-150`, `nav-meds`, `hour-row-15`, `med-alert-banner`, `body-figure`(+`data-fever`), `toast` 等）。

## タブ/ルーティング: 単一ルート `/` + `?tab=` クエリ同期

- `?tab=home|input|meds|history`、履歴サブタブは `&sub=water|vital|meds`
- タブはZustand UIストアで即時切替し、`window.history.replaceState` でURL反映・初期表示時にURLから復元（`router.replace`は使わない: サーバー往復とSuspense境界が不要）
- E2Eで `page.goto('/?tab=meds')` のdeep-linkとリロード後のタブ維持が可能になる
- `viewDate`（表示中の記録日）と `selHour` はメモリのみ（リロードで「今」に戻る=モック挙動と一致）

## コアロジック（lib/、全関数 now を引数で受けて決定的に）

- `time.ts`: `getRecordDate(now)`（14時未満→前暦日）/ `band(h)` / `HOUR_CYCLE=[14..23,0..13]` / `hourOrder(h)=(h+10)%24` / `toRecordedAt(date,h,m)`（h≦13は翌暦日）/ `targetMinute(viewDate,selHour,now)` / `addDays` / `formatDateLabel`（'8/14(木)'）
- `aggregate.ts`: `sumForHour` / `sumForBand` / `sumForDay` / `groupIntakesByBandHour`（帯→時→個別、分昇順）/ `groupVitalEntriesByBandHour`（時間行サマリ=最新バイタル+💩🍴件数）/ `countFlags`
- `meds.ts`: `uncheckedTimings`（現行マスタ基準）/ `medsForTiming`（'グラセプター 1mg ・ プレドニン 2錠' or '（くすりの登録なし）'）/ `sortMedicines`（最小タイミングindex順、タグ無し最後）
- `calendar.ts`: `buildCalendarCells`（未来disabled/今日/選択中）

**Vitestケース**: 13:59→前日・14:00→当日・0:30→前日、`toRecordedAt` の翌暦日跨ぎ（月末・年末含む）、band境界（5/6, 13/14, 21/22）、`hourOrder` ソート、`targetMinute` 3分岐、同一時間内複数件の合算、帯別小計、未チェック抽出、マスタ削除後の判定、薬ソート、カレンダー未来日、persistのmigrate。

## E2Eテスト計画（Playwright）

設定: `viewport: 430×940`、`locale: 'ja-JP'`、`timezoneId: 'Asia/Tokyo'`（必須）、`webServer` で dev server 自動起動（`E2E_PROD=1` で build+start に切替）。各テストは新規コンテキスト=localStorage空。時刻は `page.clock.install({time})` で固定し決定的にする。

| spec | シナリオ |
|---|---|
| `home-record` | (a)クイック記録→この時間/日合計/帯小計/トースト反映、飲水・尿量の独立集計 (b)同一時間の複数回入力→合算表示、履歴に個別2件 |
| `time-navigation` | (c)過去時刻への記録（‹›+ドロップダウン、翌日側の3時→帯2に計上）、過去日付への記録（‹で前日、›で今日より先に進めない）、カレンダー未来日disabled (d)14時境界: 13:30→記録日=前日、14:05にclock進めてreload→記録日切替・合計リセット、前日に100ml残存 |
| `history-edit` | (e)なおす→±10シート→全集計更新、けす→再計算、やめる→変更なし |
| `meds` | (f)マスタ編集（薬追加・タグON・タイミング追加・並び替え）→チェックモード反映、全チェック→バナー消灯→履歴に実績+🎉カード、チェック解除→再点灯、タイミング削除→薬タグからも除去 |
| `persistence` | (g)記録→reload→全値保持、localStorageエンベロープ形式検証、`?tab=history&sub=vital` deep-link維持 |
| `input-vitals` | (i)全項目空→拒否トースト、体温36.5/37.2/38.5→`data-fever` と平熱/微熱/高熱チップ、保存→直近表示+入力クリア+履歴反映、なおすシート (h)便2回・食事1回→回数表示・履歴の💩🍴・1件だけ削除 |
| `seo` | `meta[name="robots"]`=noindex,nofollow、`/robots.txt` に `Disallow: /` |

## 実装フェーズ

| フェーズ | 内容 | 完了条件 |
|---|---|---|
| P0 セットアップ | scaffold移設、フォント、globals.css、robots(メタ+robots.ts)、AppShell+ナビ骨格、vitest/playwright設定 | dev起動・build成功・robotsメタ出力 |
| P1 型+ロジック | types、lib一式、ユニットテスト | `npm run test` 全パス |
| P2 ストア+永続化 | useAppStore(persist v1)+useUiStore+ハイドレーションゲート | リロードで保持、エンベロープ形式 |
| P3 共通UI | Header+CalendarPopup、TimeSelector、Toast、`?tab=`同期 | 日付/時刻移動・deep-link動作 |
| P4 homeタブ | タンク・IntakePanel・SubtotalBar・バナー | 記録→即時反映 |
| P5 inputタブ | VitalsCard+BodyFigure+StoolMealCard | 保存/体温色/件数動作 |
| P6 medsタブ | チェック+マスタ編集+バナー結線 | チェック→進捗→バナー消灯 |
| P7 historyタブ | 3サブタブ+アコーディオン+シート編集/削除 | 追加→表示→編集→再計算 |
| P8 仕上げ | モックと並べて目視照合、lint+build | 警告ゼロ・見た目差異なし |
| **P9 E2E（最終）** | e2e/全spec実装→修正ループ | **`npx playwright test` 全パス + `E2E_PROD=1` でも全パス = 完了** |

## ドキュメント更新（実装と併せて行う）

- `01-mizu-log-requirements.md` の未確定事項を更新: バックアップ機能=作らない（決定）、クイックボタン=＋50/＋100/＋150/＋200（決定）
- CLAUDE.md の「計画後に記載」欄（プロジェクト要点/主要ディレクトリ/よく使うコマンド/ハマりどころ）は、実装完了後に内容を提案してユーザー確認のうえ記入

## 検証方法

```powershell
npm run dev                                # 各フェーズ: 430px幅で目視、モックHTMLと並べて比較
npm run test                               # P1以降: ユニットテスト
npm run build; npm run start               # 本番ビルド+ http://localhost:3000/robots.txt 確認
npx playwright test                        # P9: E2E全実行
$env:E2E_PROD='1'; npx playwright test     # 最終ゲート: 本番ビルド相手に全パス
```

リスク対策: SSRハイドレーション不整合→`hasHydrated`ゲート+`new Date()`依存はクライアント評価のみ / E2E時刻フレーク→全テスト`page.clock`固定+`timezoneId`指定 / 非空ディレクトリ→`_scaffold`経由。

完了後、Vercelデプロイとコミット/pushは**ユーザーの検証完了の合図を待ってから**行う。
