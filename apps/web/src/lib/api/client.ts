// FastAPI /openapi.json owns this contract. Generate resource types when they exist.
export interface HealthResponse {
  status: "ok";
  service: "kootu-api";
  version: string;
  environment: "development" | "test" | "production";
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message?: string,
  ) {
    super(message || `kootu API returned HTTP ${status}.`);
    this.name = "ApiError";
  }
}

const REQUEST_TIMEOUT_MS = 8000;

function isHealthResponse(data: unknown): data is HealthResponse {
  if (typeof data !== "object" || data === null) return false;
  const value = data as Record<string, unknown>;
  return (
    value.status === "ok" &&
    value.service === "kootu-api" &&
    typeof value.version === "string" &&
    typeof value.environment === "string" &&
    ["development", "test", "production"].includes(value.environment)
  );
}

// Future authenticated calls receive a short-lived Clerk token from the caller.
// No persistent token storage, cookies, or server credentials in this client.
export async function apiRequest<T = unknown>(
  path: `/${string}`,
  token?: string,
  options: {
    method?: "GET" | "POST" | "PATCH";
    body?: object | FormData;
    timeout?: number;
  } = {},
): Promise<T> {
  if (path.startsWith("//"))
    throw new Error("API paths must be relative to the configured API.");
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is required.");
  const multipart = options.body instanceof FormData;
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  if (options.body && !multipart) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body
        ? multipart
          ? (options.body as FormData)
          : JSON.stringify(options.body)
        : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeout || REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      "Could not reach kootu. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      typeof error?.detail === "string" ? error.detail : undefined,
    );
  }
  return response.json();
}

export async function getHealth(): Promise<HealthResponse> {
  const data = await apiRequest("/health");
  if (!isHealthResponse(data)) {
    throw new Error("kootu API returned an invalid health response.");
  }
  return data;
}
