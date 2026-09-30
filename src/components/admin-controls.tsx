"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaEditor } from "./media-editor";
import type { Shot } from "@/lib/types";
export async function adminFetch(path: string, body: unknown, method = "POST") {
  const r = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok) {
    const message =
      r.status === 401
        ? path === "/api/auth"
          ? "Email or password was not accepted. Please try again."
          : "Your session expired. Sign in again, then retry; your working copy is preserved."
        : d?.error ||
          "The server did not confirm this action. Please try again.";
    throw Object.assign(new Error(message), {
      fields: d?.fields,
      status: r.status,
    });
  }
  if (!d)
    throw new Error(
      "The server returned an unreadable response. Please retry before leaving this page.",
    );
  return d;
}
export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          await adminFetch("/api/auth", {
            email: f.get("email"),
            password: f.get("password"),
          });
          router.push("/admin");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        Email
        <input type="email" name="email" required autoComplete="username" />
      </label>
      <label className="field">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      <button disabled={busy}>Sign in</button>
      <p role="status">{message}</p>
    </form>
  );
}
export function SignOut() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        className="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            const response = await fetch("/api/auth", { method: "DELETE" });
            if (!response.ok) {
              throw new Error("Could not sign out. Please try again.");
            }
            // Keep the browser's working copies available after signing back in.
            router.push("/login");
            router.refresh();
          } catch {
            setMessage(
              "Could not sign out. Please try again. Your drafts are safe.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
export function Moderate({ id }: { id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <div>
      <div className="form-actions">
        {["approved", "hidden", "spam", "delete"].map((status) => (
          <button
            className="secondary small"
            key={status}
            onClick={async () => {
              if (
                status === "delete" &&
                !confirm("Delete this comment and its replies?")
              )
                return;
              try {
                await adminFetch("/api/admin/comments", { id, status });
                router.refresh();
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            {status === "approved" ? "Approve" : status}
          </button>
        ))}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            await adminFetch("/api/admin/comments", {
              id,
              reply: f.get("reply"),
            });
            setMessage("Reply published");
            router.refresh();
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <label className="field">
          Technician reply
          <textarea name="reply" minLength={3} maxLength={3000} required />
        </label>
        <button className="small">Publish reply</button>
      </form>
      <p role="status">{message}</p>
    </div>
  );
}
export function RequestActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await adminFetch("/api/admin/requests", {
              id,
              status: new FormData(e.currentTarget).get("status"),
            });
            router.refresh();
            setMessage("Status saved");
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <label className="field">
          Status
          <select name="status" defaultValue={status}>
            {[
              "new",
              "reviewing",
              "need_more_information",
              "solved",
              "converted",
              "closed",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <button className="small">Save status</button>
          <button
            type="button"
            className="secondary small"
            onClick={async () => {
              try {
                const d = await adminFetch("/api/admin/requests", {
                  id,
                  convert: true,
                });
                router.push(`/admin/posts/${d.post_id}`);
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            Convert to draft
          </button>
        </div>
      </form>
      <p role="status">{message}</p>
    </div>
  );
}
export function SettingsForm({ value }: { value: Record<string, string> }) {
  const [message, setMessage] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await adminFetch(
            "/api/admin/settings",
            Object.fromEntries(new FormData(e.currentTarget)),
          );
          setMessage("Settings saved");
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      {[
        ["brand", "Brand name"],
        ["description", "Short description"],
        ["admin_label", "Technician reply label"],
        ["support_url", "Fiverr / support URL"],
        ["whatsapp", "WhatsApp number, international digits"],
        ["email", "Contact email"],
        ["booking_url", "Booking URL"],
      ].map(([key, label]) => (
        <label className="field" key={key}>
          {label}
          <input name={key} defaultValue={value[key] || ""} maxLength={500} />
        </label>
      ))}
      <button>Save settings</button>
      <p role="status">{message}</p>
    </form>
  );
}
export function CatalogForm({
  kind,
  existing,
}: {
  kind: "affiliates" | "laptops";
  existing?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<Shot[]>(
    (existing?.images as Shot[]) || [],
  );
  const keys =
    kind === "affiliates"
      ? [
          "name",
          "destination",
          "affiliate_destination",
          "disclosure",
          "category",
          "post_ids",
        ]
      : [
          "model",
          "cpu",
          "ram",
          "storage",
          "display",
          "condition",
          "price",
          "currency",
          "description",
        ];
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body: Record<string, unknown> = Object.fromEntries(f);
        if (existing?.id) body.id = existing.id;
        if (kind === "laptops") body.images = images;
        body[kind === "affiliates" ? "enabled" : "available"] =
          f.get("enabled") === "on";
        delete body.enabled;
        if (kind === "affiliates") body.enabled = f.get("enabled") === "on";
        try {
          await adminFetch(`/api/admin/${kind}`, body);
          setMessage("Saved");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      {keys.map((key) => (
        <label className="field" key={key}>
          {key.replaceAll("_", " ")}
          <input
            name={key}
            defaultValue={
              Array.isArray(existing?.[key])
                ? (existing[key] as string[]).join(",")
                : String(existing?.[key] ?? (key === "currency" ? "PKR" : ""))
            }
            maxLength={2000}
          />
        </label>
      ))}
      {kind === "laptops" && (
        <MediaEditor value={images} onChange={setImages} />
      )}
      <label className="check">
        <input
          name="enabled"
          type="checkbox"
          defaultChecked={Boolean(
            existing?.[kind === "affiliates" ? "enabled" : "available"],
          )}
        />
        {kind === "affiliates" ? "Enabled" : "Available for sale"}
      </label>
      <button>Save {kind === "affiliates" ? "link" : "listing"}</button>
      <p role="status">{message}</p>
    </form>
  );
}
