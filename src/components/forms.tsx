"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
export function Challenge({
  onToken,
  active = true,
  revision = 0,
}: {
  onToken: (s: string) => void;
  active?: boolean;
  revision?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const widget = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (
      !active ||
      !ready ||
      !widget ||
      !ref.current ||
      !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    )
      return;
    const id = widget.render(ref.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
    return () => widget.remove(id);
  }, [active, ready, onToken, revision]);
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null;
  return (
    <>
      {active && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          onReady={() => setReady(true)}
        />
      )}
      <div ref={ref} style={{ minHeight: 78 }} />
    </>
  );
}
export function RequestForm() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(""),
    [challengeRevision, setChallengeRevision] = useState(0);
  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !token) {
          setMessage("Please complete the spam check before sending.");
          return;
        }
        const form = e.currentTarget;
        setBusy(true);
        const f = new FormData(form);
        f.set("token", token);
        try {
          const r = await fetch("/api/requests", { method: "POST", body: f });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setMessage("Request received. Keep this reference: " + d.id);
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
      <label className="field">
        What is the problem?
        <input
          name="title"
          required
          minLength={5}
          maxLength={200}
          placeholder="e.g. Laptop SSD missing in Windows Setup"
        />
      </label>
      <label className="field">
        Describe what happens
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={10000}
        />
      </label>
      <div className="form-grid">
        <label className="field">
          Device brand / model
          <input name="device" maxLength={200} />
        </label>
        <label className="field">
          Operating system
          <input name="os" maxLength={200} />
        </label>
      </div>
      <label className="field">
        Exact error message
        <textarea name="error_message" maxLength={2000} />
      </label>
      <label className="field">
        What have you already tried?
        <textarea name="tried" maxLength={5000} />
      </label>
      <label className="field">
        Screenshot (optional)
        <input
          name="screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        />
        <span className="hint">
          One image, up to 3 MB. Remove passwords, personal files and customer
          details first. Attachments stay private.
        </span>
      </label>
      <label className="field">
        Email for follow-up (optional)
        <input name="contact" type="email" maxLength={254} />
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="check">
        <input name="consent" type="checkbox" required />I agree to the Privacy
        Policy and understand that a reply is not guaranteed. Do not publish my
        contact details.
      </label>
      <Challenge onToken={setToken} revision={challengeRevision} />
      <button disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
      <p className="status" role="status">
        {message}
      </p>
    </form>
  );
}
