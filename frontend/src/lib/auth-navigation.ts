// Only internal workspaces may be OAuth return destinations.
export function workspaceReturn(value: unknown): string {
  return value === "/dashboard" || value === "/driver" || value === "/admin" || value === "/request"
    ? value
    : "/request";
}

export function signInHref(workspace: unknown): string {
  return `/sign-in?next=${encodeURIComponent(workspaceReturn(workspace))}`;
}
