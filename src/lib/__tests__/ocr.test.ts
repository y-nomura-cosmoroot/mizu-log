import { afterEach, describe, expect, it, vi } from "vitest";
import { OCR_API_PATH } from "../constants";
import { cleanupOcrText, parseMedicineNames, recognizeMedicineNames } from "../ocr";

describe("cleanupOcrText", () => {
  it("改行・連続空白を1つの半角スペースにまとめてtrimする", () => {
    expect(cleanupOcrText("グラセプター\n\n 1mg  ")).toBe("グラセプター 1mg");
  });
  it("空文字はそのまま空文字", () => {
    expect(cleanupOcrText("   \n  ")).toBe("");
  });
});

describe("parseMedicineNames", () => {
  it("{medicines:[...]} 形式のJSONを配列にする(サーバーに指示している標準形式)", () => {
    expect(
      parseMedicineNames('{"medicines": ["グラセプター", "セルセプト", "プレドニン"]}')
    ).toEqual(["グラセプター", "セルセプト", "プレドニン"]);
  });
  it("medicinesが空配列のJSONは空配列を返す", () => {
    expect(parseMedicineNames('{"medicines": []}')).toEqual([]);
  });
  it("トップレベルのJSON配列も受け付ける", () => {
    expect(parseMedicineNames('["グラセプター", "セルセプト"]')).toEqual([
      "グラセプター",
      "セルセプト",
    ]);
  });
  it("```json ...``` のコードフェンス付きJSONも解釈する", () => {
    expect(
      parseMedicineNames('```json\n{"medicines": ["グラセプター"]}\n```')
    ).toEqual(["グラセプター"]);
  });
  it("JSON要素の前後の空白は除去する", () => {
    expect(parseMedicineNames('{"medicines": ["  グラセプター  ", ""]}')).toEqual([
      "グラセプター",
    ]);
  });

  describe("JSONで返らなかった場合のフォールバック(改行区切りテキスト)", () => {
    it("改行区切りの複数行をそのまま配列にする", () => {
      expect(parseMedicineNames("グラセプター\nセルセプト\nプレドニン")).toEqual([
        "グラセプター",
        "セルセプト",
        "プレドニン",
      ]);
    });
    it("箇条書き記号・番号を取り除く", () => {
      expect(
        parseMedicineNames("- グラセプター\n・セルセプト\n1. プレドニン\n2) タケプロン")
      ).toEqual(["グラセプター", "セルセプト", "プレドニン", "タケプロン"]);
    });
    it("空行は無視する", () => {
      expect(parseMedicineNames("グラセプター\n\n\nセルセプト\n")).toEqual([
        "グラセプター",
        "セルセプト",
      ]);
    });
    it("1件だけの単一行も配列にする", () => {
      expect(parseMedicineNames("グラセプター")).toEqual(["グラセプター"]);
    });
    it("空文字なら空配列", () => {
      expect(parseMedicineNames("")).toEqual([]);
    });
  });
});

describe("recognizeMedicineNames", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("画像をdata URLにしてサーバー側プロキシ(/api/ocr)へPOSTし、パース済みの薬剤名配列を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ names: ["セルセプト", "プレドニン"] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const blob = new Blob(["dummy-image-bytes"], { type: "image/png" });
    const result = await recognizeMedicineNames(blob);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(OCR_API_PATH);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    const body = JSON.parse(init.body);
    expect(body.image).toMatch(/^data:image\/png;base64,/);
    expect(result).toEqual(["セルセプト", "プレドニン"]);
  });

  it("1件も読み取れなければ空配列を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ names: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const blob = new Blob(["dummy"], { type: "image/png" });
    expect(await recognizeMedicineNames(blob)).toEqual([]);
  });

  it("サーバー側プロキシがエラーを返したら例外を投げる", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502 });
    vi.stubGlobal("fetch", fetchMock);

    const blob = new Blob(["dummy"], { type: "image/png" });
    await expect(recognizeMedicineNames(blob)).rejects.toThrow("OCR failed: 502");
  });
});
