import { describe, expect, it } from "vitest";
import { signInHref, workspaceReturn } from "@/lib/auth-navigation";

describe("authentication return destinations", () => {
  it("preserves the selected role workspace", () => {
    expect(signInHref("/driver")).toBe("/sign-in?next=%2Fdriver");
    expect(workspaceReturn("/admin")).toBe("/admin");
  });
  it("rejects external URLs, malformed values and arbitrary local paths", () => {
    for (const input of ["https://attacker.example", "//attacker.example", "/api", ["/driver"], undefined]) {
      expect(workspaceReturn(input)).toBe("/passenger");
    }
  });
});
