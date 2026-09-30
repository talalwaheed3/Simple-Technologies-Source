import { describe, expect, it } from "vitest";
import {
  triageHistory,
  redactText,
  HISTORY_START,
  type Chat,
} from "../scripts/lib/history";
const at = (iso: string) => Date.parse(iso) / 1000;
function chat(
  id: string,
  date: string,
  title = "Synthetic test fixture",
  text = "A fixture for calendar notes",
): Chat {
  return {
    id,
    title,
    create_time: at(date),
    current_node: "user",
    mapping: {
      user: {
        parent: null,
        message: {
          author: { role: "user" },
          create_time: at(date),
          content: { parts: [text] },
        },
      },
    },
  };
}
describe("private export preparation", () => {
  it("includes April 5 Pakistan midnight and excludes older conversations and future conversations", () => {
    const r = triageHistory(
      [
        chat("old", "2026-04-04T18:59:59Z"),
        chat("start", "2026-04-04T19:00:00Z"),
        chat("future", "2026-10-01T00:00:00Z"),
      ],
      [],
      "2026-09-23T00:00:00Z",
    );
    expect(r.since).toBe(HISTORY_START);
    expect(r.candidates.map((c) => c.source_id)).toEqual(["start"]);
    expect(r.excluded).toHaveLength(2);
  });
  it("retains non-keyword conversations and unknown message dates for manual review", () => {
    const c = chat("one", "2026-06-01T00:00:00Z");
    delete c.mapping!.user.message!.create_time;
    const r = triageHistory([c], [], "2026-09-23T00:00:00Z");
    expect(r.candidates).toHaveLength(1);
    expect(r.candidates[0].technical_keyword_match).toBe(false);
    expect(r.candidates[0].missing_message_dates).toBe(1);
  });
  it("preserves branch provenance and never marks suggested answers as verified", () => {
    const c = chat("one", "2026-06-01T00:00:00Z");
    c.mapping!.alternate = {
      parent: "user",
      message: {
        author: { role: "assistant" },
        content: { parts: ["Suggestion only"] },
      },
    };
    const r = triageHistory([c], [], "2026-09-23T00:00:00Z");
    expect(r.candidates[0].messages.map((m) => m.on_active_branch)).toEqual([
      true,
      false,
    ]);
    expect(r.candidates[0].outcome_verified).toBe(false);
  });
  it("flags duplicates and source matches without merging or publishing", () => {
    const r = triageHistory(
      [
        chat("one", "2026-06-01T00:00:00Z"),
        chat("two", "2026-06-02T00:00:00Z"),
      ],
      [{ source_ref: "one", post_id: "existing" }],
      "2026-09-23T00:00:00Z",
    );
    expect(r.candidates[0].duplicate_candidates).toHaveLength(1);
    expect(r.candidates[0].matched_existing[0].post_id).toBe("existing");
    expect(r.candidates.every((c) => c.status === "needs_verification")).toBe(
      true,
    );
  });
  it("reports unknown dates and redacts common identifiers without claiming full privacy review", () => {
    expect(
      triageHistory([{ id: "undated" }], [], "2026-09-23T00:00:00Z").excluded[0]
        .reason,
    ).toBe("unknown_date_review_required");
    expect(
      redactText("user@example.invalid password: example /home/customer/file"),
    ).not.toContain("example.invalid");
    expect(
      redactText("user@example.invalid password: example /home/customer/file"),
    ).not.toContain("customer");
  });
});
