import type { NextConfig } from "next";

// Validate public configuration before serving or building any page.
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) throw new Error("Set NEXT_PUBLIC_API_URL in apps/web/.env.local.");
const parsed = new URL(apiUrl);
if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
  throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) base URL without credentials, query or fragment.");
}
const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED;
if (authEnabled !== "true" && authEnabled !== "false") {
  throw new Error("Set NEXT_PUBLIC_AUTH_ENABLED explicitly to true or false.");
}
if (authEnabled === "true" && (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY)) {
  throw new Error("Clerk is enabled: set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and server-only CLERK_SECRET_KEY.");
}

const config: NextConfig = { poweredByHeader: false };
export default config;
