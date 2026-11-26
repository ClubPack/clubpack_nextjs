import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarDays, MapPin, Users } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { publicMediaUrl } from "@/lib/storage"
import { formatEventRange } from "@/lib/time"

import { getSiteClub, getVisitor } from "../../data"
import { RsvpPanel } from "./rsvp-panel"

async function getEvent(orgId: string, id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("events").select("*").eq("id", id).eq("organization_id", orgId).maybeSingle()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { slug, id } = await params
  const { org } = await getSiteClub(slug)
  const event = await getEvent(org.id, id)
  if (!event) return {}
  return { title: event.title, description: `${formatEventRange(event.starts_at, event.ends_at, org.timezone)} · ${org.name}` }
}

export default async function ClubEventPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const { org, club } = await getSiteClub(slug)
  const event = await getEvent(org.id, id)
  if (!event) notFound()

  const visitor = await getVisitor(org.id)
  const supabase = await createClient()
  const [{ data: availability }, { data: mine }] = await Promise.all([
    supabase.rpc("get_event_availability", { p_events: [id] }),
    visitor.user
      ? supabase.from("event_rsvps").select("status").eq("event_id", id).eq("user_id", visitor.user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const a = availability?.[0]
  const going = a?.going ?? 0
  const left = event.capacity ? Math.max(event.capacity - going, 0) : null

  const now = new Date()
  const started = new Date(event.starts_at) <= now
  const notOpenYet = event.rsvp_opens_at ? new Date(event.rsvp_opens_at) > now : false
  const closed = event.rsvp_closes_at ? new Date(event.rsvp_closes_at) <= now : false
  const cover = publicMediaUrl(event.cover_path)
  const mapsUrl = event.location_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_address)}`
    : null

  let state: "cancelled" | "past" | "not_open" | "closed" | "open" = "open"
  if (event.status === "cancelled") state = "cancelled"
  else if (started) state = "past"
  else if (notOpenYet) state = "not_open"
  else if (closed) state = "closed"

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/#events" className="text-sm text-muted-foreground hover:text-foreground">
        ← All events
      </Link>
      {cover ? <img src={cover} alt="" className="mt-4 aspect-[3/1] w-full rounded-xl object-cover" /> : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {formatEventRange(event.starts_at, event.ends_at, org.timezone)}
            </p>
            {event.location_name || event.location_address ? (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                {mapsUrl ? (
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline">
                    {event.location_name ?? event.location_address}
                  </a>
                ) : (
                  event.location_name
                )}
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              {going} going{event.capacity ? ` · ${left} of ${event.capacity} spots left` : ""}
              {a?.waitlisted ? ` · ${a.waitlisted} on the waitlist` : ""}
            </p>
          </div>
          {event.description ? <p className="mt-6 whitespace-pre-wrap leading-relaxed">{event.description}</p> : null}
        </div>

        <aside>
          <RsvpPanel
            slug={slug}
            eventId={id}
            state={state}
            opensAt={event.rsvp_opens_at ? formatEventRange(event.rsvp_opens_at, null, org.timezone) : null}
            signedIn={Boolean(visitor.user)}
            myStatus={(mine?.status as "going" | "waitlisted" | "cancelled" | undefined) ?? null}
            full={left === 0}
            guestAllowed={club.allow_guest_rsvp && !club.require_waiver && event.visibility === "public"}
            needsWaiver={club.require_waiver && Boolean(visitor.waiver) && !visitor.signedWaiver}
            brand={org.brand_color ?? "#111827"}
          />
        </aside>
      </div>
    </main>
  )
}
