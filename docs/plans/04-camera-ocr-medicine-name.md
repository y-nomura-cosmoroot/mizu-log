# おくすり名カメラOCR入力機能

## Context

「おくすり」マスタ登録（[src/components/meds/MedicineMasterCard.tsx](../../src/components/meds/MedicineMasterCard.tsx)）では、薬の名前を `<input>` へのテキスト直接入力で登録している。この方式だと、入院患者が薬のパッケージや薬袋を見ながら手でタイプする負担がある。カメラで薬名を撮影し、OCRでテキストを抽出して名前欄に反映することで、この打鍵の手間をなくしたい。

**対応環境は Android・iOS・PC（テスト用）**。カメラ起動は `getUserMedia` によるアプリ内ライブカメラプレビュー＋シャッターボタン方式（secure context = HTTPS/localhostであればAndroid Chrome・iOS Safari・デスクトップいずれでも同じコードパスで動作し、開発機のWebカメラでもそのまま試せる）。

**OCRエンジンはGroq Vision API（サーバー側プロキシ経由）を採用**。当初はクライアント完結のTesseract.js（自前ホストのwasm＋日本語言語データ）を実装したが、実機検証で薬パッケージ写真（ロゴ・図柄混じり）を読み取らせたところ意味不明な結果になり、PSM（ページ分割モード）調整でも実用的な精度に至らなかった。ユーザーの提案でVision LLM（Groq）に切り替えたところ、「薬剤名だけを抜き出す」プロンプトで狙った情報だけを読み取れるため、この用途への適合度が高いと判断した。Tesseract.js関連一式（`public/tesseract/`・依存パッケージ・postinstallスクリプト）は完全に削除している。

この切り替えに伴い、「サーバー同期なし」の設計方針（[CLAUDE.md](../../CLAUDE.md)）に、画像解析のためだけの一時的なサーバープロキシが例外として加わる。健康記録データ自体は引き続きlocalStorageのみで、Groqへは撮影画像1枚を都度送信するのみ（保存・ログしない）。ネットワーク必須になる点、外部サービスに画像を送信する点はユーザーに説明の上で合意済み。抽出結果は自動確定せず、**「撮影→OCR実行→編集可能なテキストとして表示→ユーザーが確認・修正して保存」**というフローにする（OCR失敗時も同じ入力欄がそのまま手入力欄になる）。

UIは「＋ おくすりを追加」ボタンの下に新規ボタン「📷 カメラからおくすりを追加」を追加し、これをタップすると新規の薬エントリをカメラ撮影から作成する専用フローが開く（既存行の編集フローには手を入れない）。

## 実装方針（実装済み）

### 1. サーバー側プロキシ `src/app/api/ocr/route.ts`

- Groq Vision API（`https://api.groq.com/openai/v1/chat/completions`、OpenAI互換のchat completions形式）をサーバー側から呼び出すRoute Handler。APIキー（`GROQ_API_KEY`）をブラウザに露出させないための唯一の目的で、データの永続化は一切行わない。
- モデルIDは `GROQ_VISION_MODEL` 環境変数で指定（ハードコードしない。Groqのモデル一覧は変わりうるため、コンソールで確認した値を都度設定する運用）。
- プロンプトは「薬剤の名前(製品名)だけを、ロゴや注意書きなど他の文字は無視して書き出す」よう明示し、パッケージ写真特有のノイズ（ロゴ・図柄・注意書き）を狙って除外する。
- `GROQ_API_KEY`/`GROQ_VISION_MODEL` 未設定時・Groq側エラー時は明確なエラーレスポンス（500/502）を返し、クライアント側は必ず手入力にフォールバックする。
- `.env.local`（gitignore対象）にキーとモデルIDを設定する。Claude Code自身は`.env*`への書き込みが権限設定で禁止されているため、ユーザーが直接作成・編集する。

### 2. クライアント側 `src/lib/ocr.ts`

