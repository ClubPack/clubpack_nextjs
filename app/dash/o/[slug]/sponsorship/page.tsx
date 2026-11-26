import Link from "next/link"

import { ActionForm, Field, SubmitButton, selectClass } from "@/components/form"
import { EmptyState, PageHeader, Panel } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { clubUrl } from "@/lib/env"
import { BILLING_LABEL, DEAL_STATUS_LABEL, formatMoney } from "@/lib/money"
import { getClub, requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"

import { addPackage, setOpenToSponsors, togglePackage } from "./actions"

export const metadata = { title: "Sponsorship" }

export default async function SponsorshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  const isClub = org.kind === "club"

  const { data: deals } = await supabase
    .from("sponsorship_deals")
    .select("id, title, status, amount_cents, currency, proposed_by_org, created_at, club:clubs!sponsorship_deals_club_id_fkey(organizations(name, slug)), sponsor:sponsors!sponsorship_deals_sponsor_id_fkey(organizations(name, slug))")
    .eq(isClub ? "club_id" : "sponsor_id", org.id)
    .order("created_at", { ascending: false })

  const dealList =
    (deals ?? []).length === 0 ? (
      <EmptyState title="No deals yet">
        {isClub ? "Open your club to sponsors and publish a package so local businesses can find you." : <Link href={`/o/${slug}/discover`} className="underline">Find clubs to sponsor</Link>}
      </EmptyState>
    ) : (
      <ul className="divide-y">
        {deals!.map((d) => {
          const other = isClub ? d.sponsor?.organizations : d.club?.organizations
          const needsMe = d.status === "proposed" && d.proposed_by_org !== org.id
          return (
            <li key={d.id}>
              <Link href={`/o/${slug}/sponsorship/${d.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-muted/40">
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {other?.name ?? "—"} · {formatMoney(d.amount_cents, d.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {needsMe ? <Badge>Needs your answer</Badge> : null}
                  <Badge variant="outline">{DEAL_STATUS_LABEL[d.status]}</Badge>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    )

  if (!isClub) {
    return (
      <>
        <PageHeader title="Deals" actions={<Button asChild><Link href={`/o/${slug}/discover`}>Find clubs</Link></Button>} />
        <Panel>
          {dealList}
        </Panel>
      </>
    )
  }

  const club = await getClub(org.id)
  const { data: packages } = await supabase
    .from("sponsorship_packages")
    .select("*")
    .eq("organization_id", org.id)
    .order("position")

  return (
    <>
      <PageHeader title="Sponsorship" description="Your verified attendance numbers are what make sponsors say yes." />
      <div className="space-y-6">
        <Panel
          title={club?.open_to_sponsors ? "Open to sponsors" : "Not open to sponsors"}
          description={
            club?.open_to_sponsors
              ? "Sponsors can find your club, see your stats and active packages, and send proposals."
              : "Turn this on to list your club for sponsors and publish a sponsor page on your site."
          }
          actions={
            <div className="flex gap-2">
              {club?.open_to_sponsors ? (
                <Button asChild variant="outline" size="sm">
                  <a href={clubUrl(slug, "/sponsor")} target="_blank" rel="noreferrer">
                    View sponsor page ↗
                  </a>
                </Button>
              ) : null}
              <form action={setOpenToSponsors.bind(null, slug, !club?.open_to_sponsors)}>
                <Button size="sm" variant={club?.open_to_sponsors ? "outline" : "default"} disabled={!org.is_public && !club?.open_to_sponsors}>
                  {club?.open_to_sponsors ? "Close" : "Open to sponsors"}
                </Button>
              </form>
            </div>
          }
        >
          {!org.is_public ? <p className="text-sm text-muted-foreground">Make your club site public in Settings first.</p> : null}
        </Panel>

        <Panel title="Deals">
          {dealList}
        </Panel>

        <Panel title="Packages" description="What a sponsor gets, and what it costs. Keep it concrete.">
          {(packages ?? []).length > 0 ? (
            <ul className="mb-6 divide-y">
              {packages!.map((p) => (
                <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">
                      {p.title} · {formatMoney(p.price_cents, p.currency)} {BILLING_LABEL[p.billing_period]}
                    </p>
                    {p.deliverables.length ? (
                      <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                        {p.deliverables.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <form action={togglePackage.bind(null, slug, p.id, !p.is_active)}>
                    <Button size="sm" variant="outline">
                      {p.is_active ? "Hide" : "Show"}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
          <ActionForm action={addPackage.bind(null, slug)} resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px_160px]">
              <Field label="Package name" htmlFor="title">
                <Input id="title" name="title" placeholder="e.g. Season sponsor" required />
              </Field>
              <Field label="Price ($)" htmlFor="price">
                <Input id="price" name="price" inputMode="decimal" placeholder="250" required />
              </Field>
              <Field label="Billed" htmlFor="billing_period">
                <select id="billing_period" name="billing_period" className={selectClass} defaultValue="per_semester">
                  <option value="one_time">One-time</option>
                  <option value="per_event">Per event</option>
                  <option value="per_semester">Per semester</option>
                  <option value="per_year">Per year</option>
                </select>
              </Field>
            </div>
            <Field label="What the sponsor gets" htmlFor="deliverables" hint="One per line.">
              <Textarea id="deliverables" name="deliverables" rows={4} placeholder={"Logo on our club site\nShout-out at every session\nYour perk handed out at check-in"} />
            </Field>
            <Field label="Description (optional)" htmlFor="description">
              <Input id="description" name="description" />
            </Field>
            <SubmitButton size="sm">Add package</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  )
}
