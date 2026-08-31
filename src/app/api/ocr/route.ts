import { NextResponse } from "next/server";
import { DRUG_REFERENCE_ENTRIES, type DrugReferenceKind } from "@/lib/drugReferenceList";
import { stripDakuten } from "@/lib/kana";
import { parseMedicineNames } from "@/lib/ocr";

const KIND_LABEL: Record<DrugReferenceKind, string> = {
  generic_ingredient: "成分名",
  brand_product: "先発品",
  generic_product: "後発品",
};

const DRUG_REFERENCE_LIST_TEXT = DRUG_REFERENCE_ENTRIES.map(
  (e) => `${e.name}（${KIND_LABEL[e.kind]}）`
).join("\n");

/**
 * 候補の中に、濁点/半濁点を無視すればリスト内の薬剤名と一致するものがあれば
 * ヒント文にする(OCRは濁点「゛」・半濁点「゜」を見落とし/誤付与しやすいため、
 * 例:「ルパフィン」を「ルバフィン」と読み違えるケースを確実に拾うための決定的な補助)
 */
function findDakutenHints(names: string[]): string[] {
  return names.flatMap((n) => {
    const normalized = stripDakuten(n);
    const match = DRUG_REFERENCE_ENTRIES.find(
      (e) => e.name !== n && stripDakuten(e.name) === normalized
    );
    return match ? [`「${n}」は濁点/半濁点の違いを除けば「${match.name}」と一致します。`] : [];
  });
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const VISION_PROMPT =
  "この画像には薬のパッケージや薬袋が写っています。写っている薬剤の名前(製品名)を全て見つけてください。" +
  "ロゴ・注意書き・用法用量など薬剤名以外の文字は無視してください。" +
  '必ずJSON形式で、{"medicines": ["薬剤名1", "薬剤名2"]} という形のオブジェクトだけを返してください。' +
  '薬剤名が1つも読み取れない場合は {"medicines": []} を返してください。' +
  "説明文やコードブロックの装飾、JSON以外の文字列は一切付けないでください。";

const CONFIRM_PROMPT_HEADER =
  "以下はカメラで撮影した薬のパッケージ写真から、別のAIがOCRで読み取った薬剤名の候補です。" +
  "続けて、この施設で実際に使用されている薬剤名の一覧を「実在薬剤名リスト」として渡します。" +
  "各行の（）内は種別で、成分名=有効成分の一般名、先発品=先発医薬品の販売名、" +
  "後発品=後発医薬品(ジェネリック)の製品名です。" +
  "候補を1件ずつ確認し、読み取りミス(誤字・文字化け)によってリスト中の薬剤名と近い形になっているものが" +
  "あれば、そのリスト内の薬剤名に訂正してください。" +
  "OCRはカタカナの濁点「゛」・半濁点「゜」を特に見落とし/誤付与しやすい(例: 「ルパフィン」を" +
  "「ルバフィン」、「バ」を「パ」、「カ」を「ガ」のように読み違える)ので、" +
  "濁点・半濁点の有無や種類だけがリスト中の薬剤名と異なる候補は、積極的にリスト側の表記に訂正してください。" +
  "候補にメーカー名らしき文字列や「後発」「ジェネリック」を示す表記が含まれる場合は後発品または成分名を、" +
  "候補が単独の固有名詞に見える場合は先発品を優先して選んでください。" +
  "判断が難しい場合は種別にこだわらず、文字列として最も近いものを選んでください。" +
  "リストの中に十分近いものが見当たらない候補は、無理にリストへ合わせず候補のまま返してください。" +
  "入力された候補と同じ順序・同じ件数で対応させて返してください(訂正後の文字列に種別のラベルは含めないでください)。" +
  '回答は必ずJSON形式で {"medicines": ["訂正後の薬剤名1", "訂正後の薬剤名2"]} という形のオブジェクトだけを返してください。' +
  "説明文やコードブロックの装飾、JSON以外の文字列は一切付けないでください。";

/**
 * GroqのChat Completions(OpenAI互換)を呼び、応答テキスト(content)を返す。JSON出力を強制する。
 * stageは"読み取り"/"訂正"のようなログ用ラベル。失敗時はGroqのエラー本文もログに出す
 */
async function callGroq(
  apiKey: string,
  model: string,
  content: unknown,
  stage: string
): Promise<string> {
  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "(本文取得失敗)");
    console.error(
      `[ocr] ${stage}段でGroq APIエラー: status=${res.status} model=${model}\n${errBody}`
    );
    throw new Error(`Groq API error(${stage}): ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  const visionModel = process.env.GROQ_VISION_MODEL;
  const confirmModel = process.env.GROQ_CONFIRM_MODEL;
  if (!apiKey || !visionModel) {
    return NextResponse.json(
      { error: "GROQ_API_KEY / GROQ_VISION_MODEL が設定されていません" },
      { status: 500 }
    );
  }

  let image: unknown;
  try {
    ({ image } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "image is required" }, { status: 400 });
  }

  let visionText: string;
  try {
    visionText = await callGroq(
      apiKey,
      visionModel,
      [
        { type: "text", text: VISION_PROMPT },
        { type: "image_url", image_url: { url: image } },
      ],
      "読み取り"
    );
  } catch (e) {
    console.error("[ocr] 読み取り段でGroqへの到達・応答に失敗:", e);
    return NextResponse.json({ error: "failed to reach Groq (読み取り段)" }, { status: 502 });
  }

  const visionNames = parseMedicineNames(visionText);
  console.log("[ocr] 読み取り結果:", visionNames);
  if (visionNames.length === 0 || !confirmModel) {
    return NextResponse.json({ names: visionNames });
  }

  // 読み取り結果を実在する薬剤名に近づけて訂正する(この段が失敗しても読み取り結果自体は活かす)
  try {
    const dakutenHints = findDakutenHints(visionNames);
    const hintsText = dakutenHints.length > 0 ? `\n\nヒント:\n${dakutenHints.join("\n")}` : "";
    const confirmText = await callGroq(
      apiKey,
      confirmModel,
      `${CONFIRM_PROMPT_HEADER}\n\n実在薬剤名リスト:\n${DRUG_REFERENCE_LIST_TEXT}\n\n候補: ${JSON.stringify(visionNames)}${hintsText}`,
      "訂正"
    );
    const confirmedNames = parseMedicineNames(confirmText);
    console.log("[ocr] 訂正結果:", confirmedNames);
    if (confirmedNames.length > 0) {
      return NextResponse.json({ names: confirmedNames });
    }
    console.error("[ocr] 訂正段の応答から薬剤名を解釈できなかったため読み取り結果をそのまま使用");
  } catch (e) {
    console.error("[ocr] 訂正段でGroqへの到達・応答に失敗したため読み取り結果をそのまま使用:", e);
  }

  return NextResponse.json({ names: visionNames });
}
