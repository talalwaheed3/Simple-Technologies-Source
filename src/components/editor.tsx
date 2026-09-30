/* Browser draft restoration intentionally runs after hydration. */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useRef, useState } from "react";
import { blankPost, categories, type Post } from "@/lib/types";
import { slugify } from "@/lib/validation";
import { ArticleBody } from "./article";
import { MediaEditor } from "./media-editor";
import { adminFetch } from "./admin-controls";
type Draft = typeof blankPost & { id?: string };
type WorkingCopy = {
  version: 1;
  draft: Draft;
  savedAt: string;
  baseUpdatedAt: string | null;
};
type FieldErrors = Record<string, string[]>;
function readWorkingCopy(raw: string): WorkingCopy {
  const parsed = JSON.parse(raw);
  const draft = parsed.version === 1 ? parsed.draft : parsed;
  // Accept the previous unversioned format without applying publication rules to drafts.
  if (!draft || typeof draft !== "object" || Array.isArray(draft))
    throw new Error("Invalid working copy");
  const restored = { ...blankPost, ...draft };
  for (const [key, value] of Object.entries(blankPost)) {
    const candidate = restored[key];
    if (
      Array.isArray(value)
        ? !Array.isArray(candidate)
        : value !== null && typeof candidate !== typeof value
    )
      throw new Error("Invalid working copy");
  }
  if (
    restored.faq.some(
      (f: { question?: unknown; answer?: unknown }) =>
        !f || typeof f.question !== "string" || typeof f.answer !== "string",
    ) ||
    restored.screenshots.some(
      (shot: { id?: unknown; alt?: unknown; caption?: unknown }) =>
        !shot ||
        typeof shot.id !== "string" ||
        typeof shot.alt !== "string" ||
        typeof shot.caption !== "string",
    )
  )
    throw new Error("Invalid working copy");
  return {
    version: 1,
    draft: restored,
    savedAt:
      parsed.version === 1 && typeof parsed.savedAt === "string"
        ? parsed.savedAt
        : "",
    baseUpdatedAt:
      parsed.version === 1
        ? parsed.baseUpdatedAt || null
        : draft.updated_at || null,
  };
}
function localDateValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function Editor({
  initial,
  options,
}: {
  initial?: Post;
  options: { id: string; title: string }[];
}) {
  const [post, setPost] = useState<Draft>(initial || blankPost),
    [message, setMessage] = useState(""),
    [storageWarning, setStorageWarning] = useState(""),
    [fields, setFields] = useState<FieldErrors>({}),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [preview, setPreview] = useState(false),
    [dirty, setDirty] = useState(false),
    [restore, setRestore] = useState<WorkingCopy | null>(null);
  const key = `st_draft_${initial?.id || "new"}`;
  const current = useRef(post);
  const baseUpdatedAt = useRef(initial?.updated_at || null);
  const saving = useRef(false);
  const restoredNeedsReview = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    try {
      const saved = localStorage.getItem(key);
      if (saved) setRestore(readWorkingCopy(saved));
    } catch {
      setStorageWarning(
        "The browser working copy could not be read. Existing browser data has been kept.",
      );
    }
    return () => {
      mounted.current = false;
    };
  }, [key]);
  function keepWorkingCopy(draft: Draft) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          draft,
          savedAt: new Date().toISOString(),
          baseUpdatedAt: baseUpdatedAt.current,
        } satisfies WorkingCopy),
      );
      setStorageWarning("");
      return true;
    } catch {
      setStorageWarning(
        "Browser storage is unavailable. Keep this page open and copy your edits before closing it.",
      );
      return false;
    }
  }
  function change<K extends keyof Draft>(field: K, value: Draft[K]) {
    const next = { ...current.current, [field]: value };
    current.current = next;
    setPost(next);
    setDirty(true);
    setFields((errors) =>
      Object.fromEntries(
        Object.entries(errors).filter(
          ([name]) => name !== field && !name.startsWith(`${field}.`),
        ),
      ),
    );
    setMessage("");
  }
  async function save(auto = false) {
    if (saving.current || uploading || restore) return;
    let snapshot = current.current;
    if (!snapshot.title || !snapshot.slug) {
      if (!auto) setMessage("Enter a title and URL slug.");
      return;
    }
    if (
      auto &&
      (snapshot.status === "published" || restoredNeedsReview.current)
    )
      return;
    const timestamp = snapshot.published_at
      ? new Date(snapshot.published_at)
      : null;
    if (timestamp && !Number.isFinite(timestamp.getTime())) {
      setFields({
        published_at: ["Choose a valid publish date or clear the date."],
      });
      setMessage("Check the publish date before saving.");
      return;
    }
    if (!snapshot.id) {
      snapshot = { ...snapshot, id: crypto.randomUUID() };
      current.current = snapshot;
      setPost(snapshot);
    }
    saving.current = true;
    setBusy(true);
    setFields({});
    keepWorkingCopy(snapshot);
    try {
      const d = await adminFetch("/api/admin/posts", {
        ...snapshot,
        published_at: timestamp?.toISOString() ?? null,
        ...(snapshot.id && baseUpdatedAt.current
          ? { expected_updated_at: baseUpdatedAt.current }
          : {}),
      });
      if (mounted.current) {
        const unchanged = current.current === snapshot;
        const next = {
          ...current.current,
          id: d.id,
          published_at:
            current.current.published_at === snapshot.published_at
              ? (d.published_at ?? current.current.published_at)
              : current.current.published_at,
        };
        current.current = next;
        baseUpdatedAt.current = d.updated_at || baseUpdatedAt.current;
        restoredNeedsReview.current = false;
        setPost(next);
        setDirty(!unchanged);
        setMessage(
          unchanged
            ? auto
              ? "Draft autosaved"
              : "Saved"
            : "Earlier changes saved. Newer edits are still pending.",
        );
        if (unchanged) {
          try {
            localStorage.removeItem(key);
          } catch {
            setStorageWarning(
              "Saved to the server, but the browser copy could not be cleared.",
            );
          }
        } else keepWorkingCopy(next);
      }
    } catch (error) {
      if (mounted.current) {
        const kept = keepWorkingCopy(current.current);
        setFields((error as Error & { fields?: FieldErrors }).fields || {});
        setMessage(
          (error instanceof Error ? error.message : "Save failed") +
            (kept
              ? " Your working copy remains in this browser."
              : " Your edits remain open on this page."),
        );
      }
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (!dirty || restore) return;
    keepWorkingCopy(post);
    if (uploading) return;
    const timer = setTimeout(() => {
      void save(true);
    }, 1800);
    return () => clearTimeout(timer);
    // The current ref protects edits made while a request is in flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, dirty, key, uploading, restore]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty || uploading) e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty, uploading]);
  function fieldError(field: string) {
    return fields[field]?.length ? (
      <span className="hint" id={`error-${field}`}>
        {fields[field].join(" ")}
      </span>
    ) : null;
  }
  function text(field: keyof Draft, label: string, multiline = true) {
    return (
      <label className="field" key={field}>
        {label}
        {multiline ? (
          <textarea
            aria-invalid={!!fields[field]}
            aria-describedby={fields[field] ? `error-${field}` : undefined}
            value={String(post[field] ?? "")}
            onChange={(e) => change(field, e.target.value as never)}
          />
        ) : (
          <input
            aria-invalid={!!fields[field]}
            aria-describedby={fields[field] ? `error-${field}` : undefined}
            value={String(post[field] ?? "")}
            onChange={(e) => change(field, e.target.value as never)}
          />
        )}
        {fieldError(field)}
      </label>
    );
  }
  if (preview)
    return (
      <>
        <button className="secondary" onClick={() => setPreview(false)}>
          Back to editor
        </button>
        <article className="prose">
          <div className="notice">Private preview · {post.status}</div>
          <h1>{post.title}</h1>
          <ArticleBody
            preview
            post={{
              ...post,
              id: post.id || "",
              created_at: "",
              updated_at: "",
              views: 0,
              likes: 0,
              comment_count: 0,
            }}
          />
        </article>
      </>
    );
  return (
    <>
      {restore && (
        <div className="notice">
          A working copy is saved on this device.
          {initial &&
            (!restore.baseUpdatedAt ||
              Date.parse(restore.baseUpdatedAt) !==
                Date.parse(initial.updated_at)) && (
              <p>
                This copy may be older than the server article. Restoring it
                does not merge newer server edits. Review the copy before
                saving.
              </p>
            )}
          <div className="form-actions">
            <button
              onClick={() => {
                current.current = restore.draft;
                restoredNeedsReview.current = true;
                baseUpdatedAt.current =
                  restore.baseUpdatedAt || baseUpdatedAt.current;
                setPost(restore.draft);
                setDirty(true);
                setRestore(null);
                setMessage(
                  "Working copy restored for review. Save explicitly when your edits are ready.",
                );
              }}
            >
              Restore it
            </button>
            <button
              className="secondary"
              onClick={() => {
                try {
                  localStorage.removeItem(key);
                } catch {
                  setStorageWarning("The browser copy could not be removed.");
                }
                setRestore(null);
              }}
            >
              Discard local copy
            </button>
          </div>
        </div>
      )}
      {storageWarning && <p role="alert">{storageWarning}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset
          disabled={!!restore}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <label className="field">
            Problem title
            <input
              aria-invalid={!!fields.title}
              aria-describedby={fields.title ? "error-title" : undefined}
              required
              minLength={5}
              maxLength={200}
              value={post.title}
              onChange={(e) => {
                change("title", e.target.value);
                if (!initial && !post.id)
                  change("slug", slugify(e.target.value));
              }}
              placeholder="What stopped working?"
            />
            {fieldError("title")}
          </label>
          {text("excerpt", "Quick answer / excerpt")}
          <div className="form-grid">
            {text("device", "Device / model", false)}
            {text("os", "Operating system", false)}
          </div>
          {text("symptoms", "Symptoms")}
          {text("cause", "Diagnosis / root cause")}
          {text("steps", "Solution steps — one step per line")}
          {text(
            "verification",
            "Verification checks and supporting references",
          )}
          {text("warnings", "Warnings before starting")}
          <details>
            <summary>Commands, error messages and alternatives</summary>
            {text("error_message", "Exact error message")}
            {text("commands", "Commands — preserved exactly")}
            {text("alternatives", "Alternative checks / fixes")}
          </details>
          <details>
            <summary>Organization and search appearance</summary>
            {text("slug", "URL slug", false)}
            <div className="form-grid">
              {text("manufacturer", "Manufacturer", false)}
              <label className="field">
                Category
                <select
                  value={post.category}
                  onChange={(e) => change("category", e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Tags (comma separated)
              <input
                value={post.tags.join(", ")}
                onChange={(e) =>
                  change(
                    "tags",
                    e.target.value.split(",").map((s) => s.trim()),
                  )
                }
              />
            </label>
            {text("seo_title", "SEO title (optional)", false)}
            {text("seo_description", "SEO description (optional)", false)}
            <label className="field">
              Related articles
              <select
                multiple
                value={post.related_ids}
                onChange={(e) =>
                  change(
                    "related_ids",
                    Array.from(e.target.selectedOptions).map((o) => o.value),
                  )
                }
              >
                {options
                  .filter((o) => o.id !== post.id)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
              </select>
            </label>
          </details>
          <details>
            <summary>Frequently asked questions</summary>
            {post.faq.map((f, i) => (
              <div key={i} className="card">
                <label className="field">
                  Question
                  <input
                    value={f.question}
                    onChange={(e) =>
                      change(
                        "faq",
                        post.faq.map((a, n) =>
                          n === i ? { ...a, question: e.target.value } : a,
                        ),
                      )
                    }
                  />
                </label>
                <label className="field">
                  Answer
                  <textarea
                    value={f.answer}
                    onChange={(e) =>
                      change(
                        "faq",
                        post.faq.map((a, n) =>
                          n === i ? { ...a, answer: e.target.value } : a,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  className="secondary"
                  type="button"
                  onClick={() =>
                    change(
                      "faq",
                      post.faq.filter((_, n) => n !== i),
                    )
                  }
                >
                  Remove question
                </button>
              </div>
            ))}
            <button
              className="secondary"
              type="button"
              onClick={() =>
                change("faq", [...post.faq, { question: "", answer: "" }])
              }
            >
              Add question
            </button>
          </details>
          <MediaEditor
            value={post.screenshots}
            onChange={(shots) => change("screenshots", shots)}
            onBusyChange={setUploading}
            disabled={busy}
            errors={fields}
          />
          <label className="check">
            <input
              type="checkbox"
              checked={post.verified}
              onChange={(e) => change("verified", e.target.checked)}
            />
            I checked this technical guidance against the cited references.
            {fieldError("verified")}
          </label>
          <p className="hint">
            Reference review does not confirm an actual repair outcome. Record a
            confirmed outcome only when supporting evidence exists. Unpublished
            drafts can be saved before review.
          </p>
          <div className="form-grid">
            <label className="field">
              Status
              <select
                value={post.status}
                onChange={(e) =>
                  change("status", e.target.value as Draft["status"])
                }
              >
                {[
                  "draft",
                  "review",
                  "needs_verification",
                  "published",
                  "archived",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s === "published"
                      ? "Published (public at publish date)"
                      : `${s.replaceAll("_", " ")} (private)`}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Publish date (optional, local time)
              <input
                type="datetime-local"
                aria-invalid={!!fields.published_at}
                aria-describedby={
                  fields.published_at ? "error-published_at" : undefined
                }
                value={localDateValue(post.published_at)}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) change("published_at", null);
                  else {
                    const date = new Date(value);
                    if (Number.isFinite(date.getTime()))
                      change("published_at", date.toISOString());
                  }
                }}
              />
              {fieldError("published_at")}
              <span className="hint">
                Published articles with a future date stay private until that
                time.
              </span>
            </label>
          </div>
          {Object.keys(fields).length > 0 && (
            <div role="alert" className="notice">
              Check these fields before saving:
              <ul>
                {Object.entries(fields).map(([field, errors]) => (
                  <li key={field}>
                    {field.replaceAll("_", " ")}: {errors.join(" ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="sticky-actions">
            <div className="form-actions">
              <button disabled={busy || uploading} type="submit">
                {uploading
                  ? "Wait for image uploads…"
                  : busy
                    ? "Saving…"
                    : post.status === "published"
                      ? "Publish / update"
                      : "Save draft"}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={uploading}
                onClick={() => setPreview(true)}
              >
                Preview
              </button>
              <span className="status" role="status" aria-label="Save status">
                {message || "Drafts autosave after you stop typing."}
              </span>
            </div>
          </div>
        </fieldset>
      </form>
    </>
  );
}
