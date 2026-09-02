# CLAUDE.md — Claude 開発オンボーディング

このファイルは Claude Code が本リポジトリで作業するときに最初に読む内部メモ。
ユーザ向け仕様は [README.md](README.md) を参照。重複は避ける。

**領域固有ルールは [.claude/rules/](.claude/rules/) 配下の各 md に `paths:` frontmatter 付きで
分離**してあり、該当パスを編集するときに Claude Code が自動でロードする。
このファイルには全タスク共通の核だけを置く。

## プロジェクト要点

- **mizu-log（みずログ）**: 入院患者が飲水量・尿量・体温・血圧・脈拍・体重・便・食事・内服を記録するモバイルWebアプリ。患者本人が記録し、看護師は同じ端末の画面を閲覧するだけ（専用機能なし）
- **記録日は暦日**（0:00〜23:59 が1日）。小計帯は8時間×3（0〜7時 / 8〜15時 / 16〜23時）
- 飲水・尿量は個別記録を全保持し、合計・小計は**表示時に都度計算**（合計値は保存しない）
- データは **localStorage 単一キー `mizu-log`**（`{state, version}` エンベロープ）。DB・サーバー同期なし、単一端末前提。バックアップ機能は作らない（確定）
- Next.js 16 (App Router) + TypeScript + Zustand。スタイルは **globals.css のデザイントークン（CSS変数）+ `@layer` 共通クラス + 各コンポーネント同置の CSS Modules**（Tailwind不使用）。インラインstyleは計算値のCSS変数注入（`--tank-h`・`--beat`）のみ許可。規約は [.claude/rules/styling.md](.claude/rules/styling.md)
- 検索除け: metaタグ `noindex, nofollow`（layout.tsxのMetadata API）+ robots.txt Disallow。認証なし公開前提
- **UIの正はデザインモック** `design/mizu-log App.dc.html`（Claude Design出力）。見た目の変更はモックと突き合わせる。**モックは14時起点・曜日なしのまま**（更新しない）。差分は [docs/plans/02](docs/plans/02-mizu-log-implementation.md) の「意図的差分」表が正

## 作業の進め方（実行前に説明して同意を取る）

結果が残る／取り消しに手間がかかる操作（ファイル編集・コマンド実行・git・外部送信など）は、
**実行前に「何を・なぜ・どう変えるか」を説明し、同意を得てから行う**（git に限らず全操作）。
いきなり実行して事後報告にしない。やり方が複数あるなら案を示して選んでもらう。

**見た目（UI・エフェクト・レイアウト）に関わる変更は、実装 → ユーザの目視確認 → OKの合図、
の後にテスト実行へ進む**。OKが出る前にテストを回さない（修正指示のたびにこの手順を繰り返す。
連続する複数の変更でも、1つずつOKを取ってからテストする）。

## ポートとサーバーの扱い

- **ポート3000はユーザ専用**。ユーザが `npm run dev` で常時確認に使っているため、
  テスト・検証でポート3000を使わない
- **E2E（Playwright）はポート3100 + 本番ビルド（`.next-e2e`）で実行**（`playwright.config.ts` の
  webServerが `NEXT_DIST_DIR=.next-e2e` でビルドして `next start -p 3100` を自動起動する）。
  Next.js 16は同一プロジェクトで2つ目のdevサーバーを起動できないため、devモードのE2Eは不可。
  ユーザのdevサーバー（`.next`／3000）とはビルドディレクトリごと分離されている
- **ポートの解放（プロセスのkill）を勝手に行わない**。ユーザのdevサーバーを巻き込む恐れがある。
  ポートが塞がっていてテストが起動できない場合は、killせずユーザに確認する

## コミットの可否（このリポジトリで作業する全員・全エージェントに適用）

動作検証が完了するまで、コミットも
「コミットしますか？」という提案もしない。
**ユーザの検証完了の合図を待つ**。コミット／PR は検証後に明示の指示があってから行う。

## 主要ディレクトリ

