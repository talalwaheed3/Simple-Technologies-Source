import { Screenshot } from "./screenshot";
import type { Post } from "@/lib/types";
export function ArticleBody({
  post,
  preview = false,
}: {
  post: Post;
  preview?: boolean;
}) {
  const parts = [
    ["symptoms", "Symptoms", post.symptoms],
    ["error", "Error message", post.error_message],
    ["cause", "What caused it", post.cause],
  ];
  return (
    <>
      <div className="quick">
        <h2>Quick answer</h2>
        <p>{post.excerpt}</p>
      </div>
      {post.warnings && (
        <aside className="notice warning">
          <strong>Before you begin</strong>
          <p>{post.warnings}</p>
        </aside>
      )}
      {parts.map(
        ([id, title, body]) =>
          body && (
            <section id={id} key={id}>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ),
      )}
      <section id="solution">
        <h2>Step-by-step solution</h2>
        <ol>
          {post.steps
            .split("\n")
            .filter(Boolean)
            .map((step, i) => (
              <li key={i}>{step}</li>
            ))}
        </ol>
      </section>
      {post.commands && (
        <>
          <h2>Commands</h2>
          <pre>
            <code>{post.commands}</code>
          </pre>
        </>
      )}
      {post.screenshots.map((s) => (
        <figure key={s.id}>
          <Screenshot
            src={`/api/media/${s.id}${preview ? "?preview=1" : ""}`}
            alt={s.alt}
            width={s.width}
            height={s.height}
          />
          {s.caption && <figcaption>{s.caption}</figcaption>}
        </figure>
      ))}
      {post.verification && (
        <section id="verification">
          <h2>How to verify the repair</h2>
          <p>{post.verification}</p>
        </section>
      )}
      {post.alternatives && (
        <section id="alternatives">
          <h2>If it still does not work</h2>
          <p>{post.alternatives}</p>
        </section>
      )}
      {post.faq.length > 0 && (
        <section>
          <h2>Common questions</h2>
          {post.faq.map((f) => (
            <details key={f.question}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
