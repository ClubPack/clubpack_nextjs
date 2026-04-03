import Link from "next/link"

export default function ClubNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Club not found</h1>
      <p className="max-w-md text-muted-foreground">
        We couldn&apos;t find a club at this address. It may have been moved or
        doesn&apos;t exist yet.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go to ClubPack
      </Link>
    </div>
  )
}
