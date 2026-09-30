import { test, expect } from "@playwright/test";

test("theme labels can be clicked repeatedly without closing the menu or crashing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("crash", () => errors.push("Renderer crashed"));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/request");
  const menu = page.locator(".theme-picker");
  await page.getByLabel("Color theme", { exact: true }).click();
  for (let cycle = 0; cycle < 5; cycle++) {
    for (const name of ["Light", "Dark", "Use device setting"]) {
      // Click the label text, not the radio: the native label focus/click
      // sequence triggered the reported Chrome renderer crash.
      await menu.getByText(name, { exact: true }).click();
      await expect(
        menu.getByRole("radio", { name, exact: true }),
      ).toBeChecked();
      await expect(menu).toHaveAttribute("open", "");
    }
  }
  // The dropdown overlaps the heading's center on narrow screens.
  await page
    .getByRole("heading", { level: 1 })
    .click({ position: { x: 5, y: 5 } });
  await expect(menu).not.toHaveAttribute("open", "");
  await page.getByLabel("Color theme", { exact: true }).click();
  await page.getByRole("radio", { name: "Use device setting" }).focus();
  await page.keyboard.press("Tab");
  await expect(menu).not.toHaveAttribute("open", "");
  expect(
    await menu.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("theme follows the device, persists an override, and syncs tabs", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Color theme", { exact: true }).click();
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await page.keyboard.press("Escape");
  await expect(page.locator(".theme-picker")).not.toHaveAttribute("open", "");
  await page.goto("/request");
  await page.getByLabel("What is the problem?").fill("Keep this unsaved text");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const second = await context.newPage();
  await second.goto("/login");
  await expect(second.locator("html")).toHaveAttribute("data-theme", "dark");
  await second.getByLabel("Color theme", { exact: true }).click();
  await second.getByRole("radio", { name: "Light", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByLabel("What is the problem?")).toHaveValue(
    "Keep this unsaved text",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Color theme", { exact: true }).click();
  await page.getByRole("radio", { name: "Use device setting" }).check();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});

test("theme remains usable when browser storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Color theme", { exact: true }).click();
  await page.getByRole("radio", { name: "Light", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
});

test("saved theme is applied before application JavaScript hydrates", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("simple-technologies-theme-v1", "dark"),
  );
  await page.route("**/_next/**/*.js*", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(16, 28, 41)",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
