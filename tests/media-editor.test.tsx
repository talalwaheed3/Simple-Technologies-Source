// @vitest-environment jsdom
import React, { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MediaEditor } from "../src/components/media-editor";
import type { Shot } from "../src/lib/types";
const upload = vi.fn();
const existing: Shot = {
  id: "00000000-0000-4000-8000-000000000001",
  path: "existing/optimized.webp",
  width: 24,
  height: 16,
  alt: "Existing image",
  caption: "",
  reviewed: false,
};
const metadata = {
  id: "00000000-0000-4000-8000-000000000002",
  path: "new/optimized.webp",
  width: 24,
  height: 16,
};
function Harness({ initial = [] }: { initial?: Shot[] }) {
  const [shots, setShots] = useState(initial);
  return (
    <>
      <MediaEditor value={shots} onChange={setShots} />
      <output data-testid="shots">{JSON.stringify(shots)}</output>
    </>
  );
}
function select(files: File[]) {
  fireEvent.change(screen.getByLabelText("Upload screenshots / photos"), {
    target: { files },
  });
}
beforeEach(() => vi.stubGlobal("fetch", upload));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
it("retains successful uploads and retries a failed selection without marking images reviewed", async () => {
  upload
    .mockResolvedValueOnce({ ok: true, json: async () => metadata })
    .mockRejectedValueOnce(new Error("Network interrupted"));
  render(<Harness />);
  select([
    new File(["png"], "one.png", { type: "image/png" }),
    new File(["png"], "two.png", { type: "image/png" }),
  ]);
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "two.png: Network interrupted",
    ),
  );
  expect(JSON.parse(screen.getByTestId("shots").textContent!)).toEqual([
    { ...metadata, alt: "", caption: "", reviewed: false },
  ]);
  upload.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      ...metadata,
      id: "00000000-0000-4000-8000-000000000003",
    }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Retry failed uploads" }));
  await waitFor(() =>
    expect(screen.getAllByLabelText("Alt text")).toHaveLength(2),
  );
  expect(upload).toHaveBeenCalledTimes(3);
});
it("keeps metadata edits made while another image uploads", async () => {
  let complete!: (value: unknown) => void;
  upload.mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  render(<Harness initial={[existing]} />);
  select([new File(["png"], "new.png", { type: "image/png" })]);
  fireEvent.change(screen.getByLabelText("Alt text"), {
    target: { value: "Edited while uploading" },
  });
  complete({ ok: true, json: async () => metadata });
  await waitFor(() =>
    expect(screen.getAllByLabelText("Alt text")).toHaveLength(2),
  );
  expect(JSON.parse(screen.getByTestId("shots").textContent!)[0].alt).toBe(
    "Edited while uploading",
  );
});
it("rejects unsupported and oversized files before making a request", async () => {
  render(<Harness />);
  select([
    new File(["svg"], "bad.svg", { type: "image/svg+xml" }),
    new File([new Uint8Array(3145729)], "large.png", { type: "image/png" }),
  ]);
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("3 MiB"),
  );
  expect(upload).not.toHaveBeenCalled();
});
