---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.module.css"
  - "src/app/globals.css"
---

# スタイリング規約（CSSトークン + CSS Modules）

2026-08 にインラインstyle 216箇所を全廃し、この構成へ移行済み
（[docs/plans/03-inline-style-to-css-migration.md](../../docs/plans/03-inline-style-to-css-migration.md)）。

## 置き場所

| 内容 | 行き先 |
|---|---|
| デザイントークン（色・fontSize・fontWeight・radius・shadow） | `src/app/globals.css` の `:root` |
| 完全同一レシピが2ファイル以上で共有される部品クラス（`.card` `.panel` `.input` `.btn-edit` `.btn-del` `.chip` `.badge-water` `.overlay` `.popover` 等） | `globals.css` の `@layer app-components` |
| コンポーネント固有のスタイル | 同フォルダの `Component.module.css`（`import styles from "./X.module.css"`） |
| 同一フォルダ内の複数コンポーネントで共有するパーツ | フォルダ共有 module（例 `history/history.module.css`、`meds/meds.module.css`） |

- module の import 名は **`styles` に統一**（zustand セレクタの `(s) =>` と紛れないように `s` は使わない）
- グローバル部品クラスは `@layer` 内にあるため、**レイヤ外の CSS Modules が specificity・読み込み順に関係なく常に勝つ**。
  `` className={`input ${styles.tempSelect}`} `` のように差分プロパティだけ module で上書きする（全量コピーしない）
- ジオメトリ（padding/fontSize/radius）が1つでも違う「似たボタン」はグローバル化しない。トークン参照で各 module に書く

## トークン命名

`--c-*` 色 / `--fs-*` fontSize / `--fw-*` weight / `--r-*` radius / `--sh-*` shadow。
色はファミリー+明度（`--c-primary-600` `--c-urine-100` `--c-danger-500`）。fontSize は値ベース（`--fs-12-5` = 12.5px）。

- **値の統合・丸めはしない**（完全一致移行の方針を維持）。`--c-danger-600/#c2453a` と `--c-danger-500/#c25454` のような近似値が意図的に並存している。統合するときは視覚差分をユーザ確認の上で別タスクとして行う
- トークン化しないもの: 1ファイル閉じのワンオフ色（警告黄・グラデ・半透明白など）、`#fff`、特殊radius（`24px 24px 0 0` 等）→ module 内リテラル
- **SVGの fill/stroke 色は TS（`vitalEffects.ts` 等）に残す**。Vitest が色文字列を直接テストしているため CSS へ移さない

## 動的スタイルの書き方（優先順）

1. **既存 data 属性があるならそれを使う**: `.resultCard[data-ok="true"] {...}`（MedsHistory）
2. **2値 boolean → 条件付き module クラス `.isXxx`**: `` className={`${styles.row} ${open ? styles.isOpen : ""}`} ``。
   表示/非表示で高さを保つ場合は `visibility: hidden`（`display:none` はレイアウトが変わる）
3. **3値以上の enum → data 属性 + 属性セレクタ**: `data-state="selected|disabled|today|..."`（CalendarPopup）、`data-fever`（VitalsCard）、`data-kind="water|urine"` + スコープ付きCSS変数（IntakePanel）
4. **連続計算値のみ inline の CSS 変数注入を許可**: `style={{ "--tank-h": h } as React.CSSProperties}`（TankBackground）、`--beat`（BodyFigure）。**それ以外の inline style は禁止**

- `[data-testid]` をCSSセレクタに使わない。data 属性の名前・値は E2E が参照するため変えない
- 同一詳細度のセレクタは記述順で勝敗が決まる（例: `.hourChip[data-selected="true"]` はサイド配色より後に書く）

## @keyframes の置き場所（重要・事故歴あり）

**keyframes は必ず、それを `animation:` で参照する `*.module.css` の中に置く**。
CSS Modules は animation 名をモジュールスコープでハッシュ化するため、globals.css のグローバル
keyframes をモジュールから参照すると名前が一致せず**アニメーションが黙って止まる**
（2026-08 の移行時に波・心拍・血管点滅・めまい・トースト・行ポップの全部が停止した）。
複数コンポーネントで共有するときはフォルダ共有 module に keyframes + クラスを置く
（例: `meds/meds.module.css` の `.isMoved` + `rowpop`）。

視覚回帰は `animations: "disabled"` で撮るためこの事故を検知できない。
**アニメーションの実動作は [e2e/animations.spec.ts](../../e2e/animations.spec.ts) が
`getAnimations()` / `animationstart` で検証する**。アニメーションを追加したらここにもテストを足す。

## 視覚回帰（見た目を変えたら必ず）

- `npx playwright test --project=visual` — 20ショットをベースラインとピクセル比較（`maxDiffPixels: 0`）
- **意図した見た目の変更**をしたら、ユーザの目視OK後に `npx playwright test --project=visual --update-snapshots` でベースラインを更新し、PNGの差分もコミットに含める
- ベースライン（`e2e/__screenshots__/`）は **Windowsローカル専用**。別OSで `--update-snapshots` しない（全ショットが差分になる）
- 撮影対象を増やすときは `e2e/visual.spec.ts` に追加（シードは `e2e/visual-helpers.ts`。localStorage `{state, version:2}` エンベロープ直接注入方式）
