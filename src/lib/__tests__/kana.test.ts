import { describe, expect, it } from "vitest";
import { stripDakuten } from "../kana";

describe("stripDakuten", () => {
  it("濁点・半濁点付きカタカナを無印カタカナにする(パ→ハ、バ→ハ)", () => {
    expect(stripDakuten("ルパフィン")).toBe("ルハフィン");
    expect(stripDakuten("ルバフィン")).toBe("ルハフィン");
  });
  it("濁点・半濁点の無い文字はそのまま", () => {
    expect(stripDakuten("プログラフ")).toBe("フロクラフ");
  });
  it("ひらがなにも対応する", () => {
    expect(stripDakuten("がっこう")).toBe("かっこう");
  });
  it("空文字は空文字", () => {
    expect(stripDakuten("")).toBe("");
  });
});
