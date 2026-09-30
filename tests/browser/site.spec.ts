import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  // Browsing a connected project must not create test engagement on real articles.
  await page.route("**/api/engagement", (route) =>
    route.fulfill({ json: { ok: true, likes: 0, liked: false } }),
  );
});
test("search, empty states and request navigation", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "What problem are you trying to fix?" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search problems and solutions" })
    .fill("codexunmatchedf5a38a4dcc");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=codexunmatchedf5a38a4dcc/);
  await expect(
    page.getByRole("heading", { name: "No matching solution yet" }),
  ).toBeVisible();
  await page
    .locator("main")
    .getByRole("link", { name: "Request a solution", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What has stopped working?" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("failed request keeps the entered problem rather than claiming receipt", async ({
  page,
}) => {
  await page.route("**/api/requests", (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: "Requests are temporarily unavailable. Please try again.",
      },
    }),
  );
  await page.goto("/request");
  await page.getByLabel("What is the problem?").fill("SSD not detected");
  await page
    .getByLabel("Describe what happens")
    .fill("Windows installer does not show the internal SSD at all.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status")).toContainText(
    "temporarily unavailable",
  );
  await expect(page.getByLabel("What is the problem?")).toHaveValue(
    "SSD not detected",
  );
  await expect(
    page.getByRole("button", { name: "Send request" }),
  ).toBeEnabled();
});
test("admin and unknown articles do not reveal private data", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", {
      name: /Connect your technician workspace|Sign in to your workbench\./,
    }),
  ).toBeVisible();
  await page.goto("/solutions/private-draft");
  await expect(
    page.getByRole("heading", { name: "That solution is not available." }),
  ).toBeVisible();
});
test("duplicate search filters remain usable", async ({ page }) => {
  const response = await page.goto(
    "/solutions?q=storage&q=ignored&os=Windows&os=Linux",
  );
  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Problems, meet solutions." }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Operating system", exact: true }),
  ).toHaveValue("Windows");
  await expect(
    page.getByRole("textbox", { name: "Search problems and solutions" }),
  ).toHaveValue("storage");
});
test("SEO endpoints and mobile overflow", async ({ page, request }) => {
  expect((await request.get("/sitemap.xml")).ok()).toBe(true);
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /admin",
  );
  expect(await (await request.get("/rss.xml")).text()).toContain("<rss");
  for (const route of [
    "/",
    "/solutions",
    "/categories",
    "/laptops",
    "/support",
    "/request",
    "/login",
  ]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      route,
    ).toBe(true);
  }
});
test("cross-origin writes are rejected", async ({ request }) => {
  const response = await request.post("/api/comments", {
    headers: { origin: "https://attacker.invalid" },
    data: { name: "Attacker", body: "test" },
  });
  expect(response.status()).toBe(403);
});
