import { type Page, expect, test } from "@playwright/test";

async function signInAs(page: Page, role: "Admin" | "Designer" | "Printer") {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(`^${role}`) }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test("an admin moves a new order into design", async ({ page }) => {
  await signInAs(page, "Admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("In production")).toBeVisible();

  await page.goto("/orders?status=NOT_STARTED");
  await page.locator("tbody tr").first().click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  await page.getByRole("button", { name: "Move to design" }).click();
  await expect(page.getByText("Not started → Design")).toBeVisible();
});

test("an employee works their own stage and is kept out of admin pages", async ({ page }) => {
  await signInAs(page, "Designer");
  await expect(page.getByRole("heading", { name: /Hello, Omar/ })).toBeVisible();
  await expect(page.getByText("Waiting in Design")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/my-work$/);
  await expect(page.getByRole("link", { name: "Sales" })).toHaveCount(0);
});

test("sales, quality and stock pages load for an admin", async ({ page }) => {
  await signInAs(page, "Admin");
  for (const [path, heading] of [
    ["/invoices", "Sales"],
    ["/quality", "Cost of quality"],
    ["/inventory", "Stock"],
    ["/complaints", "Complaints"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
});

test("a printer moves work on from a phone @phone", async ({ page }) => {
  await signInAs(page, "Printer");
  await expect(page.getByRole("heading", { name: /Hello, Yousef/ })).toBeVisible();
  const moves = page.getByRole("button", { name: "Cutting" });
  await expect(moves.first()).toBeVisible();
  const before = await moves.count();
  await moves.first().click();
  await expect(moves).toHaveCount(before - 1);
});

test("signing out returns to the sign-in page", async ({ page }) => {
  await signInAs(page, "Admin");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});
