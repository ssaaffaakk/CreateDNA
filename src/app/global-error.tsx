"use client";

/**
 * Last-resort recovery. The store rehydrates from localStorage before render,
 * so a bad blob that still slips past sanitizePersisted would otherwise throw
 * on every load with no way out except devtools.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
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
      <body className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Something broke
          </h1>
          <p className="text-sm text-zinc-500">
            Your saved profile may be from an older version of the app.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <button
              onClick={clearAndReload}
              className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium"
            >
              Clear saved data
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
