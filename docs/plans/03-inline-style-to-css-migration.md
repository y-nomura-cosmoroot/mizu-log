# インラインstyle → CSSデザイントークン + CSS Modules 移行計画

## Context

全26コンポーネント・216箇所がインラインstyle（`style={{...}}`）で書かれており、視認性が悪く、同じ定義（色コード60種・カード/ボタン/チップ等のパターン）が複数ファイルに重複している。DRY原則に従い、CSSクラス+CSS変数（デザイントークン）へ移行する。

**ユーザ合意済みの方針（変更不可）**:
1. **ハイブリッド構成**: `globals.css` に `:root` トークン + 共通部品クラス、コンポーネント固有スタイルは同フォルダの CSS Modules
2. **完全一致移行**: 値の統合・丸めは一切しない（#c25454 と #c2453a も別トークン）。1ピクセルも変えない。値の統合は移行後の別タスク
3. 検証は Playwright `toHaveScreenshot` の視覚回帰（リファクタ前にベースライン取得 → バッチごとに差分ゼロ確認）。ベースラインは現HEAD（0ce668e、working tree クリーン）

**前提事実**（探索済み）:
- 既存E2E28本はスタイルを一切アサートしない（全て data-testid、82箇所）→ 名前・位置は不変更
- `data-fever`/`data-build` は E2E でアサート済み → 属性名・値を維持
- `vitalEffects.ts` の色関数は Vitest が色文字列を直接テスト → **SVG色ロジックは TS に残す**
- next/font（Noto Sans JP、`body className`）は触らない
- Playwright 1.62.1、`animations: "disabled"` がデフォルトで無限アニメ（波・心臓）をキャンセル
- ポート3000はユーザ専用、テストは3100（`.next-e2e`）。コミットはユーザの明示指示後のみ

## フェーズ全体像

```text
P0  視覚回帰ハーネス構築 + ベースライン取得（プロダクトコード変更ゼロ）
P1  globals.css にトークン + @layer 共通クラス追加（未参照なので差分ゼロ）
B1〜B7  コンポーネント移行バッチ（各バッチ後に検証ルーチン）
P9  styles.ts 削除・ドキュメント更新・最終検証・ユーザ目視
```

**各バッチ後の検証ルーチン（固定）**:

```bash
npm run lint
npx tsc --noEmit
npx playwright test --project=visual   # 全ショット差分ゼロが合格条件
```

機能E2E28本（`--project=chromium`）は **B4後に1回（中間）と P9（最終）のみ**。

## P0: 視覚回帰ハーネス

### playwright.config.ts への追記

```ts
reporter: [["list"], ["html", { open: "never" }]],
snapshotPathTemplate: "{testDir}/__screenshots__/{testFileName}/{arg}{ext}", // -win32等のサフィックス除去
expect: {
  toHaveScreenshot: { maxDiffPixels: 0, threshold: 0, animations: "disabled", caret: "hide" },
},
projects: [
  { name: "chromium", testIgnore: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 940 } } },
  { name: "visual", testMatch: /visual\.spec\.ts/, retries: 0, use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 940 } } },
],
```

- 分離は**プロジェクト分割**（--grep はタイトル依存で壊れやすい）。webServer は共有（1回のビルドで両方実行可）
- ベースラインPNGは `e2e/__screenshots__/visual.spec.ts/*.png`（20枚・gitignore対象外。コミットするかは P9 でユーザ判断）

### e2e/visual-helpers.ts（新規）: localStorage 直接注入

- `SEED`: `{state: AppData, version: 2}` エンベロープ（形式の正は `useAppStore.ts` の partialize）
  - intakes: 帯1/帯2/帯3(翌暦日 `2026-08-15T06:00`)+前日分（カレンダー非選択日の合計表示用）
  - vitals: 全エフェクト同時発火（temp 38.5 / bp 150/95 / pulse 120 / weight 70）+ 部分記録1件（サマリ統合表示）
  - flags: 便・食事各1、medChecks: 朝のみ済（未チェック行+飲み忘れバナー表示）、medicines: 用量あり2種+未入力1種
- `ALL_CHECKED_SEED`: 全タイミング済（🎉カード用）
- `openSeeded(page, path, seed)`: `addInitScript` で注入 → `openApp`（clock固定 2026-08-14T15:00+09:00）→ `document.fonts.ready` 待ち

### e2e/visual.spec.ts（新規）: 20ショット

| ショット | 内容 | 撮り方 |
|---|---|---|
| home-seeded / home-empty | ホーム(データあり/なし) | fullPage |
| home-hour-dropdown / home-calendar | 時間ドロップダウン展開 / カレンダー展開 | fullPage |
| home-toast | `clock.pauseAt` → quick-water-150 → toast可視 | viewport |
| input-seeded / input-empty | 入力タブ | fullPage |
| input-variant-normal / mild / low | 体温36.5 / 37.2 / 34.0+bp85+pulse50+weight40 | fullPage |
| meds-seeded / meds-master | チェックモード / マスタ編集モード | fullPage |
| history-water / history-water-open | 履歴水分 / 時間行アコーディオン展開 | fullPage |
| history-vital-open / history-vital-empty | 履歴バイタル展開 / 空 | fullPage |
| history-meds-ng / history-meds-ok | 飲み忘れあり(展開) / なし(ALL_CHECKED) | fullPage |
| edit-sheet-ml / edit-sheet-vital | なおすシート(ml / バイタル) | viewport |

