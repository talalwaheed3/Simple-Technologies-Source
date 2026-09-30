"use client";
import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { Challenge } from "./forms";
async function send(path: string, body: unknown) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Please try again");
  return data;
}
export function Engagement({
  postId,
  initialLikes,
}: {
  postId: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes),
    [liked, setLiked] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    send("/api/engagement", {
      kind: "view",
      post_id: postId,
      source: document.referrer,
    })
      .then((d) => {
        if (!active) return;
        setLiked(d.liked);
        setLikes(d.likes);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [postId]);
  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const d = await send("/api/engagement", {
        kind: "like",
        post_id: postId,
        active: next,
      });
      setLiked(d.liked);
      setLikes(d.likes);
    } catch (e) {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function feedback(yes: boolean) {
    try {
      await send("/api/engagement", {
        kind: yes ? "feedback_yes" : "feedback_no",
        post_id: postId,
      });
      setMessage("Thanks. Your feedback helps improve this solution.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <section className="notice">
      <h2 style={{ marginTop: 0 }}>Did this fix it?</h2>
      <div className="form-actions">
        <button className="secondary" onClick={() => feedback(true)}>
          Yes, it worked
        </button>
        <button className="secondary" onClick={() => feedback(false)}>
          Not yet
        </button>
        <button disabled={busy || !ready} aria-pressed={liked} onClick={toggle}>
          <ThumbsUp size={17} />
          {liked ? "Helpful" : "Mark helpful"} · {likes}
        </button>
      </div>
      <p className="status" role="status">
        {message}
      </p>
    </section>
  );
}
export function SearchEvent({
  query,
  count,
}: {
  query: string;
  count: number;
}) {
  useEffect(() => {
    send("/api/engagement", {
      kind: "search",
      query,
      result_count: count,
    }).catch(() => {});
  }, [query, count]);
  return null;
}
export function CommentForm({ postId }: { postId: string }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(""),
    [challengeActive, setChallengeActive] = useState(false),
    [challengeRevision, setChallengeRevision] = useState(0);
  return (
    <form
      onFocusCapture={() => setChallengeActive(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !token) {
          setChallengeActive(true);
          setMessage("Please complete the spam check before submitting.");
          return;
        }
        setBusy(true);
        const form = e.currentTarget;
        const f = new FormData(form);
        try {
          await send("/api/comments", {
            post_id: postId,
            name: f.get("name"),
            body: f.get("body"),
            website: f.get("website"),
            token,
          });
          setMessage("Thank you. Your comment is waiting for review.");
          form.reset();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
          setToken("");
          setChallengeRevision((value) => value + 1);
        }
      }}
    >
      <h3>Share your experience</h3>
      <p className="small muted">
        Comments are reviewed. Do not include passwords, serial numbers or
        private customer details.
      </p>
      <label className="field">
        Display name
        <input name="name" required minLength={2} maxLength={80} />
      </label>
      <label className="field">
        Comment
        <textarea name="body" required minLength={3} maxLength={3000} />
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <Challenge
        onToken={setToken}
        active={challengeActive}
        revision={challengeRevision}
      />
      <button disabled={busy}>Submit comment</button>
      <p role="status">{message}</p>
    </form>
  );
}
