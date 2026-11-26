import Link from "next/link"
import { AtSign, CalendarDays, Mail, MapPin, Users } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { publicMediaUrl } from "@/lib/storage"
import { formatEventDate, formatEventTime } from "@/lib/time"

import { getSiteClub, getVisitor } from "./data"

export default async function ClubHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org, club } = await getSiteClub(slug)
  const visitor = await getVisitor(org.id)
  const supabase = await createClient()

  const [{ data: events }, { data: faqs }, { data: memberCount }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, starts_at, location_name, capacity, status, visibility, cover_path")
      .eq("organization_id", org.id)
      .gte("starts_at", new Date().toISOString())
      .eq("status", "scheduled")
      .order("starts_at")
      .limit(8),
    supabase.from("club_faqs").select("id, question, answer").eq("organization_id", org.id).order("position"),
    supabase.rpc("get_club_member_count", { p_club: org.id }),
  ])

  const ids = (events ?? []).map((e) => e.id)
  const { data: availability } = ids.length ? await supabase.rpc("get_event_availability", { p_events: ids }) : { data: [] }
  const spots = new Map((availability ?? []).map((a) => [a.event_id, a]))

  const cover = publicMediaUrl(org.cover_path)
  const brand = org.brand_color ?? "#111827"
  const isMember = visitor.membership?.status === "active"
  const pending = visitor.membership?.status === "pending"

  return (
    <main>
      <section className="relative overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${brand}, #111827)` }} />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-white sm:py-28">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">{org.name}</h1>
          {org.tagline ? <p className="mt-3 max-w-2xl text-lg text-white/85">{org.tagline}</p> : null}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
            {org.school || org.city ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {[org.school, org.city].filter(Boolean).join(" · ")}
              </span>
            ) : null}
            {memberCount ? (
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            ) : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {isMember ? (
              <span className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-medium">You&apos;re a member ✓</span>
            ) : pending ? (
              <span className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-medium">Membership pending approval</span>
            ) : club.join_policy !== "invite_only" ? (
              <Link href="/join" className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-white/90">
                {club.join_policy === "approval" ? "Request to join" : "Join the club"}
              </Link>
            ) : null}
            <Link href="#events" className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold hover:bg-white/10">
              See events
            </Link>
          </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-12">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <CalendarDays className="size-6" /> Upcoming
        </h2>
        {(events ?? []).length === 0 ? (
          <p className="mt-4 text-muted-foreground">No events scheduled right now. Check back soon.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {events!.map((e) => {
              const a = spots.get(e.id)
              const left = e.capacity ? Math.max(e.capacity - (a?.going ?? 0), 0) : null
              return (
                <Link key={e.id} href={`/events/${e.id}`} className="group rounded-xl border p-5 transition hover:shadow-md">
                  <p className="text-sm font-medium" style={{ color: brand }}>
                    {formatEventDate(e.starts_at, org.timezone)} · {formatEventTime(e.starts_at, org.timezone)}
                  </p>
                  <p className="mt-1 text-lg font-semibold group-hover:underline">{e.title}</p>
                  {e.location_name ? <p className="text-sm text-muted-foreground">{e.location_name}</p> : null}
                  <p className="mt-3 text-sm text-muted-foreground">
                    {left === null ? `${a?.going ?? 0} going` : left > 0 ? `${left} spot${left === 1 ? "" : "s"} left` : "Full · join the waitlist"}
                    {e.visibility === "members" ? " · Members only" : ""}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {org.description ? (
        <section className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl font-semibold tracking-tight">About</h2>
          <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-relaxed text-muted-foreground">{org.description}</p>
        </section>
      ) : null}

      {(faqs ?? []).length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <div className="mt-4 divide-y rounded-xl border">
            {faqs!.map((f) => (
              <details key={f.id} className="group p-4">
                <summary className="cursor-pointer list-none font-medium">{f.question}</summary>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {org.contact_email || org.instagram_handle || org.website_url ? (
        <section className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl font-semibold tracking-tight">Get in touch</h2>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {org.contact_email ? (
              <a href={`mailto:${org.contact_email}`} className="flex items-center gap-2 underline">
                <Mail className="size-4" />
                {org.contact_email}
              </a>
            ) : null}
            {org.instagram_handle ? (
              <a href={`https://instagram.com/${org.instagram_handle}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                <AtSign className="size-4" />@{org.instagram_handle}
              </a>
            ) : null}
            {org.website_url ? (
              <a href={org.website_url} target="_blank" rel="noreferrer" className="underline">
                Website
              </a>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  )
}
