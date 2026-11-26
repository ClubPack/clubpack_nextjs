import Link from "next/link"
import { notFound } from "next/navigation"

import { EmptyState, PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { requireOrgAccess } from "@/lib/orgs"
import { publicMediaUrl } from "@/lib/storage"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Find clubs" }

export default async function DiscoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { slug } = await params
  const q = ((await searchParams).q ?? "").trim()
  const { org } = await requireOrgAccess(slug, "staff")
  if (org.kind !== "sponsor") notFound()

  const supabase = await createClient()
  const { data: clubs } = await supabase
    .from("clubs")
    .select("organization_id, category, organizations(name, slug, tagline, school, city, logo_path, archived_at, is_public)")
    .eq("open_to_sponsors", true)
    .limit(60)

  const needle = q.toLowerCase()
  const visible = (clubs ?? [])
    .filter((c) => c.organizations && c.organizations.is_public && !c.organizations.archived_at)
    .filter((c) => {
      if (!needle) return true
      const o = c.organizations!
      return [o.name, o.school, o.city, o.tagline, c.category].some((v) => v?.toLowerCase().includes(needle))
    })

  const stats = await Promise.all(
    visible.map(async (c) => {
      const { data } = await supabase.rpc("get_club_stats", { p_club: c.organization_id, p_days: 90 })
      return [c.organization_id, data?.[0]] as const
    }),
  )
  const statMap = new Map(stats)

  return (
    <>
      <PageHeader title="Find clubs" description="Clubs that are open to sponsors. Numbers are from real check-ins in the last 90 days." />
      <form className="mb-6 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search by school, city, or interest" />
        <Button variant="outline">Search</Button>
      </form>

      {visible.length === 0 ? (
        <EmptyState title={q ? "No clubs match that search" : "No clubs are open to sponsors yet"} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((c) => {
            const o = c.organizations!
            const s = statMap.get(c.organization_id)
            const logo = publicMediaUrl(o.logo_path)
            return (
              <Link key={c.organization_id} href={`/o/${slug}/discover/${o.slug}`} className="rounded-xl border bg-background p-5 transition hover:border-foreground/30">
                <div className="flex items-center gap-3">
                  {logo ? <img src={logo} alt="" className="size-10 rounded-lg object-cover" /> : <div className="size-10 rounded-lg bg-muted" />}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{o.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{[o.school, o.city].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {c.category ? <Badge variant="secondary">{c.category}</Badge> : null}
                  <Badge variant="outline">{s?.active_members ?? 0} members</Badge>
                  <Badge variant="outline">{s?.unique_attendees ?? 0} attendees</Badge>
                  <Badge variant="outline">{s?.avg_attendance ?? 0} avg / event</Badge>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
