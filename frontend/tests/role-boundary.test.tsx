import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleBoundary } from "@/components/role-boundary";

const state = vi.hoisted(() => ({ path: "/driver/earnings", userId: "passenger", replace: vi.fn(), request: vi.fn(), getToken: vi.fn(async () => "session") }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: state.userId, getToken: state.getToken }) }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path, useRouter: () => ({ replace: state.replace }) }));
vi.mock("@/lib/api/client", () => ({ apiRequest: (...args: unknown[]) => state.request(...args) }));

beforeEach(() => { state.path = "/driver/earnings"; state.userId = "passenger"; state.replace.mockClear(); state.request.mockReset(); });
describe("server role portal boundary", () => {
  it("does not render any driver shell for a passenger visiting a direct URL", async () => {
    state.request.mockResolvedValue({ role: "PASSENGER" });
    render(<RoleBoundary><p>Private driver navigation</p></RoleBoundary>);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText("Private driver navigation")).toBeNull();
  });
  it("redirects unassigned users to explicit registration", async () => {
    state.request.mockResolvedValue({ role: "UNASSIGNED" });
    render(<RoleBoundary><p>Private workspace</p></RoleBoundary>);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith("/onboarding"));
    expect(screen.queryByText("Private workspace")).toBeNull();
  });
  it("hides a verified workspace immediately on account switch", async () => {
    state.userId = "driver";
    state.request.mockResolvedValueOnce({ role: "DRIVER" }).mockImplementation(() => new Promise(() => {}));
    const view = render(<RoleBoundary><p>Private driver navigation</p></RoleBoundary>);
    await screen.findByText("Private driver navigation");
    state.userId = "different-account";
    view.rerender(<RoleBoundary><p>Private driver navigation</p></RoleBoundary>);
    expect(screen.queryByText("Private driver navigation")).toBeNull();
  });
  it("fails closed when the role lookup fails", async () => {
    state.request.mockRejectedValue(new Error("Service unavailable"));
    render(<RoleBoundary><p>Private workspace</p></RoleBoundary>);
    await screen.findByRole("alert");
    expect(screen.queryByText("Private workspace")).toBeNull();
  });
});
