import { expect, test } from "@playwright/test";

test.describe("検索除け", () => {
  test("metaタグ robots が noindex, nofollow", async ({ page }) => {
    await page.goto("/");
    const content = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute("content");
    expect(content).toContain("noindex");
    expect(content).toContain("nofollow");
  });

  test("robots.txt が全クローラーをDisallow", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Disallow: /");
  });
});
