export default function ClubSiteLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6">
        <div className="h-10 w-72 rounded-lg bg-muted" />
        <div className="h-5 w-48 rounded-md bg-muted" />
        <div className="h-10 w-32 rounded-md bg-muted" />
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-5xl space-y-4 px-6 pb-12">
        <div className="h-6 w-40 rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
