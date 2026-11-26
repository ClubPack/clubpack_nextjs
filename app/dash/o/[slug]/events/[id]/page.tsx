import Link from "next/link"
import { notFound } from "next/navigation"
import QRCode from "qrcode"

import { ActionButton } from "@/components/form"
import { PageHeader, Panel, Stat } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { clubUrl } from "@/lib/env"
import { requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { formatEventRange } from "@/lib/time"

import { deleteEvent, rotateCheckinCode, setEventStatus } from "../actions"
import { Roster, type RosterRow } from "./roster"

export const metadata = { title: "Event" }

export default async function EventPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const { org } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()

  const { data: event } = await supabase.from("events").select("*").eq("id", id).eq("organization_id", org.id).maybeSingle()
  if (!event) notFound()

  const [{ data: rsvps }, { data: checkins }, { data: code }, { data: members }] = await Promise.all([
    supabase
      .from("event_rsvps")
      .select("id, status, user_id, guest_name, guest_email, created_at, profiles(full_name)")
      .eq("event_id", id)
      .neq("status", "cancelled")
      .order("created_at"),
    supabase.from("check_ins").select("id, user_id, rsvp_id, guest_name, method, checked_in_at, profiles!check_ins_user_id_fkey(full_name)").eq("event_id", id),
    supabase.from("event_checkin_codes").select("code").eq("event_id", id).maybeSingle(),
    supabase
      .from("organization_members")
      .select("user_id, profiles(full_name)")
      .eq("organization_id", org.id)
      .eq("status", "active"),
  ])

  const checkinByUser = new Map((checkins ?? []).filter((c) => c.user_id).map((c) => [c.user_id!, c.id]))
  const checkinByRsvp = new Map((checkins ?? []).filter((c) => c.rsvp_id).map((c) => [c.rsvp_id!, c.id]))

  const rows: RosterRow[] = (rsvps ?? []).map((r) => ({
    key: r.id,
    rsvpId: r.id,
    userId: r.user_id,
    name: r.profiles?.full_name || r.guest_name || "Member",
    detail: r.user_id ? null : `Guest · ${r.guest_email}`,
    status: r.status as "going" | "waitlisted",
    checkInId: (r.user_id && checkinByUser.get(r.user_id)) || checkinByRsvp.get(r.id) || null,
  }))

  // Walk-ins: checked in without an RSVP.
  const rsvpUsers = new Set((rsvps ?? []).map((r) => r.user_id).filter(Boolean))
  for (const c of checkins ?? []) {
    if (c.rsvp_id || (c.user_id && rsvpUsers.has(c.user_id))) continue
    rows.push({
      key: c.id,
      rsvpId: null,
      userId: c.user_id,
      name: c.profiles?.full_name || c.guest_name || "Walk-in",
      detail: "Walk-in",
      status: "walk_in",
      checkInId: c.id,
    })
  }

  const going = rows.filter((r) => r.status === "going").length
  const waitlisted = rows.filter((r) => r.status === "waitlisted").length
  const checkedIn = (checkins ?? []).length

  const checkinUrl = code ? clubUrl(slug, `/checkin/${id}?code=${code.code}`) : null
  const qrSvg = checkinUrl ? await QRCode.toString(checkinUrl, { type: "svg", margin: 1, width: 240 }) : null

  const memberOptions = (members ?? [])
    .filter((m) => !checkinByUser.has(m.user_id))
    .map((m) => ({ id: m.user_id, name: m.profiles?.full_name || "Member" }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const isPast = new Date(event.starts_at) < new Date()

  return (
    <>
      <PageHeader
        title={event.title}
        description={
          <>
            {formatEventRange(event.starts_at, event.ends_at, org.timezone)}
            {event.location_name ? ` · ${event.location_name}` : ""}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <a href={clubUrl(slug, `/events/${id}`)} target="_blank" rel="noreferrer">
                Public page ↗
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/o/${slug}/events/${id}/edit`}>Edit</Link>
            </Button>
          </>
        }
      />

      {event.status === "cancelled" ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">This event is cancelled. People can no longer RSVP.</div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Going" value={event.capacity ? `${going}/${event.capacity}` : going} />
        <Stat label="Waitlist" value={waitlisted} />
        <Stat label="Checked in" value={checkedIn} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <Panel title="Check-in" description="Tap a name to check them in. Walk-ins can be added below.">
          <Roster slug={slug} eventId={id} rows={rows} members={memberOptions} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Door QR code" description="Members scan this to check themselves in.">
            {qrSvg ? (
              <div className="space-y-3">
                <div className="mx-auto w-full max-w-[240px] [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                {checkinUrl ? (
                  <a href={checkinUrl} target="_blank" rel="noreferrer" className="block text-center text-xs text-muted-foreground underline">
                    Check-in link (share with people at the door)
                  </a>
                ) : null}
                <form action={rotateCheckinCode.bind(null, slug, id)}>
                  <Button variant="outline" size="sm" className="w-full">
                    New code
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground">A new code invalidates the old one, e.g. if a photo of it gets shared.</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No code for this event.</p>
            )}
          </Panel>

          <Panel title="Manage">
            <div className="flex flex-col gap-2">
              {event.status === "scheduled" ? (
                <form action={setEventStatus.bind(null, slug, id, "cancelled")}>
                  <Button variant="outline" size="sm" className="w-full" disabled={isPast}>
                    Cancel event
                  </Button>
                </form>
              ) : (
                <form action={setEventStatus.bind(null, slug, id, "scheduled")}>
                  <Button variant="outline" size="sm" className="w-full">
                    Reinstate event
                  </Button>
                </form>
              )}
              <ActionButton
                action={deleteEvent.bind(null, slug, id)}
                confirm="Delete this event and its RSVPs and check-ins? This can't be undone."
                variant="ghost"
                size="sm"
                className="w-full text-destructive"
                pendingText="Deleting…"
              >
                Delete event
              </ActionButton>
              {event.series_id ? <Badge variant="secondary" className="self-start">Part of a weekly series</Badge> : null}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
