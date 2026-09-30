"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="wrap section">
      <div className="empty">
        <h1>We could not load this page.</h1>
        <p>
          Please try again in a moment. Your device has not caused this error.
        </p>
        <button onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
