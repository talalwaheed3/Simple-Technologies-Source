import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  lookup: vi.fn(),
  apiError: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  sessionDb: async () => ({
    auth: {
      signInWithPassword: mocks.signIn,
      getUser: mocks.getUser,
      signOut: mocks.signOut,
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }),
    }),
  }),
}));
vi.mock("@/lib/security", () => ({
  originGuard: async () => {},
  rateLimit: async () => {},
  apiError: (error: unknown) => {
    mocks.apiError(error);
    return Response.json({ error: "Authentication failed" }, { status: 401 });
  },
}));
import { DELETE, POST } from "../src/app/api/auth/route";
const request = () =>
  new Request("http://localhost:3000/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@example.com",
      password: "test password",
    }),
  });
beforeEach(() => {
  mocks.signIn.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "admin-id" } },
    error: null,
  });
  mocks.lookup.mockResolvedValue({ data: { user_id: "admin-id" } });
  mocks.signOut.mockResolvedValue({ error: null });
});
afterEach(() => vi.clearAllMocks());
describe("authentication responses", () => {
  it("rejects a session that expires during login without dereferencing a missing user", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("expired"),
    });
    expect((await POST(request())).ok).toBe(false);
    expect(mocks.apiError).toHaveBeenCalledWith(new Error("Unauthorized"));
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
  it("rejects a non-admin and removes the new session", async () => {
    mocks.lookup.mockResolvedValue({ data: null });
    expect((await POST(request())).ok).toBe(false);
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.apiError).toHaveBeenCalledWith(new Error("Forbidden"));
  });
  it("allows an authenticated allowlisted admin", async () => {
    expect((await POST(request())).ok).toBe(true);
  });
  it("does not report successful logout when Supabase rejects it", async () => {
    const failure = new Error("Sign out unavailable");
    mocks.signOut.mockResolvedValue({ error: failure });
    expect((await DELETE(request())).ok).toBe(false);
    expect(mocks.apiError).toHaveBeenCalledWith(failure);
  });
});
