export default function TourLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="animate-pulse space-y-4 text-center">
        <div className="mx-auto h-10 w-48 rounded-lg bg-muted" />
        <div className="mx-auto h-5 w-64 rounded-md bg-muted" />
      </div>
    </div>
  )
}
