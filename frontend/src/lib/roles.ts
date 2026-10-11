export type AccountRole = "UNASSIGNED" | "PASSENGER" | "DRIVER" | "ADMIN";

export function roleHome(role: AccountRole): string {
  return role === "DRIVER" ? "/driver" : role === "PASSENGER" ? "/dashboard" : role === "ADMIN" ? "/admin" : "/onboarding";
}

export function requiredRole(path: string): AccountRole | null {
  if (path === "/driver" || path.startsWith("/driver/")) return "DRIVER";
  if (["/dashboard", "/passenger", "/request"].includes(path)) return "PASSENGER";
  if (path === "/admin") return "ADMIN";
  return null;
}
