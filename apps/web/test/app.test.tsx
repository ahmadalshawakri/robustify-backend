import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockApi, renderApp } from "./render";

const signedOut = () => ({
  status: 401,
  body: { error: { code: "unauthorized", message: "Sign in" } },
});

const printer = {
  id: 5,
  username: "yousef.ali",
  email: "yousef.ali@robustify.demo",
  role: "EMPLOYEE",
  department: "PRINTING",
};

describe("routing", () => {
  it("sends signed-out visitors to sign in, remembering where they were going", async () => {
    mockApi({ "GET /api/auth/me": signedOut });
    const router = renderApp("/orders/7");

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toBe("?from=%2Forders%2F7");
  });

  it("keeps employees out of admin pages", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: { user: printer } }),
      "GET /api/orders": () => ({ status: 200, body: { orders: [] } }),
    });
    const router = renderApp("/dashboard");

    await waitFor(() => expect(router.state.location.pathname).toBe("/my-work"));
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });
});

describe("sign in", () => {
  it("checks the form before calling the API", async () => {
    const fetchMock = mockApi({ "GET /api/auth/me": signedOut });
    renderApp("/login");

    await userEvent.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findAllByText(/required|at least/i)).not.toHaveLength(0);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/auth/login"))).toBe(false);
  });

  it("signs in and lands on the user's home page", async () => {
    let user: typeof printer | null = null;
    mockApi({
      "GET /api/auth/me": () => (user ? { status: 200, body: { user } } : signedOut()),
      "POST /api/auth/login": () => {
        user = printer;
        return { status: 200, body: { user } };
      },
      "GET /api/orders": () => ({ status: 200, body: { orders: [] } }),
    });
    const router = renderApp("/login");

    await userEvent.type(await screen.findByLabelText(/username/i), "yousef.ali");
    await userEvent.type(screen.getByLabelText(/password/i), "demo1234");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/my-work"));
  });
});

describe("complaints", () => {
  const complaint = {
    id: 1,
    defect: "Colour mismatch",
    comment: null,
    cost: 80,
    status: "OPEN",
    createdAt: "2026-10-01T10:00:00Z",
    resolvedAt: null,
    order: { id: 42, status: "COMPLETED", paperType: "LASER", quantity: 100 },
    customer: { id: 1, name: "Al Noor Bakery" },
    responsible: { id: 5, username: "yousef.ali", department: "PRINTING" },
  };

  it("are read-only for employees", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: { user: printer } }),
      "GET /api/complaints": () => ({ status: 200, body: { complaints: [complaint] } }),
    });
    renderApp("/complaints");

    expect(await screen.findByText("Colour mismatch")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resolve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sales" })).not.toBeInTheDocument();
  });
});

describe("public demo", () => {
  it("offers one-click sign-in for each demo role", async () => {
    let user: typeof printer | null = null;
    const fetchMock = mockApi({
      "GET /api/auth/me": () => (user ? { status: 200, body: { user } } : signedOut()),
      "GET /api/auth/demo": () => ({
        status: 200,
        body: {
          enabled: true,
          accounts: [
            { username: "yousef.ali", label: "Printer", description: "Works the printing stage" },
          ],
        },
      }),
      "POST /api/auth/demo": () => {
        user = printer;
        return { status: 200, body: { user } };
      },
      "GET /api/orders": () => ({ status: 200, body: { orders: [] } }),
    });
    const router = renderApp("/login");

    await userEvent.click(await screen.findByRole("button", { name: /Printer/ }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/my-work"));
    const demoCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith("/auth/demo") && init?.method === "POST",
    );
    expect(JSON.parse(String(demoCall?.[1]?.body))).toEqual({ username: "yousef.ali" });
  });
});
