"use client";
import { useEffect, useRef, useState } from "react";
import { shotSchema } from "@/lib/validation";
import type { Shot } from "@/lib/types";
const imageMetadata = shotSchema.pick({
  id: true,
  path: true,
  width: true,
  height: true,
});
type FailedUpload = { file: File; error: string; retryable: boolean };
export function MediaEditor({
  value,
  onChange,
  onBusyChange,
  disabled = false,
  errors = {},
}: {
  value: Shot[];
  onChange: (value: Shot[]) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  errors?: Record<string, string[]>;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState<FailedUpload[]>([]);
  const latest = useRef(value);
  const uploading = useRef(false);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  function change(next: Shot[]) {
    latest.current = next;
    onChange(next);
  }
  function patch(index: number, update: Partial<Shot>) {
    change(
      latest.current.map((s, i) => (i === index ? { ...s, ...update } : s)),
    );
  }
  async function upload(files: File[]) {
    if (!files.length || uploading.current || disabled) return;
    if (latest.current.length + files.length > 20) {
      setMessage(
        "Use no more than 20 images. Remove an image before trying again.",
      );
      setFailed(
        files.map((file) => ({
          file,
          error: "No space in this article's 20-image limit.",
          retryable: true,
        })),
      );
      return;
    }
    uploading.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setMessage("");
    const failures: FailedUpload[] = [];
    let uploaded = 0;
    try {
      for (const file of files) {
        const invalid = !["image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        )
          ? "Choose a JPEG, PNG or WebP image."
          : file.size > 3 * 1024 * 1024
            ? "The image exceeds the 3 MiB limit."
            : file.size === 0
              ? "The selected file is empty."
              : null;
        if (invalid) {
          failures.push({ file, error: invalid, retryable: false });
          continue;
        }
        try {
          const form = new FormData();
          form.set("file", file);
          const response = await fetch("/api/admin/media", {
            method: "POST",
            body: form,
          });
          const data = await response.json().catch(() => null);
          if (!response.ok)
            throw new Error(
              data?.error ||
                `Image upload failed (HTTP ${response.status}). Try again.`,
            );
          const parsed = imageMetadata.safeParse(data);
          if (!parsed.success)
            throw new Error(
              "The upload response was incomplete. Try again or reload before saving.",
            );
          change([
            ...latest.current,
            { ...parsed.data, alt: "", caption: "", reviewed: false },
          ]);
          uploaded++;
        } catch (error) {
          failures.push({
            file,
            error:
              error instanceof Error
                ? error.message
                : "Upload failed. Try again.",
            retryable: true,
          });
        }
      }
      setFailed(failures);
      setMessage(
        failures.length
          ? `${uploaded} image${uploaded === 1 ? "" : "s"} uploaded; ${failures.length} failed. Successful uploads remain in your draft.`
          : "Uploaded privately. Save the article to keep these images attached. Add alt text and inspect each image before publishing.",
      );
    } finally {
      uploading.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  return (
    <section>
      <h2>Images</h2>
      <p className="small muted">
        JPEG, PNG or WebP, up to 3 MiB each. Crop and redact private details
        first. The first image is used for the cover; originals stay private.
      </p>
      <label className="field">
        Upload screenshots / photos
        <input
          type="file"
          multiple
          disabled={busy || disabled}
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            void upload(Array.from(e.target.files || []));
            e.target.value = "";
          }}
        />
      </label>
      {value.map((s, i) => (
        <div className="image-row" key={s.id}>
          <a
            href={`/api/media/${s.id}?preview=1`}
            target="_blank"
            rel="noreferrer"
          >
            Inspect image {i + 1} ↗
          </a>
          <label className="field">
            Alt text
            <input
              aria-invalid={!!errors[`screenshots.${i}.alt`]}
              aria-describedby={
                errors[`screenshots.${i}.alt`]
                  ? `image-alt-error-${i}`
                  : undefined
              }
              value={s.alt}
              maxLength={200}
              onChange={(e) => patch(i, { alt: e.target.value })}
            />
            {errors[`screenshots.${i}.alt`] && (
              <span id={`image-alt-error-${i}`} className="hint">
                {errors[`screenshots.${i}.alt`].join(" ")}
              </span>
            )}
          </label>
          <label className="field">
            Caption
            <input
              value={s.caption}
              maxLength={500}
              onChange={(e) => patch(i, { caption: e.target.value })}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={s.reviewed}
              onChange={(e) => patch(i, { reviewed: e.target.checked })}
            />
            I inspected this image and removed private data.
            {errors[`screenshots.${i}.reviewed`] && (
              <span className="hint">
                {errors[`screenshots.${i}.reviewed`].join(" ")}
              </span>
            )}
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              disabled={i === 0}
              onClick={() => {
                const a = [...latest.current];
                [a[i - 1], a[i]] = [a[i], a[i - 1]];
                change(a);
              }}
            >
              Move up
            </button>
            <button
              type="button"
              className="secondary"
              disabled={i === value.length - 1}
              onClick={() => {
                const a = [...latest.current];
                [a[i + 1], a[i]] = [a[i], a[i + 1]];
                change(a);
              }}
            >
              Move down
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                change(latest.current.filter((s2) => s2.id !== s.id))
              }
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {failed.length > 0 && (
        <div role="alert">
          <ul>
            {failed.map(({ file, error }, i) => (
              <li key={`${file.name}-${i}`}>
                {file.name}: {error}
              </li>
            ))}
          </ul>
          <p className="hint">
            Failed selections remain available while this editor stays open.
          </p>
          {failed.some((item) => item.retryable) && (
            <button
              type="button"
              className="secondary"
              disabled={busy || disabled}
              onClick={() =>
                void upload(
                  failed
                    .filter((item) => item.retryable)
                    .map((item) => item.file),
                )
              }
            >
              Retry failed uploads
            </button>
          )}
        </div>
      )}
      <p role="status" aria-label="Image upload status">
        {busy ? "Uploading…" : message}
      </p>
    </section>
  );
}
