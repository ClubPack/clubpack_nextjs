import Link from "next/link"
import { ArrowRight, Building2, CalendarDays, Plus, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { clubUrl } from "@/lib/env"
import { hasRole } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { formatEventDate, formatEventTime } from "@/lib/time"

export const metadata = { title: "Home" }

export default async function DashboardHome() {
  const user = await requireUser("/")
  const supabase = await createClient()

  const [{ data: memberships }, { data: rsvps }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role, status, organizations(id, slug, name, kind, tagline, logo_path)")
      .eq("user_id", user.id)
      .neq("status", "removed")
      .order("joined_at", { ascending: false }),
    supabase
      .from("event_rsvps")
      .select("status, events(id, title, starts_at, status, clubs(organizations(slug, name, timezone)))")
      .eq("user_id", user.id)
      .in("status", ["going", "waitlisted"]),
  ])

  const orgs = (memberships ?? []).filter((m) => m.organizations)
  const running = orgs.filter((m) => m.status === "active" && hasRole(m.role, "staff"))
  const joined = orgs.filter((m) => !running.includes(m))

  const upcoming = (rsvps ?? [])
    .filter((r) => r.events && r.events.status === "scheduled" && new Date(r.events.starts_at) > new Date())
    .sort((a, b) => a.events!.starts_at.localeCompare(b.events!.starts_at))
    .slice(0, 6)

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your ClubPack</h1>
          <p className="text-sm text-muted-foreground">Clubs you run, clubs you&apos;re in, and what&apos;s coming up.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/new?kind=sponsor">
              <Building2 /> Sponsor clubs
            </Link>
          </Button>
          <Button asChild>
            <Link href="/new">
              <Plus /> Start a club
            </Link>
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">You manage</h2>
        {running.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-background p-8 text-center">
            <p className="font-medium">You aren&apos;t running a club yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set one up in a couple of minutes: events, sign-ups, waivers and check-in in one place.
            </p>
            <Button asChild className="mt-4">
              <Link href="/new">Start a club</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {running.map((m) => (
              <Link
                key={m.organizations!.id}
                href={`/o/${m.organizations!.slug}`}
                className="group rounded-xl border bg-background p-5 transition hover:border-foreground/30"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{m.organizations!.kind === "sponsor" ? "Sponsor" : "Club"}</Badge>
                  <span className="text-xs capitalize text-muted-foreground">{m.role}</span>
                </div>
                <p className="mt-3 font-semibold">{m.organizations!.name}</p>
                {m.organizations!.tagline ? (
                  <p className="line-clamp-1 text-sm text-muted-foreground">{m.organizations!.tagline}</p>
                ) : null}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                  Open dashboard <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="size-4" /> Your upcoming events
          </h2>
          {upcoming.length === 0 ? (
            <p className="rounded-xl border bg-background p-5 text-sm text-muted-foreground">No RSVPs yet.</p>
          ) : (
            <ul className="divide-y rounded-xl border bg-background">
              {upcoming.map((r) => {
                const e = r.events!
                const org = e.clubs!.organizations!
                return (
                  <li key={e.id}>
                    <a href={clubUrl(org.slug, `/events/${e.id}`)} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {org.name} · {formatEventDate(e.starts_at, org.timezone)}, {formatEventTime(e.starts_at, org.timezone)}
                        </p>
                      </div>
                      {r.status === "waitlisted" ? <Badge variant="outline">Waitlist</Badge> : <Badge>Going</Badge>}
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="size-4" /> Clubs you&apos;re in
          </h2>
          {joined.length === 0 ? (
            <p className="rounded-xl border bg-background p-5 text-sm text-muted-foreground">
              When you join a club from its site, it shows up here.
            </p>
          ) : (
            <ul className="divide-y rounded-xl border bg-background">
              {joined.map((m) => (
                <li key={m.organizations!.id}>
                  <a href={clubUrl(m.organizations!.slug)} className="flex items-center justify-between p-4 hover:bg-muted/50">
                    <span className="font-medium">{m.organizations!.name}</span>
                    {m.status === "pending" ? <Badge variant="outline">Pending approval</Badge> : <ArrowRight className="size-4 text-muted-foreground" />}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
