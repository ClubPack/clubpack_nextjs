export default function MarketingLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-8">
        <div className="h-12 w-96 max-w-full rounded-lg bg-gray-200" />
        <div className="h-6 w-64 max-w-full rounded-md bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-10 w-36 rounded-lg bg-gray-200" />
          <div className="h-10 w-36 rounded-lg bg-gray-200" />
        </div>
        <div className="mt-8 h-80 w-full max-w-4xl rounded-xl bg-gray-100" />
      </div>
    </div>
  )
}