- fullPage 標準（コンテンツが940px超）。fixedオーバーレイが主役の sheet/toast のみ viewport
- カバレッジ: 26ファイル全部、FEVER_CHIP4値、data-ok両分岐、カレンダー5分岐、chipOn/Off、BottomNav各状態

### P0 の合格条件

```bash
npx playwright test --project=visual --update-snapshots  # ベースライン生成
npx playwright test --project=visual  # 1回目 全green
npx playwright test --project=visual  # 2回目 全green（ビルド再現性込み）
```

2連続 green にならなければ「リスクと対策」のはしごで調整してから P1 へ。

## P1: globals.css にトークン + 共通クラス

### トークン命名（`:root`、プリフィクス固定）

- `--c-*` 色 / `--fs-*` fontSize / `--fw-*` weight / `--r-*` radius / `--sh-*` shadow
- **色はファミリー+明度ステップのセミセマンティック**（`--c-primary-700: #155a8f` `--c-primary-600: #1c6dab` `--c-primary-500: #2b8fd6` `--c-urine-600: #b0761a` `--c-danger-600: #c2453a` `--c-danger-500: #c25454`〔近似2色は別トークン+用途コメント〕`--c-ink: #24323d` `--c-muted-500: #7a8b98` `--c-line-input: #d5e7f4` `--c-surface-row: #fbfdff` 等、約40個）
- **fontSize は値ベース**（`--fs-12: 12px` … `--fs-38: 38px`、.5系も `--fs-12-5` でそのまま）— 完全一致移行では値が正、意味づけは統合タスクで
- `--fw-regular/medium/bold/black` = 400/500/700/900
- `--r-8`〜`--r-20`、`--r-pill: 999px`、`--r-full: 50%`
- shadow はセマンティック: `--sh-card`(0 2px 10px rgba(43,113,166,.08)) `--sh-pop` `--sh-alert` `--sh-sheet` 等8個

**トークン化しない基準**: 1ファイル閉じのワンオフ色（TimingCheckRow の警告黄、EditSheet の灰、タンク/ロゴのグラデ、半透明白）、`#fff`/`transparent`、SVG fill/stroke（TS残し）、特殊radius（`24px 24px 0 0` 等）はモジュール内リテラル。

### 共通部品クラス（`@layer app-components` 内）

**採用基準: 完全同一レシピが2ファイル以上、または styles.ts 由来**。ジオメトリが1つでも違えば共通化せず各 module にトークン参照で書く。

- `.card`（旧 styles.card: 枠あり r16、履歴3ファイル）
- `.panel`（白カード枠なし r20 ×4ファイル。padding は各module）
- `.input`（旧 inputBox）/ `.btn-edit`（旧 editBtn）/ `.btn-del`（旧 delBtn）
- `.chip` `.chip--on` `.chip--off`（旧 chipOn/chipOff）
- `.badge-water` `.badge-urine`（旧 waterChip/urineChip）
- `.overlay`（fixed inset:0。z-index は使用側）/ `.popover`（r18 + `--sh-pop`。位置/幅は使用側）

**青塗り/薄青/薄赤ボタン群はグローバル化しない**（radius/padding/fontSize が全箇所で異なる）。各 module に `background: var(--c-primary-500)` 等で書く。

**@layer の効果**: レイヤ外（CSS Modules）の宣言が specificity・読み込み順に関係なく常に勝つ → `` className={`input ${s.tempSelect}`} `` の上書きが安全。

## B1〜B7: 移行バッチ（タブ単位 + 先頭パイロット）

| バッチ | ファイル | 箇所 | ポイント |
|---|---|---|---|
| **B1** | AppShell / Toast / BottomNav | 6 | パイロット。module新設・`.isActive` 動的クラス・keyframes参照を一通り検証 |
| **B2** | MedsTab / TimingCheckRow / TimingMasterCard / MedicineMasterCard / MedDoseList | 33 | rowpop再発火、checked切替、inputBoxスプレッド初出 |
| **B3** | InputTab / VitalsCard / StoolMealCard / BodyFigure | 32 | FEVER_CHIP→`data-fever`属性CSS、SVGはTS残し、`--beat`変数注入 |
| **B4** | HistoryTab / AccordionHourRow / 履歴3ファイル | 52 | `history.module.css` を3ファイル共有。**終了後 chromium 28本を中間実行** |
| **B5** | HomeTab / IntakePanel / SubtotalBar / TankBackground / MedsAlertBanner | 35 | `data-kind`+スコープ変数、`--tank-h`注入 |
| **B6** | Header / CalendarPopup / TimeSelector | 35 | `.overlay`/`.popover`、カレンダー5分岐の`data-state`化、chipOn/Off置換 |
| **B7** | EditSheet + styles.ts 削除 | 23 | inputBoxスプレッド×6 → grep残存ゼロ確認 → `src/lib/styles.ts` 削除 |

