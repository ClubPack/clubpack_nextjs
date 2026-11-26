import { NewOrgForm } from "./new-org-form"

export const metadata = { title: "Get started" }

export default async function NewOrgPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const kind = (await searchParams).kind === "sponsor" ? "sponsor" : "club"
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{kind === "club" ? "Start your club" : "Set up your sponsor profile"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {kind === "club"
          ? "You'll get a club site, sign-ups with waivers, events with capacity, and check-in."
          : "Find active student clubs, see their verified reach, and propose sponsorships."}
      </p>
      <div className="mt-8 rounded-xl border bg-background p-6">
        <NewOrgForm kind={kind} />
      </div>
    </main>
  )
}
