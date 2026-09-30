import { beforeEach, describe, expect, it, vi } from "vitest";
const { requireAdmin, update, eq, revalidateTag, revalidatePath } = vi.hoisted(
  () => ({
    requireAdmin: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
  }),
);
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag, revalidatePath }));
vi.mock("../src/lib/supabase", () => ({ requireAdmin }));
import { POST } from "../src/app/api/admin/settings/route";
const value = {
  brand: "Simple Technologies",
  description: "Computer repair guides",
  admin_label: "Technician",
  support_url: "",
  booking_url: "",
  whatsapp: "",
  email: "",
};
function request(body = value) {
  return new Request("http://localhost:3000/api/admin/settings", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  update.mockReturnValue({ eq });
  eq.mockResolvedValue({ error: null });
  requireAdmin.mockResolvedValue({ db: { from: () => ({ update }) } });
});
describe("public settings cache invalidation", () => {
  it("expires settings immediately after an authorized successful save", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(update).toHaveBeenCalledWith({ value });
    expect(revalidateTag).toHaveBeenCalledWith("site-settings", { expire: 0 });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
  it("does not invalidate or write for an unauthorized caller", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    expect((await POST(request())).status).toBe(401);
    expect(update).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
  it("keeps the cache intact for invalid settings", async () => {
    expect((await POST(request({ ...value, brand: "" }))).status).toBe(400);
    expect(update).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
