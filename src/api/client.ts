import type { ResolvedConfig } from "../config/schema.ts";

export class LeonardoApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "LeonardoApiError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PUT";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export class LeonardoClient {
  constructor(private readonly cfg: ResolvedConfig) {}

  async request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(this.cfg.baseUrl.replace(/\/$/, "") + path);
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.cfg.apiKey}`,
        ...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });

    const text = await res.text();
    let parsed: unknown = text;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // leave as text
      }
    }

    if (!res.ok) {
      const detail =
        typeof parsed === "object" && parsed !== null
          ? JSON.stringify(parsed)
          : String(parsed);
      throw new LeonardoApiError(res.status, parsed, `Leonardo API ${res.status}: ${detail}`);
    }

    return parsed as T;
  }

  // Convenience helpers
  get<T>(path: string, query?: RequestOptions["query"]): Promise<T> {
    return this.request<T>(path, { method: "GET", query });
  }
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body });
  }
  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}
