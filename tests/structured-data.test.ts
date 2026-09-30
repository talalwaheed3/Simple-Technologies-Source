import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { jsonLd } from "../src/lib/data";

describe("inline structured data", () => {
  it("cannot end its script element through an article title or site brand", () => {
    const value = {
      headline: '</script><script>alert("title")</script>',
      author: { name: '</script><img src=x onerror="alert(1)">' },
    };
    const serialized = jsonLd(value);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