- `recognizeMedicineName(image: Blob): Promise<string>` は画像をdata URL化（`blobToDataUrl`、`FileReader`ではなく`Blob.arrayBuffer()`+`btoa`のチャンク処理で実装。Node/ブラウザ両方でテスト可能にするため）し、`/api/ocr`（`OCR_API_PATH`定数、[src/lib/constants.ts](../../src/lib/constants.ts)）へPOSTする。
- レスポンスが`!ok`なら例外を投げる（呼び出し側でエラー状態にする）。

### 3. UI/UXフロー — ボトムシート `CameraAddMedicineSheet`

既存の「なおす」シート（[EditSheet.tsx](../../src/components/sheets/EditSheet.tsx)、`useUiStore` の `sheet: SheetState` 判別共用体で駆動）とは**別スロット**として実装済み。`useUiStore.ts` に `cameraSheet: CameraSheetState | null` を追加し、`openCameraSheet` / `patchCameraSheet` / `closeCameraSheet` を実装。

```ts
type CameraSheetState = {
  status: "camera" | "recognizing" | "done" | "error";
  cameraPhase: "starting" | "live" | "unavailable"; // status==="camera"のときのライブカメラ起動状況
  imageUrl: string | null;
  text: string; // statusに関わらず常に編集可能
  errorMsg?: string;
} | null;
```

**フロー:**
1. 「📷 カメラからおくすりを追加」タップ→`openCameraSheet()`（`status:"camera"`）。
2. `getUserMedia({ video: { facingMode: "environment" } })` を試行。成功時は`cameraPhase`を"live"に更新（**注**: `<video>`要素は`cameraPhase==="live"`になって初めてDOMに現れるため、streamのアタッチはstream取得時ではなく、`cameraPhase`が"live"になった後の別`useEffect`で行う必要があった。最初の実装ではこの順序を誤り、カメラLEDは点灯するが映像が出ない不具合が発生し修正した）。失敗時は"unavailable"にし「写真を選ぶ」（`capture`属性なしのhidden file input）が主導線になる。
3. シャッターで現在のビデオフレームを`<canvas>`に描画→`toBlob()`→全トラック停止→`recognizeMedicineName(blob)`を呼ぶ。
4. 成功: `status:"done"`、テキスト欄に反映。失敗: `status:"error"`、テキスト欄は空で編集可能なまま。
5. 「これでOK」→ `addMedicineWithName(text.trim())`（[useAppStore.ts](../../src/stores/useAppStore.ts)の新規アクション、`addMedicine()`とは別に新設）→ `closeCameraSheet()` → トースト表示。

### 4. スタイル共通化

`EditSheet.module.css` の `.sheet`/`.title`/`.footRow`/`.cancelBtn`/`.saveBtn` を `src/components/sheets/sheets.module.css`（フォルダ共有module）に切り出し、`CameraAddMedicineSheet`と共有（[.claude/rules/styling.md](../../.claude/rules/styling.md)の規約通り）。既存`EditSheet`の見た目は不変。

## テスト方針（実装済み）

- **Vitest**: `src/lib/__tests__/ocr.test.ts` — `cleanupOcrText`、`recognizeMedicineName`（`fetch`をモックし、`/api/ocr`への POSTペイロード・エラー時の例外送出を検証）。
- **Playwright**: `e2e/meds-camera.spec.ts` — `page.route("**/api/ocr", ...)` で成功/エラーレスポンスをモックし決定的にテスト（実際のGroq APIは自動テストでは呼ばない。課金・外部依存・非決定性を避けるため）。カメラ自体は`setInputFiles`で代替。
- **視覚回帰**: ライブカメラ待機中・エラー状態は決定的に再現できるためベースライン化可能。OCR成功後の実際の見た目はモックしたテキストで確認できる。

## 検証手順

1. `npm run test` / `npm run lint` / `npm run build`（`NEXT_DIST_DIR`を指定し、ユーザーの`.next`/ポート3000には触れないこと）
2. `.env.local` に `GROQ_API_KEY` / `GROQ_VISION_MODEL` を設定（ユーザーが直接作成）
3. `npm run dev` でユーザー自身が実機確認（PCのWebカメラ→ライブプレビュー→シャッター→OCR結果→修正→追加）
4. UIの見た目についてユーザーの目視OKを得てから、`npx playwright test --project=chromium` / `--project=visual --update-snapshots`
