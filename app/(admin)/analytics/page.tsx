import { Suspense } from "react"
import { getAdminContext } from "@/lib/admin/get-admin-context"
import { createClient } from "@/lib/supabase/server"
import { isoDateOnly, bucketByDay } from "@/lib/admin/analytics-utils"

import { AnalyticsClient } from "./analytics-client"

export const dynamic = "force-dynamic"

async function AnalyticsContent() {
  const { profile } = await getAdminContext()

  if (!profile.club_id) {
    return (
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Your admin account is not connected to a club yet.
        </p>
      </div>
    )
  }

  const supabase = await createClient()
  const clubId = profile.club_id

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    membersTotalRes,
    membersLast30Res,
    membersPrev30Res,
    rsvpsLast7Res,
    rsvpsPrev7Res,
    messagesLast30Res,
    eventsUpcomingRes,
    membersJoinedRows,
    rsvpsCreatedRows,
    websiteViewsLast7Res,
    websiteViewsLast30Res,
    websiteViewsRows,
  ] = await Promise.all([
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("joined_at", thirtyDaysAgo),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("joined_at", new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .lt("joined_at", thirtyDaysAgo),
    supabase
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("created_at", fourteenDaysAgo)
      .lt("created_at", sevenDaysAgo),
    supabase
      .from("club_contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("event_date", isoDateOnly(new Date())),
    supabase
      .from("memberships")
      .select("joined_at")
      .eq("club_id", clubId)
      .gte("joined_at", thirtyDaysAgo),
    supabase
      .from("rsvps")
      .select("created_at")
      .eq("club_id", clubId)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("club_website_views")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("viewed_at", sevenDaysAgo),
    supabase
      .from("club_website_views")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("viewed_at", thirtyDaysAgo),
    supabase
      .from("club_website_views")
      .select("viewed_at")
      .eq("club_id", clubId)
      .gte("viewed_at", thirtyDaysAgo),
  ])

  const membersTotal = membersTotalRes.count ?? 0
  const membersLast30 = membersLast30Res.count ?? 0
  const membersPrev30 = membersPrev30Res.count ?? 0
  const membersDelta30 = membersLast30 - membersPrev30

  const rsvpsLast7 = rsvpsLast7Res.count ?? 0
  const rsvpsPrev7 = rsvpsPrev7Res.count ?? 0
  const rsvpsDelta7 = rsvpsLast7 - rsvpsPrev7

  const messagesLast30 = messagesLast30Res.count ?? 0
  const upcomingEvents = eventsUpcomingRes.count ?? 0
  const websiteViewsLast7 = websiteViewsLast7Res.count ?? 0
  const websiteViewsLast30 = websiteViewsLast30Res.count ?? 0

  const membersDaily = bucketByDay(
    (membersJoinedRows.data ?? []) as Array<{ joined_at: string | null }>,
    "joined_at",
    30,
  )
  const rsvpsDaily = bucketByDay(
    (rsvpsCreatedRows.data ?? []) as Array<{ created_at: string | null }>,
    "created_at",
    30,
  )
  const websiteViewsDaily = bucketByDay(
    (websiteViewsRows.data ?? []) as Array<{ viewed_at: string | null }>,
    "viewed_at",
    30,
  )

  return (
    <AnalyticsClient
      stats={{
        membersTotal,
        membersLast30,
        membersDelta30,
        rsvpsLast7,
        rsvpsDelta7,
        messagesLast30,
        upcomingEvents,
        websiteViewsLast7,
        websiteViewsLast30,
      }}
      charts={{
        membersDaily,
        rsvpsDaily,
        websiteViewsDaily,
      }}
    />
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-40 rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  )
}
