// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SignOut } from "../src/components/admin-controls";
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("next/image", () => ({ default: () => null }));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("st_draft_new", "unsaved repair notes");
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("sign out preserves working copies", () => {
  it("does not navigate or erase drafts when logout is rejected", async () => {
    mocks.fetch.mockResolvedValue({ ok: false });
    render(<SignOut />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "Could not sign out",
      ),
    );
    expect(mocks.push).not.toHaveBeenCalled();
    expect(localStorage.getItem("st_draft_new")).toBe("unsaved repair notes");
    expect(
      (screen.getByRole("button", { name: "Sign out" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
  it("keeps drafts after successful logout so they can be recovered", async () => {
    mocks.fetch.mockResolvedValue({ ok: true });
    render(<SignOut />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/login"));
    expect(mocks.refresh).toHaveBeenCalled();
    expect(localStorage.getItem("st_draft_new")).toBe("unsaved repair notes");
  });
  it("reports a network failure while preserving drafts", async () => {
    mocks.fetch.mockRejectedValue(new TypeError("fetch failed"));
    render(<SignOut />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "Your drafts are safe",
      ),
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