- [src/app/](src/app/) — `layout.tsx`（robotsメタ+Noto Sans JP）・`page.tsx`・`robots.ts`・`globals.css`（**:root デザイントークン + @layer 共通クラス** + keyframes）
- [src/components/](src/components/) — `AppShell.tsx`（タブ+`?tab=`URL同期+ハイドレーションゲート）と共通UI。配下に `home/` `input/` `meds/` `history/` `sheets/`。各コンポーネントの隣に `*.module.css`（履歴3兄弟共有の `history/history.module.css` あり）
- [src/lib/](src/lib/) — **Reactに依存しない純粋関数のみ**。`time.ts`（記録日・帯・曜日）・`aggregate.ts`（集計）・`meds.ts`（曜日判定含む）・`migrate.ts`（永続データの移行・正規化）・`calendar.ts`・`constants.ts`（GOAL_ML=2000, QUICK_AMOUNTS=[50,100,150,200]）
- [src/stores/](src/stores/) — `useAppStore.ts`（永続データ、zustand persist **v3**。移行は [src/lib/migrate.ts](src/lib/migrate.ts)（純粋関数・Vitest対象）: v1→v2 薬の量 `dose`→`doseAmount`+`doseUnit` 分割、v2→v3 記録日を暦日へ（`recordDate` を `recordedAt` から再導出、`medChecks` の0〜13時を翌暦日へ、移動先が埋まっていれば元の日に据え置き）+ `timings` に `weekdays`。移行前に生エンベロープを `mizu-log.bak.v<旧version>` へ1回退避）・`useUiStore.ts`（非永続UI状態）
- [src/types/records.ts](src/types/records.ts) — 全データ型
- [`src/lib/__tests__/`](src/lib/__tests__/) — Vitest、[e2e/](e2e/) — Playwright
- [docs/plans/](docs/plans/) — 要件定義・実装計画、[design/](design/) — デザインモック（lint対象外）

## よく使うコマンド

```powershell
npm run dev                              # 開発サーバー（ポート3000、ユーザ専用。430px幅で確認）
npm run test                             # Vitest ユニットテスト
npm run lint                             # ESLint（design/ は除外済み）
npm run build                            # 本番ビルド
npx playwright test                      # 機能E2E+視覚回帰（.next-e2e にビルドしてポート3100で自動起動）
npx playwright test --project=chromium   # 機能E2Eのみ
npx playwright test --project=visual     # 視覚回帰のみ（スクショ比較。意図したUI変更後は --update-snapshots でベースライン更新）
```

## ハマりどころ（要点）

- **日時ロジックは必ず [src/lib/time.ts](src/lib/time.ts) 経由**（`now` を引数で受ける設計）。コンポーネントで `new Date()` から直接記録日や帯を計算しない
- E2Eは `page.clock.install` で時刻固定が必須。時刻文字列は `+09:00` 付きで書く（`playwright.config.ts` の `timezoneId: 'Asia/Tokyo'` とセット）
- `next.config.ts` で `devIndicators: false` にしてある。Next devの左下インジケーター（`<nextjs-portal>`）がボトムナビ左端 `nav-home` へのクリックを遮り E2E が落ちるため。戻さない
- `AGENTS.md` は `next dev` が自動再生成するNext.js公式ファイル。消しても復活する
- `.git/config` に**ユーザーが設定したGitHubリモート**（`y-nomura-cosmoroot/mizu-log`）がある。`.git` を作り直さない
- `recordedAt` の暦日 = `recordDate`（**v3 の不変条件**）。v2以前は 0〜13時が翌暦日だったが `migrate` が再計算する
- バイタルは1保存=1レコード（5項目まとめて）。空文字=未入力。全項目空のみ保存拒否
- 内服チェックは**タイミング単位**（薬ごとではない）。アラート判定は常に現在のマスタ基準。タイミングは曜日指定（`Timing.weekdays`、0=日…6=土、最低1つ）。チェック行の分母・飲み忘れ判定・月ごと⚠️は**表示中の記録日の曜日**で有効なものだけ、履歴の実績は曜日に関係なく表示
- persist の `migrate`/`merge` は**絶対に throw させない**（白画面になる）。未知 version は初期化せず形状正規化
- 時間セレクタは `HOURS=[0..23]` の1ブロック。`HOUR_CYCLE`/`hourOrder` は削除済み、時刻ソートは `(a,b)=>a-b`
- `medChecks` の hour 0 は正当な値。falsy 判定禁止
- `AppShell` は `visibilitychange` + 60秒間隔で `syncDay` を呼び、開いたまま0時を跨いでも今日を追従

## Plan モード運用

Plan モードで作った最終計画は **`docs/plans/<番号>-<slug>.md`** に置く。
デフォルト保存先 `~/.claude/plans/` に書いた後、`ExitPlanMode` を呼ぶ前に:

