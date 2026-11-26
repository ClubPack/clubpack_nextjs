import { notFound } from "next/navigation"

import { appUrl } from "@/lib/env"
import { BILLING_LABEL, formatMoney } from "@/lib/money"
import { createClient } from "@/lib/supabase/server"

import { getSiteClub } from "../data"

export const metadata = { title: "Sponsor us" }

export default async function SponsorKitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org, club } = await getSiteClub(slug)
  if (!club.open_to_sponsors) notFound()

  const supabase = await createClient()
  const [{ data: stats }, { data: packages }] = await Promise.all([
    supabase.rpc("get_club_stats", { p_club: org.id, p_days: 90 }),
    supabase.from("sponsorship_packages").select("*").eq("organization_id", org.id).eq("is_active", true).order("position"),
  ])
  const s = stats?.[0]
  const brand = org.brand_color ?? "#111827"

  const figures = [
    { label: "Active members", value: s?.active_members ?? 0 },
    { label: "Events in the last 90 days", value: s?.events_held ?? 0 },
    { label: "People who showed up", value: s?.unique_attendees ?? 0 },
    { label: "Average attendance", value: s?.avg_attendance ?? 0 },
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-wide" style={{ color: brand }}>
        Sponsorship
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Reach {org.name}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {org.tagline ?? org.description?.slice(0, 200)} These numbers come from real check-ins at our events, verified by ClubPack.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="rounded-xl border p-5">
            <p className="text-3xl font-bold tabular-nums">{f.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-semibold tracking-tight">Packages</h2>
      {(packages ?? []).length === 0 ? (
        <p className="mt-3 text-muted-foreground">We&apos;re open to sponsors. Get in touch with what you have in mind.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {packages!.map((p) => (
            <div key={p.id} className="rounded-xl border p-6">
              <p className="text-lg font-semibold">{p.title}</p>
              <p className="mt-1 text-2xl font-bold">
                {formatMoney(p.price_cents, p.currency)} <span className="text-sm font-normal text-muted-foreground">{BILLING_LABEL[p.billing_period]}</span>
              </p>
              {p.description ? <p className="mt-2 text-sm text-muted-foreground">{p.description}</p> : null}
              <ul className="mt-4 space-y-1 text-sm">
                {p.deliverables.map((d) => (
                  <li key={d}>✓ {d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-xl border p-6">
        <p className="font-semibold">Interested?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a free sponsor profile on ClubPack to send a proposal and track what you get.
          {org.contact_email ? (
            <>
              {" "}
              Or email us at{" "}
              <a className="underline" href={`mailto:${org.contact_email}`}>
                {org.contact_email}
              </a>
              .
            </>
          ) : null}
        </p>
        <a href={appUrl(`/new?kind=sponsor`)} className="mt-4 inline-block rounded-md px-5 py-2 text-sm font-semibold text-white" style={{ background: brand }}>
          Sponsor {org.name}
        </a>
      </div>
    </main>
  )
}
