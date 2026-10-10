// Only internal workspaces may be OAuth return destinations.
export function workspaceReturn(value: unknown): string {
  return value === "/driver" || value === "/admin" ? value : "/passenger";
}

export function signInHref(workspace: unknown): string {
  return `/sign-in?next=${encodeURIComponent(workspaceReturn(workspace))}`;
}
