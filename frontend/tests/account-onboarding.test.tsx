import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountOnboarding } from "@/components/account-onboarding";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), api: vi.fn(), signOut: vi.fn(), getToken: vi.fn(async () => "session") }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: "demo-account", getToken: mocks.getToken }), useClerk: () => ({ signOut: mocks.signOut }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }), useSearchParams: () => new URLSearchParams("role=PASSENGER") }));
vi.mock("@/lib/api/client", () => ({ apiRequest: (...args: unknown[]) => mocks.api(...args) }));
vi.mock("@/components/auth-controls", () => ({ AuthControls: () => null }));
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_AUTH_ENABLED", "true"); mocks.api.mockReset(); mocks.replace.mockClear(); });

describe("explicit passenger registration intent", () => {
  it("explains a conflicting driver account instead of redirecting to driver", async () => {
    mocks.api.mockResolvedValue({ role: "DRIVER" });
    render(<AccountOnboarding />);
    await screen.findByText("You opened the passenger portal.");
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Register as a passenger" })).toBeNull();
  });
  it("registers a new passenger explicitly and opens the passenger dashboard", async () => {
    mocks.api.mockResolvedValueOnce({ role: "UNASSIGNED" }).mockResolvedValue({ role: "PASSENGER" });
    render(<AccountOnboarding />);
    await userEvent.setup().click(await screen.findByRole("button", { name: "Register as a passenger" }));
    expect(mocks.api).toHaveBeenCalledWith("/me/role", "session", { method: "POST", body: { role: "PASSENGER" } });
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
  });
});
