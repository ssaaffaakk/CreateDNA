"use client";

import { useEffect } from "react";

/**
 * Last-resort recovery. The store rehydrates from localStorage before render,
 * so a bad blob that still slips past sanitizePersisted would otherwise throw
 * on every load with no way out except devtools.
 *
 * Styled with its own <style> block: global-error REPLACES the root layout
 * when active, so globals.css — and with it every Tailwind class and the
 * --color-accent token — is not loaded here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // This screen exists because rendering failed — make sure the underlying
    // cause is at least visible in the console.
    console.error(error);
  }, [error]);

  const clearAndReload = () => {
    try {
      localStorage.removeItem("creative-dna-store");
    } catch {
      // ignore — reloading is still worth attempting
    }
    window.location.reload();
  };

  return (
    <html lang="en">
      <body>
        <style>{`
          body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: #fff; color: #18181b; font-family: system-ui, -apple-system, sans-serif; }
          .ge-wrap { max-width: 340px; width: 100%; text-align: center; }
          .ge-title { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 8px; }
          .ge-text { font-size: 14px; line-height: 1.5; color: #71717a; margin: 0 0 16px; }
          .ge-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
          .ge-btn { padding: 10px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; font-family: inherit; cursor: pointer; }
          .ge-primary { border: none; background: #e86c25; color: #fff; }
          .ge-secondary { border: 1px solid #d4d4d8; background: transparent; color: inherit; }
          @media (prefers-color-scheme: dark) {
            body { background: #09090b; color: #fafafa; }
            .ge-secondary { border-color: #3f3f46; }
          }
        `}</style>
        <div className="ge-wrap">
          <h1 className="ge-title">Something broke</h1>
          <p className="ge-text">
            Your saved profile may be from an older version of the app.
          </p>
          <div className="ge-actions">
            <button onClick={clearAndReload} className="ge-btn ge-primary">
              Clear saved data
            </button>
            <button onClick={reset} className="ge-btn ge-secondary">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
