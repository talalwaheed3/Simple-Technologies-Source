import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/engagement", (route) =>
    route.fulfill({ json: { ok: true, likes: 0, liked: false } }),
  );
});

test("homepage, category and pagination have canonical URLs", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/?$/,
  );
  await page.goto("/solutions?category=Windows&sort=newest&utm_source=test");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/solutions\?category=Windows$/,
  );
  await expect(
    page.getByRole("heading", { name: "Windows troubleshooting", exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute(
    "content",
    /noindex/,
  );
  await page.goto("/solutions");
  const nextPage = page.getByRole("link", { name: "Next", exact: true });
  if (await nextPage.count()) {
    await nextPage.click();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/solutions\?page=2$/,
    );
    await expect(
      page.getByRole("link", { name: "Previous", exact: true }),
    ).toHaveAttribute("href", "/solutions");
  }
});

test("search views and nonexistent result pages cannot enter the index", async ({
  page,
}) => {
  await page.goto(
    "/solutions?q=codexunmatchedf5a38a4dcc&sort=newest&utm_source=test",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/solutions\?q=codexunmatchedf5a38a4dcc$/,
  );
  await page.goto("/solutions?page=10000");
  await expect(
    page.getByRole("heading", { name: "That solution is not available." }),
  ).toBeVisible();
  expect(
    await page
      .locator('meta[name="robots"]')
      .evaluateAll((elements) =>
        elements.some((element) =>
          element.getAttribute("content")?.includes("noindex"),
        ),
      ),
  ).toBe(true);
});

test("crawler endpoints expose only canonical public articles and reviewed image routes", async ({
  request,
}) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /api/media/");
  expect(robots).toContain("Disallow: /api/media/*?*preview=");
  expect(robots).toContain("Disallow: /api/");
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  expect(xml).not.toMatch(
    /<loc>[^<]*(?:\/admin|\/login|preview=|\?q=|private-draft)/,
  );
  const articleUrls = [
    ...xml.matchAll(/<loc>(https?:\/\/[^<]+\/solutions\/[^<]+)<\/loc>/g),
  ].map((match) => match[1]);
  // A fresh public response verifies visibility without creating engagement.
  // Empty development databases still exercise all static discovery assertions.
  for (const url of articleUrls.slice(0, 2)) {
    const article = await request.get(new URL(url).pathname);
    expect(article.ok()).toBe(true);
    expect(await article.text()).not.toContain(
      'name="robots" content="noindex',
    );
  }
});

test("published article metadata matches visible author and reviewed images", async ({
  page,
}) => {
  await page.goto("/solutions");
  const link = page.locator('main a[href^="/solutions/"]').first();
  test.skip(
    !(await link.count()),
    "No published articles in this development database",
  );
  await link.click();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /max-image-preview:large/,
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  const data = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) =>
      scripts.flatMap((script) => {
        const value = JSON.parse(script.textContent || "{}");
        return Array.isArray(value) ? value : value["@graph"] || [value];
      }),
    );
  const article = data.find(
    (item) => Array.isArray(item["@type"]) && item["@type"].includes("Article"),
  );
  expect(article).toBeTruthy();
  expect(article.headline).toBe(await page.locator("h1").textContent());
  expect(article.author.url).toMatch(/\/about$/);
  await expect(
    page
      .locator("article")
      .getByRole("link", { name: article.author.name, exact: true }),
  ).toHaveAttribute("href", "/about");
  expect(new Date(article.datePublished).getTime()).toBeLessThanOrEqual(
    Date.now(),
  );
  expect(article.url).toBe(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
  );
  for (const image of article.image || []) {
    const path = new URL(image).pathname;
    expect(path).toMatch(/^\/api\/media\/[a-f0-9-]+$/);
    await expect(page.locator(`article img[src^="${path}"]`)).toHaveCount(1);
  }
  expect(
    data
      .find((item) => item["@type"] === "BreadcrumbList")
      .itemListElement.at(-1).item,
  ).toBe(article.url);
});