1. `docs/plans/` に同名でコピー（ディレクトリが無ければ作る）
2. リンク内の相対パス（`../../../../c:/skillup/mizu-log/`）を
   `docs/plans/` 起点の `../../` に書き換える
3. fenced code block には言語指定（` ```bash ` / ` ```python ` など）を付ける

`~/.claude/plans/` の元ファイルは残してよい（Plan モードの内部状態用）。

## 繰り返す調査は skill にする

「ID X と Y はなぜ統合されないか」のような何度もやる調査は [.claude/skills/](.claude/skills/)
にまとめてある。Claude Code 側からは `/<skill-name>` で呼べる:

新しい調査タイプを 2 回以上やったら skill 化を検討すること。

`/review-and-fix` のレビュー結果は **`docs/reviews/pr-<番号>.md`** に保存する（ディレクトリが無ければ作る）。

## CLAUDE.md / rules / skills を育てるルール

**「学習」の定義（このリポジトリ）**: ユーザが「学習して」「覚えて」と言ったら、学びの保存先は
**CLAUDE.md / [.claude/rules/](.claude/rules/) / [.claude/skills/](.claude/skills/) のいずれか**を指す。
Claude Code の auto-memory（`~/.claude/.../memory/MEMORY.md`）には**書かない**（PC 固有・このリポジトリと共有されず、
チームの学習にならないため）。書く場所の判断は下表「書く場所の判断」に従う。

このファイル・[.claude/rules/](.claude/rules/)・[.claude/skills/](.claude/skills/) は **書きっぱなしにせず、
作業のたびに更新を提案する**。Claude は次のタイミングで「学びを書き残すか」をユーザに**必ず確認する**:

| トリガー | 確認内容 |
|---|---|
| **問題が解決した直後** | 今回ハマった落とし穴・回避策・暗黙ルールがあれば、どこに書くか提案する |
| **コミット直前**（`/commit` 系の前） | 今回の変更で新しいルール / 繰り返し作業 / 引っかかるポイントが生まれていないか確認し、あれば書き残しを提案する |
| **同じ調査・修正を 2 回やった** | 2 回目に気付いた時点で skill 化を提案する（3 回目を待たない） |
| **既存の rules / skills の記述が現実と食い違った** | 該当ファイルの更新を提案する（古い記述の放置は禁止） |

### 書く場所の判断

| 内容 | 行き先 |
|---|---|
| 全タスク共通の核（プロジェクト要点・絶対要件・最重要原則） | このファイル CLAUDE.md |
| 特定パス／拡張子限定のルール | `.claude/rules/<topic>.md`（`paths:` frontmatter で自動ロード） |
| 2 回以上やる調査・操作の手順 | `.claude/skills/<name>/SKILL.md` |
| 1 回限りの調査・思考メモ | どこにも書かない（必要なら `_diag/` のスクリプトに残す） |

### 提案の作法

- **勝手に書き換えない**。「これを `.claude/rules/ui.md` の "ラベル明確化ルール" 節に追記しますか？」のように、
  ファイル名・該当箇所・追記文案を具体的に示してユーザに確認する
- 既存ファイルに追記できるなら新規ファイルを作らない
- CLAUDE.md は 200 行以下を目標。膨らんだら `.claude/rules/` に切り出す
- rules ファイルを新規作成するときは必ず `paths:` frontmatter を付ける（自動ロードを効かせるため）
- skill を新規作成するときは `description:` を具体的に書く（呼び出し時の triggering 精度に直結）

## 設計ドキュメント参照

- [docs/plans/01-mizu-log-requirements.md](docs/plans/01-mizu-log-requirements.md) — 要件定義（記録項目・記録日/小計ルール・内服アラートの根拠）
- [docs/plans/01-mizu-log-design-brief.md](docs/plans/01-mizu-log-design-brief.md) — デザインブリーフ（Claude Designへの入力に使った資料）
- [docs/plans/02-mizu-log-implementation.md](docs/plans/02-mizu-log-implementation.md) — 実装計画（データモデル・E2E計画・モックとの意図的差分の一覧）
- [docs/plans/03-inline-style-to-css-migration.md](docs/plans/03-inline-style-to-css-migration.md) — インラインstyle→CSSトークン+CSS Modules 移行計画（視覚回帰ハーネスの設計込み）
- [design/mizu-log App.dc.html](design/mizu-log%20App.dc.html) — 確定デザインモック（**UIの正**。support.js と同じフォルダに置いたままブラウザで直接開ける）
