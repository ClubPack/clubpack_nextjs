"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="mx-auto max-w-md space-y-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-zinc-400">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-zinc-600">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="inline-flex h-9 items-center rounded-md bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
