// FastAPI /openapi.json owns this contract. Generate resource types when they exist.
export interface HealthResponse {
  status: "ok";
  service: "kootu-api";
  version: string;
  environment: "development" | "test" | "production";
}

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`kootu API returned HTTP ${status}.`);
    this.name = "ApiError";
  }
}

const REQUEST_TIMEOUT_MS = 8000;

function isHealthResponse(data: unknown): data is HealthResponse {
  if (typeof data !== "object" || data === null) return false;
  const value = data as Record<string, unknown>;
  return value.status === "ok" && value.service === "kootu-api" &&
    typeof value.version === "string" && typeof value.environment === "string" &&
    ["development", "test", "production"].includes(value.environment);
}

// Future authenticated calls receive a short-lived Clerk token from the caller.
// No persistent token storage, cookies, or server credentials in this client.
export async function apiRequest(path: `/${string}`, token?: string): Promise<unknown> {
  if (path.startsWith("//")) throw new Error("API paths must be relative to the configured API.");
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is required.");
  const response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new ApiError(response.status);
  return response.json();
}

export async function getHealth(): Promise<HealthResponse> {
  const data = await apiRequest("/health");
  if (!isHealthResponse(data)) {
    throw new Error("kootu API returned an invalid health response.");
  }
  return data;
}
