"use client"

import Link from "next/link"

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-gray-600">
        We hit an unexpected error. Please try again.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-gray-400">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-9 items-center rounded-md bg-[#0054f9] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0040d6]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
