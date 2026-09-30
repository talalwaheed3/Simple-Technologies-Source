import { createHash } from "node:crypto";
export const HISTORY_START = "2026-04-05T00:00:00+05:00";
export type Message = {
  id?: string;
  author?: { role?: string };
  create_time?: number;
  content?: { parts?: unknown[] };
  [key: string]: unknown;
};
export type Chat = {
  id?: string;
  conversation_id?: string;
  title?: string;
  create_time?: number;
  current_node?: string;
  mapping?: Record<
    string,
    {
      id?: string;
      parent?: string | null;
      children?: string[];
      message?: Message | null;
    }
  >;
};
export type ExistingCase = {
  source_ref?: string;
  title?: string;
  post_id?: string | null;
  id?: string;
  canonical_url?: string;
};
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
export function redactText(value: string) {
  return value
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[email removed]")
    .replace(/\b(?:\d[ -]?){7,}\d\b/g, "[number removed]")
    .replace(
      /\b(password|passwd|api[_ -]?key|secret|token)\s*[:=]\s*\S+/gi,
      "$1: [secret removed]",
    )
    .replace(
      /(?:[A-Z]:\\Users\\|\/home\/|\/Users\/)[^\s\\/]+/g,
      "[user directory]",
    );
}
export function triageHistory(
  input: unknown,
  existing: ExistingCase[] = [],
  until = new Date().toISOString(),
  since = HISTORY_START,
) {
  if (!Array.isArray(input))
    throw new Error("Expected conversations.json containing an array");
  const start = Date.parse(since) / 1000,
    end = Date.parse(until) / 1000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start)
    throw new Error("Invalid history date range");
  const excluded: { source_id: string | null; reason: string }[] = [];
  const candidates = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      excluded.push({ source_id: null, reason: "invalid_record" });
      continue;
    }
    const chat = raw as Chat;
    const sourceId = chat.id || chat.conversation_id || null;
    const entries = Object.entries(chat.mapping || {});
    const timestamps = entries
      .map(([, n]) => n.message?.create_time)
      .filter((t): t is number => typeof t === "number" && Number.isFinite(t));
    const created =
      typeof chat.create_time === "number" && Number.isFinite(chat.create_time)
        ? chat.create_time
        : timestamps.length
          ? Math.min(...timestamps)
          : null;
    if (created === null || created < start || created > end) {
      excluded.push({
        source_id: sourceId,
        reason:
          created === null
            ? "unknown_date_review_required"
            : created < start
              ? "conversation_before_start"
              : "conversation_after_export_date",
      });
      continue;
    }
    const active = new Set<string>();
    let current = chat.current_node;
    while (current && !active.has(current) && chat.mapping?.[current]) {
      active.add(current);
      current = chat.mapping[current].parent || undefined;
    }
    const messages = entries
      .filter(([, node]) => {
        const m = node.message;
        return (
          m &&
          ["user", "assistant"].includes(m.author?.role || "") &&
          (typeof m.create_time !== "number" ||
            (m.create_time >= start && m.create_time <= end))
        );
      })
      .map(([nodeId, node]) => ({
        node_id: nodeId,
        parent: node.parent || null,
        on_active_branch: active.size ? active.has(nodeId) : null,
        message: node.message!,
      }));
    const userText = messages
      .filter((n) => n.message.author?.role === "user")
      .map((n) =>
        (n.message.content?.parts || [])
          .filter((p) => typeof p === "string")
          .join("\n"),
      )
      .join("\n");
    const technical =
      /(windows|linux|macos|bios|uefi|ssd|hdd|nvme|driver|wi.?fi|boot|laptop|error|not working|repair|python|typescript|react|angular|sql)/i.test(
        `${chat.title || ""} ${userText}`,
      );
    const fingerprint = hash(
      normalize(userText) || JSON.stringify(chat.mapping || {}),
    );
    const key = hash(sourceId || fingerprint).slice(0, 24);
    const matches = existing
      .filter(
        (c) =>
          (sourceId &&
            c.source_ref &&
            (c.source_ref === sourceId ||
              c.source_ref.endsWith(`/c/${sourceId}`))) ||
          (chat.title &&
            c.title &&
            normalize(chat.title) === normalize(c.title)),
      )
      .map((c) => ({
        post_id: c.post_id || null,
        case_id: c.id || null,
        canonical_url: c.canonical_url || null,
        match:
          sourceId && c.source_ref?.includes(sourceId)
            ? "source_id"
            : "title_candidate_only",
      }));
    candidates.push({
      key,
      source_id: sourceId,
      title: chat.title || "Untitled conversation",
      created_at: new Date(created * 1000).toISOString(),
      fingerprint,
      technical_keyword_match: technical,
      matched_existing: matches,
      duplicate_candidates: [] as string[],
      messages,
      missing_message_dates: messages.filter(
        (m) => typeof m.message.create_time !== "number",
      ).length,
      status: "needs_verification" as const,
      privacy_reviewed: false,
      outcome_verified: false,
    });
  }
  for (const c of candidates)
    c.duplicate_candidates = candidates
      .filter(
        (other) =>
          other !== c &&
          (other.fingerprint === c.fingerprint ||
            normalize(other.title) === normalize(c.title)),
      )
      .map((other) => other.key);
  return {
    since,
    until,
    timezone: "Asia/Karachi (+05:00); explicit ISO offsets supported",
    candidates,
    excluded,
    total_conversations: input.length,
  };
}
