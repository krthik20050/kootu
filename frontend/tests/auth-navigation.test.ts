import { describe, expect, it } from "vitest";
import { signInHref, workspaceReturn } from "@/lib/auth-navigation";

describe("authentication return destinations", () => {
  it("preserves the selected role workspace", () => {
    expect(signInHref("/driver")).toBe("/sign-in?next=%2Fdriver");
    expect(workspaceReturn("/admin")).toBe("/admin");
    expect(signInHref("/driver/profile")).toBe("/sign-in?next=%2Fdriver%2Fprofile");
    expect(workspaceReturn("/driver/my-trips")).toBe("/driver/my-trips");
  });
  it("rejects external URLs, malformed values and arbitrary local paths", () => {
    for (const input of ["https://attacker.example", "//attacker.example", "/api", "/driver/../../api", "/driver/unknown", ["/driver"], undefined]) {
      expect(workspaceReturn(input)).toBe("/request");
    }
  });
});
