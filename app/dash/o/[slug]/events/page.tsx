import Link from "next/link"

import { EmptyState, PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { formatEventDate, formatEventTime } from "@/lib/time"
import { cn } from "@/lib/utils"

export const metadata = { title: "Events" }

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const { slug } = await params
  const past = (await searchParams).view === "past"
  const { org } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  const now = new Date().toISOString()

  let query = supabase
    .from("events")
    .select("id, title, starts_at, capacity, status, visibility, series_id")
    .eq("organization_id", org.id)
  query = past ? query.lt("starts_at", now).order("starts_at", { ascending: false }).limit(50) : query.gte("starts_at", now).order("starts_at").limit(100)
  const { data: events } = await query

  const ids = (events ?? []).map((e) => e.id)
  const [{ data: availability }, { data: checkins }] = await Promise.all([
    ids.length ? supabase.rpc("get_event_availability", { p_events: ids }) : Promise.resolve({ data: [] }),
    past && ids.length ? supabase.from("check_ins").select("event_id").in("event_id", ids) : Promise.resolve({ data: [] }),
  ])
  const spots = new Map((availability ?? []).map((a) => [a.event_id, a]))
  const attended = new Map<string, number>()
  for (const c of (checkins ?? []) as { event_id: string }[]) attended.set(c.event_id, (attended.get(c.event_id) ?? 0) + 1)

  return (
    <>
      <PageHeader
        title="Events"
        actions={
          <Button asChild>
            <Link href={`/o/${slug}/events/new`}>New event</Link>
          </Button>
        }
      />
      <div className="mb-4 flex gap-1 text-sm">
        {[
          { label: "Upcoming", href: `/o/${slug}/events`, active: !past },
          { label: "Past", href: `/o/${slug}/events?view=past`, active: past },
        ].map((t) => (
          <Link key={t.label} href={t.href} className={cn("rounded-md px-3 py-1.5", t.active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
            {t.label}
          </Link>
        ))}
      </div>

      {(events ?? []).length === 0 ? (
        <EmptyState title={past ? "No past events yet" : "Nothing scheduled"}>
          {!past ? (
            <Link href={`/o/${slug}/events/new`} className="underline">
              Create an event
            </Link>
          ) : null}
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border bg-background">
          {events!.map((e) => {
            const a = spots.get(e.id)
            return (
              <li key={e.id}>
                <Link href={`/o/${slug}/events/${e.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/40">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatEventDate(e.starts_at, org.timezone)} · {formatEventTime(e.starts_at, org.timezone)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {e.status === "cancelled" ? <Badge variant="destructive">Cancelled</Badge> : null}
                    {e.visibility === "members" ? <Badge variant="outline">Members only</Badge> : null}
                    {e.series_id ? <Badge variant="secondary">Weekly</Badge> : null}
                    <span className="tabular-nums text-muted-foreground">
                      {past ? `${attended.get(e.id) ?? 0} checked in · ` : ""}
                      {a?.going ?? 0}
                      {e.capacity ? `/${e.capacity}` : ""} going
                      {a?.waitlisted ? ` · ${a.waitlisted} waitlist` : ""}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
