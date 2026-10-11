import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleBoundary } from "@/components/role-boundary";

const state = vi.hoisted(() => ({ path: "/driver/earnings", userId: "passenger", replace: vi.fn(), request: vi.fn(), signOut: vi.fn(async () => {}), getToken: vi.fn(async () => "session") }));
vi.mock("@clerk/nextjs", () => ({ useClerk: () => ({ signOut: state.signOut }), useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: state.userId, getToken: state.getToken }) }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path, useRouter: () => ({ replace: state.replace }) }));
vi.mock("@/lib/api/client", () => ({ apiRequest: (...args: unknown[]) => state.request(...args) }));

beforeEach(() => { state.path = "/driver/earnings"; state.userId = "passenger"; state.replace.mockClear(); state.request.mockReset(); state.signOut.mockReset().mockResolvedValue(undefined); });
describe("server role portal boundary", () => {
  it("does not render any driver shell for a passenger visiting a direct URL", async () => {
    state.request.mockResolvedValue({ role: "PASSENGER" });
    render(<RoleBoundary><p>Private driver navigation</p></RoleBoundary>);
    await screen.findByText("You opened the driver portal.");
    expect(state.replace).not.toHaveBeenCalled();
    expect(screen.queryByText("Private driver navigation")).toBeNull();
  });
  it("redirects unassigned users to explicit registration", async () => {
    state.request.mockResolvedValue({ role: "UNASSIGNED" });
    render(<RoleBoundary><p>Private workspace</p></RoleBoundary>);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith("/onboarding?role=DRIVER"));
    expect(screen.queryByText("Private workspace")).toBeNull();
  });
  it("keeps a driver on the requested passenger URL and offers the correct sign-in", async () => {
    state.path = "/dashboard"; state.userId = "driver";
    state.request.mockResolvedValue({ role: "DRIVER" });
    render(<RoleBoundary><p>Private passenger content</p></RoleBoundary>);
    await screen.findByText("You opened the passenger portal.");
    expect(state.replace).not.toHaveBeenCalled();
    expect(screen.queryByText("Private passenger content")).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "Sign in as a passenger" }));
    expect(state.signOut).toHaveBeenCalledWith({ redirectUrl: "/sign-in?next=%2Fonboarding%3Frole%3DPASSENGER" });
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
  it("keeps the portal protected and permits retry if sign-out fails", async () => {
    state.request.mockResolvedValue({ role: "PASSENGER" });
    state.signOut.mockRejectedValueOnce(new Error("Network error"));
    render(<RoleBoundary><p>Private workspace</p></RoleBoundary>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Sign in as a driver" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("Private workspace")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Sign in as a driver" }));
    expect(state.signOut).toHaveBeenCalledTimes(2);
  });
});
