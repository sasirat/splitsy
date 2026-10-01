"use client";

import "./globals.css";

/** Last-resort fallback when the root layout itself fails. Replaces the whole
 *  document, so it brings its own <html>/<body> and styles (no app fonts). */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6 text-center text-ink">
        <title>Splitsy — something went wrong</title>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p>Splitsy couldn&apos;t load. Please try again.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-primary px-6 py-3 font-bold text-white"
        >
          Try again
        </button>
        {error.digest ? <p className="text-sm opacity-70">Ref: {error.digest}</p> : null}
      </body>
    </html>
  );
}
