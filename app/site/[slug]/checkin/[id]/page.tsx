import { redirect } from "next/navigation"

import { getUser } from "@/lib/auth"

import { getSiteClub } from "../../data"
import { CheckInButton } from "./check-in-button"

export const metadata = { title: "Check in" }

export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const { slug, id } = await params
  const code = (await searchParams).code ?? ""
  const { org } = await getSiteClub(slug)
  const self = `/checkin/${id}?code=${encodeURIComponent(code)}`

  if (!(await getUser())) redirect(`/login?next=${encodeURIComponent(self)}`)

  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Check in to {org.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tap below so the club knows you made it.</p>
      <div className="mt-8">
        <CheckInButton slug={slug} eventId={id} code={code} brand={org.brand_color ?? "#111827"} />
      </div>
    </main>
  )
}
