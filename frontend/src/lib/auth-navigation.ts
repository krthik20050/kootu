// Only internal workspaces may be OAuth return destinations.
const workspaces = new Set([
  "/onboarding", "/onboarding?role=PASSENGER", "/onboarding?role=DRIVER",
  "/passenger", "/dashboard", "/driver", "/admin", "/request",
  "/driver/profile", "/driver/ride-requests", "/driver/my-trips",
  "/driver/ride-history", "/driver/earnings", "/driver/help",
]);
export function workspaceReturn(value: unknown): string {
  return typeof value === "string" && workspaces.has(value)
    ? value
    : "/onboarding";
}

export function signInHref(workspace: unknown): string {
  return `/sign-in?next=${encodeURIComponent(workspaceReturn(workspace))}`;
}
