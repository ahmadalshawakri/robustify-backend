export interface FieldIssue {
  path: string;
  message: string;
}

/** An error response from the API: `{ error: { code, message, details? } }`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: FieldIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function api<T>(path: string, options: { method?: Method; body?: unknown } = {}) {
  const { method = "GET", body } = options;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network", "Can't reach the server. Check your connection.");
  }

  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (data as { error?: { code: string; message: string; details?: FieldIssue[] } })
      ?.error;
    throw new ApiError(
      res.status,
      error?.code ?? "error",
      error?.message ?? `Request failed (${res.status})`,
      error?.details,
    );
  }
  return data as T;
}

/** Builds `?a=1&b=2`, skipping empty values. */
export function query(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
