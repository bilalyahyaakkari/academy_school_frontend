import { auth } from "@/auth";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & {
  /** Override the fetched URL (e.g. for the login endpoint where there is no session yet). */
  unauthenticated?: boolean;
  /** Token to use instead of reading from the session (e.g. during signIn). */
  tokenOverride?: string;
};

async function buildHeaders(opts: RequestOptions): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (!opts.unauthenticated) {
    const token = opts.tokenOverride ?? (await auth())?.accessToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // Merge user-supplied headers last so they win.
  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers as Record<string, string>)) {
      headers[k] = v;
    }
  }
  return headers;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const headers = await buildHeaders(opts);

  const res = await fetch(url, {
    ...opts,
    headers,
    // Server components fetch fresh per request; opt out of build-time caching.
    cache: "no-store",
  });

  if (!res.ok) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      // ignore parse errors
    }
    const message =
      (body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, {
      ...opts,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, {
      ...opts,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, {
      ...opts,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: "DELETE" }),
};