## 動的スタイルの変換規約（優先順）

1. **既存 data 属性 → 属性セレクタ**: MedsHistory の `data-ok` は既にDOMにある → `.result[data-ok="true"] {...}`
2. **2値 boolean → 条件付き module クラス `.isXxx`**: `` className={`${s.item} ${open ? s.isOpen : ""}`} ``。BottomNav / AccordionHourRow / TimingCheckRow / hasTotal（**`visibility: hidden` 維持**。display切替は高さが変わるのでNG）
3. **3値以上の enum → data 属性 + module 属性セレクタ**: CalendarPopup セル `data-state="blank|selected|disabled|today|normal"`、TimeSelector `data-selected`+`data-today-side`、VitalsCard 温度チップ `data-fever`
4. **連続計算値 → CSS変数注入** `style={{ "--x": v } as React.CSSProperties}`: TankBackground `--tank-h`、BodyFigure `--beat`。**インラインstyleが許される唯一のケース**
5. **kind別パレット（IntakePanel）→ `data-kind` + スコープ付き変数**: `.root[data-kind="water"] { --ip-num: var(--c-primary-700); ... }` ×9値、PALETTE 定数は label 文字列のみに縮小

- rowpop 再発火: `.isMoved` クラス付与で現行と完全同挙動（同一要素への連続markで再発火しない点も同じ）
- **禁止**: `[data-testid]` をセレクタに使わない。data属性の名前・値を変えない

## styles.ts 廃止手順

1. P1 でグローバルクラス定義（二重定義だが未参照なので無害）
2. 各バッチで消費側を置換（B2: TimingMasterCard、B3: VitalsCard、B4: 履歴3、B6: Header、B7: EditSheet）
3. スプレッド上書き14箇所は**差分プロパティだけ**を module に書く:
   `style={{...inputBox, flex:1, padding:"8px 6px"}}` → `` className={`input ${s.tempSelect}`} `` + `.tempSelect { flex:1; padding:8px 6px; }`
4. B7 完了後 `grep -rn "lib/styles" src/` 0件 → 削除

## P9: 仕上げ

1. **CLAUDE.md 更新**: 「インラインstyle」記述 → 「globals.css のトークン+@layer 共通クラス + CSS Modules（Tailwind不使用）。インラインは計算値のCSS変数注入とSVG属性のみ」。styles.ts 言及削除、visual コマンド追記
2. **`.claude/rules/ui-number-emphasis.md`**: コード例を CSS Modules 版へ（原則は不変）
3. **`.claude/rules/styling.md` 新設**（ユーザ確認の上）: `paths:` frontmatter 付きでトークン命名・動的スタイル規約を常設化
4. **最終検証の順序**: `npx playwright test`（visual 20 + chromium 28）→ `npm run test`（84）→ `npm run lint` → **ユーザ目視（ポート3000）** → OK後、ベースラインPNGのコミット可否確認 → コミットはユーザ指示後のみ
5. 計画を `docs/plans/03-inline-style-to-css-migration.md` に保存（実装冒頭で実施）

## リスクと対策

- **スクショ不安定時のはしご**（P0で2連続greenにならない場合、上から順に）: ① threshold 0→0.02〜0.05（maxDiffPixels:0 は維持）② 局所揺れなら maxDiffPixels≤10 ③ 特定要素のみなら `stylePath`/`mask` で最小マスク ④ フォント起因なら `document.fonts.ready` 確認・ウォームアップ navigation
- **specificity**: グローバルを `@layer` に置くことで module が常に勝つ。懸念時は `:where()` 方式へ切替可。border はショートハンド統一（longhand混在させない）
- **fullPage × fixed要素**: BottomNav はスクロール0位置に焼き込まれるが決定的なので無害
- **Windows前提**: snapshotPathTemplate でプラットフォームサフィックスを外したため、別OSでベースライン再生成しない（CI導入時はLinuxで撮り直し）
- **ポート3100が塞がっていたら kill せずユーザ確認**。ポート3000には触れない
- visual 実行のたびに本番ビルドが走る（バッチあたり2〜4分）— 安全の対価として許容

## 変更ファイル一覧（主要）

- 追記: `src/app/globals.css`（トークン+@layer）、`playwright.config.ts`
- 新規: `e2e/visual-helpers.ts`、`e2e/visual.spec.ts`、`src/components/**/*.module.css`（約22ファイル）、`src/components/history/history.module.css`（3ファイル共有）、`docs/plans/03-inline-style-to-css-migration.md`
- 編集: 26コンポーネント全部（className化）、`CLAUDE.md`、`.claude/rules/ui-number-emphasis.md`
- 削除: `src/lib/styles.ts`（B7）
