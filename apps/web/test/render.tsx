import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { vi } from "vitest";
import { routes } from "../src/App";
import { AuthProvider } from "../src/auth/AuthProvider";
import { theme } from "../src/theme";

type Handler = (init?: RequestInit) => { status: number; body?: unknown };

/** Stubs fetch with one handler per "METHOD /path"; anything else is a 404. */
export function mockApi(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, "http://localhost");
    const key = `${init?.method ?? "GET"} ${url.pathname}`;
    const handler = handlers[key];
    const { status, body } = handler
      ? handler(init)
      : { status: 404, body: { error: { code: "not_found", message: `No mock for ${key}` } } };
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function renderApp(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return router;
}
