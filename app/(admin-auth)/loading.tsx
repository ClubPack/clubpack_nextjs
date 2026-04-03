export default function AdminAuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="mx-auto h-8 w-32 rounded-md bg-muted" />
          <div className="mx-auto h-4 w-48 rounded-md bg-muted" />
        </div>
        <div className="space-y-4 rounded-lg border p-6">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-9 w-full rounded-md bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-9 w-full rounded-md bg-muted" />
          <div className="h-9 w-full rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}
