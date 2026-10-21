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
