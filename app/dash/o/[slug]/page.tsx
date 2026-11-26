import Link from "next/link"
import { CheckCircle2, Circle } from "lucide-react"

import { EmptyState, PageHeader, Panel, Stat } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { clubUrl } from "@/lib/env"
import { getClub, requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { formatEventDate, formatEventTime } from "@/lib/time"

export const metadata = { title: "Overview" }

export default async function OrgOverview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org } = await requireOrgAccess(slug, "staff")
  return org.kind === "club" ? <ClubOverview orgId={org.id} slug={slug} /> : <SponsorOverview orgId={org.id} slug={slug} />
}

async function ClubOverview({ orgId, slug }: { orgId: string; slug: string }) {
  const supabase = await createClient()
  const club = await getClub(orgId)
  const now = new Date().toISOString()

  const [{ data: org }, { data: stats }, { data: events }, pending, waiver, proposals, eventCount] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).single(),
    supabase.rpc("get_club_stats", { p_club: orgId, p_days: 90 }),
    supabase
      .from("events")
      .select("id, title, starts_at, capacity, status")
      .eq("organization_id", orgId)
      .gte("starts_at", now)
      .order("starts_at")
      .limit(5),
    supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "pending"),
    supabase.from("waivers").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("is_active", true),
    supabase.from("sponsorship_deals").select("id", { count: "exact", head: true }).eq("club_id", orgId).eq("status", "proposed"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
  ])

  const ids = (events ?? []).map((e) => e.id)
  const { data: availability } = ids.length
    ? await supabase.rpc("get_event_availability", { p_events: ids })
    : { data: [] as { event_id: string; going: number; waitlisted: number; capacity: number | null }[] }
  const spots = new Map((availability ?? []).map((a) => [a.event_id, a]))
  const s = stats?.[0]
  const tz = org?.timezone ?? "America/New_York"

  const checklist = [
    { done: Boolean(org?.description && org?.logo_path), label: "Add a logo and description", href: `/o/${slug}/site` },
    { done: (eventCount.count ?? 0) > 0, label: "Create your first event", href: `/o/${slug}/events/new` },
    { done: !club?.require_waiver || (waiver.count ?? 0) > 0, label: "Publish a waiver (if you need one)", href: `/o/${slug}/waiver` },
    { done: (s?.active_members ?? 0) > 1, label: "Share your club link and get members", href: clubUrl(slug), external: true },
    { done: (s?.total_check_ins ?? 0) > 0, label: "Check people in at an event", href: `/o/${slug}/events` },
  ]
  const remaining = checklist.filter((c) => !c.done).length

  return (
    <>
      <PageHeader
        title="Overview"
        description="Last 90 days. These numbers come from real check-ins, so sponsors can trust them."
        actions={
          <Button asChild>
            <Link href={`/o/${slug}/events/new`}>New event</Link>
          </Button>
        }
      />

      {remaining > 0 ? (
        <Panel title="Get your club running" description={`${checklist.length - remaining} of ${checklist.length} done`}>
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <a href={c.href} target={c.external ? "_blank" : undefined} className="flex items-center gap-3 text-sm hover:underline">
                  {c.done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4 text-muted-foreground" />}
                  <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active members" value={s?.active_members ?? 0} />
        <Stat label="Events held" value={s?.events_held ?? 0} />
        <Stat label="Check-ins" value={s?.total_check_ins ?? 0} hint={`${s?.unique_attendees ?? 0} unique people`} />
        <Stat label="Avg. attendance" value={s?.avg_attendance ?? 0} />
      </div>

      {(pending.count ?? 0) > 0 || (proposals.count ?? 0) > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {(pending.count ?? 0) > 0 ? (
            <Link href={`/o/${slug}/members`} className="rounded-lg border bg-amber-50 px-4 py-2 text-sm">
              {pending.count} member request{pending.count === 1 ? "" : "s"} waiting →
            </Link>
          ) : null}
          {(proposals.count ?? 0) > 0 ? (
            <Link href={`/o/${slug}/sponsorship`} className="rounded-lg border bg-emerald-50 px-4 py-2 text-sm">
              {proposals.count} sponsorship proposal{proposals.count === 1 ? "" : "s"} to review →
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6">
        <Panel title="Coming up">
          {(events ?? []).length === 0 ? (
            <EmptyState title="No upcoming events">
              <Link href={`/o/${slug}/events/new`} className="underline">
                Create one
              </Link>
            </EmptyState>
          ) : (
            <ul className="divide-y">
              {events!.map((e) => {
                const a = spots.get(e.id)
                return (
                  <li key={e.id}>
                    <Link href={`/o/${slug}/events/${e.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40">
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatEventDate(e.starts_at, tz)} · {formatEventTime(e.starts_at, tz)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {e.status === "cancelled" ? <Badge variant="destructive">Cancelled</Badge> : null}
                        <span className="tabular-nums">
                          {a?.going ?? 0}
                          {e.capacity ? ` / ${e.capacity}` : ""} going
                        </span>
                        {a?.waitlisted ? <Badge variant="outline">{a.waitlisted} waitlist</Badge> : null}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

async function SponsorOverview({ orgId, slug }: { orgId: string; slug: string }) {
  const supabase = await createClient()
  const { data: deals } = await supabase
    .from("sponsorship_deals")
    .select("id, status, amount_cents, currency")
    .eq("sponsor_id", orgId)

  const by = (st: string) => (deals ?? []).filter((d) => d.status === st)
  const committed = (deals ?? [])
    .filter((d) => ["accepted", "active", "completed"].includes(d.status))
    .reduce((sum, d) => sum + d.amount_cents, 0)

  return (
    <>
      <PageHeader
        title="Overview"
        description="Find active clubs, see verified attendance, and sponsor the ones that fit."
        actions={
          <Button asChild>
            <Link href={`/o/${slug}/discover`}>Find clubs</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Proposals out" value={by("proposed").length} />
        <Stat label="Accepted" value={by("accepted").length + by("active").length} />
        <Stat label="Completed" value={by("completed").length} />
        <Stat label="Committed" value={`$${(committed / 100).toLocaleString()}`} />
      </div>
      <div className="mt-6">
        <Panel title="How it works">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Browse clubs that are open to sponsors. Their member and attendance numbers come from real check-ins.</li>
            <li>Pick one of their packages or propose your own terms.</li>
            <li>When they accept, track deliverables (logo on their site, shout-outs, perks at events) on the deal.</li>
          </ol>
        </Panel>
      </div>
    </>
  )
}
