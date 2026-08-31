import { OCR_API_PATH } from "./constants";

/** OCR結果の改行・連続空白を1つの半角スペースに正規化する */
export function cleanupOcrText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** 行頭の箇条書き記号・番号(-, ・, *, 1. , 1) など)を取り除く */
function stripBulletPrefix(line: string): string {
  return line
    .trim()
    .replace(/^[-*•・●▪◦‣]+\s*/, "")
    .replace(/^\d+[.、)]\s*/, "");
}

function namesFromNewlines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => cleanupOcrText(stripBulletPrefix(line)))
    .filter((line) => line.length > 0);
}

/** `{"medicines": [...]}` または `[...]` 形式のJSON文字列を薬剤名配列にする。JSONでなければnull */
function namesFromJson(text: string): string[] | null {
  try {
    const data: unknown = JSON.parse(text);
    const list = Array.isArray(data)
      ? data
      : (data as { medicines?: unknown } | null)?.medicines;
    if (!Array.isArray(list)) return null;
    return list
      .filter((v): v is string => typeof v === "string")
      .map((v) => cleanupOcrText(v))
      .filter((v) => v.length > 0);
  } catch {
    return null;
  }
}

/**
 * OCRの生テキストを薬剤名候補の配列にパースする。
 * サーバー側でJSON出力を指示・強制しているため基本はJSONとして解釈するが、
 * コードフェンス付きJSONや、万一プレーンテキストで返ってきた場合(1行1薬剤名想定)にも
 * フォールバックして解釈する。1件も読み取れなければ空配列を返す。
 */
export function parseMedicineNames(raw: string): string[] {
  const trimmed = raw.trim();

  const direct = namesFromJson(trimmed);
  if (direct) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const inner = namesFromJson(fenced[1].trim());
    if (inner) return inner;
  }

  return namesFromNewlines(trimmed);
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${blob.type || "image/jpeg"};base64,${btoa(binary)}`;
}

/**
 * 画像から薬剤名候補を読み取る(1枚の写真に複数の薬が写っていてもよい)。
 * 画像はサーバー側プロキシ(/api/ocr)経由でGroq Vision APIに送られる
 * (APIキーをブラウザに露出させないため、直接外部APIは呼ばない)。
 * サーバー側で読み取り→(設定されていれば)実在薬剤名への訂正→パース まで済ませた
 * 配列が返る。失敗時は例外を投げる(呼び出し側でエラー状態にする)。
 */
export async function recognizeMedicineNames(image: Blob): Promise<string[]> {
  const dataUrl = await blobToDataUrl(image);
  const res = await fetch(OCR_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl }),
  });
  if (!res.ok) {
    throw new Error(`OCR failed: ${res.status}`);
  }
  const { names } = (await res.json()) as { names: string[] };
  return names;
}
