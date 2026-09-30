// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { Editor } from "../src/components/editor";
import { blankPost, type Post } from "../src/lib/types";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/image", () => ({ default: () => null }));
const fetchMock = vi.fn();
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ id: "00000000-0000-4000-8000-000000000011" }),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("mobile technician editor", () => {
  const initial: Post = {
    ...blankPost,
    id: "00000000-0000-4000-8000-000000000011",
    title: "An existing private article",
    slug: "existing-private-article",
    published_at: "2026-09-24T07:00:00+00:00",
    updated_at: "2026-09-24T07:00:01.123456+00:00",
    created_at: "2026-09-24T07:00:00+00:00",
    views: 0,
    likes: 0,
    comment_count: 0,
  };
  it("normalizes a hosted timestamp while keeping the exact revision token", async () => {
    render(<Editor initial={initial} options={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.published_at).toBe("2026-09-24T07:00:00.000Z");
    expect(payload.expected_updated_at).toBe(initial.updated_at);
  });
  it("shows field errors and preserves the complete working copy", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "Check the highlighted fields",
        fields: { excerpt: ["Use no more than 400 characters"] },
      }),
    });
    render(<Editor initial={initial} options={[]} />);
    fireEvent.change(screen.getByLabelText("Quick answer / excerpt"), {
      target: { value: "x".repeat(401) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Use no more than 400 characters",
      ),
    );
    expect(localStorage.getItem(`st_draft_${initial.id}`)).toContain(
      "x".repeat(401),
    );
    expect(
      screen
        .getByRole("textbox", { name: /Quick answer/ })
        .getAttribute("aria-invalid"),
    ).toBe("true");
  });
  it("does not overwrite a newer server article by autosaving a restored copy", async () => {
    localStorage.setItem(
      `st_draft_${initial.id}`,
      JSON.stringify({
        version: 1,
        draft: { ...initial, title: "Old local article" },
        savedAt: "2026-09-23T00:00:00Z",
        baseUpdatedAt: "2026-09-23T00:00:00Z",
      }),
    );
    render(<Editor initial={initial} options={[]} />);
    expect(
      screen.getByText(/may be older than the server article/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Restore it" }));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body).expected_updated_at,
    ).toBe("2026-09-23T00:00:00Z");
  });
  it("retains edits typed while an earlier save is in flight", async () => {
    let finish!: (value: unknown) => void;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<Editor initial={initial} options={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    fireEvent.change(screen.getByLabelText("Problem title"), {
      target: { value: "Newer unsaved title" },
    });
    finish({
      ok: true,
      json: async () => ({
        id: initial.id,
        updated_at: "2026-09-25T00:00:00+00:00",
      }),
    });
    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Save status" }).textContent,
      ).toContain("Newer edits are still pending"),
    );
    expect(localStorage.getItem(`st_draft_${initial.id}`)).toContain(
      "Newer unsaved title",
    );
  });
  it("saves a structured draft and previews entered solution steps", async () => {
    render(<Editor options={[]} />);
    fireEvent.change(screen.getByLabelText("Problem title"), {
      target: { value: "SSD missing in Windows Setup" },
    });
    fireEvent.change(
      screen.getByLabelText("Solution steps — one step per line"),
      {
        target: {
          value:
            "Inspect storage configuration.\nLoad the matching storage driver.",
        },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.slug).toBe("ssd-missing-in-windows-setup");
    expect(payload.status).toBe("draft");
    expect(payload.verified).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("Inspect storage configuration.")).toBeTruthy();
    expect(screen.getByText("Load the matching storage driver.")).toBeTruthy();
  });
  it("does not autosave edits to a published article", async () => {
    render(
      <Editor
        options={[]}
        initial={{
          ...blankPost,
          id: "00000000-0000-4000-8000-000000000011",
          title: "Published repair",
          slug: "published-repair",
          status: "published",
          verified: true,
          published_at: new Date().toISOString(),
          created_at: "",
          updated_at: "",
          views: 0,
          likes: 0,
          comment_count: 0,
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Problem title"), {
      target: { value: "Edited published repair" },
    });
    await new Promise((r) => setTimeout(r, 2000));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      localStorage.getItem("st_draft_00000000-0000-4000-8000-000000000011"),
    ).toContain("Edited published repair");
  });
  it("preserves an unsaved draft on server failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Unable to save" }),
    });
    render(<Editor options={[]} />);
    fireEvent.change(screen.getByLabelText("Problem title"), {
      target: { value: "A private repair draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Save status" }).textContent,
      ).toContain("working copy remains"),
    );
    expect(localStorage.getItem("st_draft_new")).toContain(
      "A private repair draft",
    );
  });
});
