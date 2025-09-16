"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ padding: 24, fontFamily: "system-ui" }}>
        <h2>Something went wrong</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error?.message}</pre>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={() => reset()}>Try again</button>
          <a href="/">Back home</a>
        </div>
      </body>
    </html>
  );
}
