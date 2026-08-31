/**
 * docs/drugreference.csv (name,kind,category) を読み込み、
 * src/lib/drugReferenceList.ts を生成する。OCR訂正段(GROQ_CONFIRM_MODEL)が
 * 実在薬剤名に近づけて訂正する際の照合リストとして使う。
 *
 * kind: "generic_ingredient"(成分の一般名) / "brand_product"(先発品の販売名) /
 *       "generic_product"(後発品の製品名)
 *
 * docs/drugreference.csv が今後の一次情報。薬剤名を追加・修正するときは
 * このCSVを直接編集してから本スクリプトを再実行する
 * (`npm run generate:drug-list`)。外部パッケージへの依存はない。
 *
 * CSVの書式: 各フィールドを"..."で囲み、フィールド内の"は""でエスケープする
 * (このスクリプト自身が書き出す形式と同じにすること)。
 */
const fs = require("fs");
const path = require("path");

const SOURCE_FILE = path.join(__dirname, "..", "docs", "drugreference.csv");
const OUTPUT_FILE = path.join(__dirname, "..", "src", "lib", "drugReferenceList.ts");

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const [headerLine, ...rows] = lines;
  const columns = splitCsvLine(headerLine);
  return rows.map((line) => {
    const values = splitCsvLine(line);
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = values[i] ?? "";
    });
    return obj;
  });
}

function main() {
  const csvText = fs.readFileSync(SOURCE_FILE, "utf8");
  const entries = parseCsv(csvText);

  const body =
    "// このファイルは scripts/generate-drug-reference-list.js が\n" +
    "// docs/drugreference.csv から自動生成したものです。手で編集しないでください。\n" +
    "// 薬剤名を追加・修正するときは docs/drugreference.csv を編集してから再実行してください。\n\n" +
    '/** "generic_ingredient"(成分の一般名) / "brand_product"(先発品の販売名) / "generic_product"(後発品の製品名) */\n' +
    'export type DrugReferenceKind = "generic_ingredient" | "brand_product" | "generic_product";\n\n' +
    "export interface DrugReferenceEntry {\n" +
    "  name: string;\n" +
    "  kind: DrugReferenceKind;\n" +
    "  category: string;\n" +
    "}\n\n" +
    "/** OCR訂正段(GROQ_CONFIRM_MODEL)が実在薬剤名への訂正に使う照合リスト */\n" +
    `export const DRUG_REFERENCE_ENTRIES: DrugReferenceEntry[] = ${JSON.stringify(entries, null, 2)};\n`;

  fs.writeFileSync(OUTPUT_FILE, body, "utf8");
  console.log(
    `generated ${entries.length} entries -> ${path.relative(process.cwd(), OUTPUT_FILE)}`
  );
}

main();
