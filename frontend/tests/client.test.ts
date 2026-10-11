import { describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";

describe("authenticated API client", () => {
  it("retries a transient read failure once without changing its bearer token", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example");
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response('{"display_name":"Alice"}'));
    vi.stubGlobal("fetch", fetcher);
    await expect(apiRequest("/me", "session-token")).resolves.toEqual({ display_name: "Alice" });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe("Bearer session-token");
  });

  it("does not replay writes or HTTP provider failures", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example");
    const write = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", write);
    await expect(apiRequest("/ride-requests", "token", { method: "POST", body: {} })).rejects.toThrow("Could not reach");
    expect(write).toHaveBeenCalledTimes(1);
    const read = vi.fn().mockResolvedValue(new Response('{"detail":"Unavailable"}', { status: 503 }));
    vi.stubGlobal("fetch", read);
    await expect(apiRequest("/me", "token")).rejects.toThrow("Unavailable");
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("uses the session bearer token and JSON body", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example");
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: "saved" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetcher);
    await apiRequest("/ride-requests", "short-lived", {
      method: "POST",
      body: { passengers: 2 },
    });
    expect(fetcher.mock.calls[0]).toMatchObject([
      "https://api.example/ride-requests",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer short-lived",
          "Content-Type": "application/json",
        },
        body: '{"passengers":2}',
      },
    ]);
  });
  it("sends upload FormData without overriding its multipart boundary", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example");
    const fetcher = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetcher);
    const form = new FormData();
    form.set("consent", "true");
    await apiRequest("/audio/transcribe", "token", {
      method: "POST",
      body: form,
    });
    expect(fetcher.mock.calls[0]).toMatchObject([
      "https://api.example/audio/transcribe",
      { headers: { Authorization: "Bearer token" }, body: form },
    ]);
  });
  it("shows a backend configuration error", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example");
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response('{"detail":"Sarvam transcription is not configured"}', {
          status: 503,
        }),
    );
    await expect(apiRequest("/audio/transcribe", "token")).rejects.toThrow(
      "Sarvam transcription is not configured",
    );
  });
});


it("distinguishes a slow server from a disconnected browser", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("expired", "TimeoutError")));
  await expect(apiRequest("/tickets/extract", "token")).rejects.toThrow("server took too long");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  await expect(apiRequest("/tickets/extract", "token")).rejects.toThrow("Could not reach kootu");
});
