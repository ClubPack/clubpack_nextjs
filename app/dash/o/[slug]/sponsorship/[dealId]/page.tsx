import { notFound } from "next/navigation"

import { ActionForm, SubmitButton, selectClass } from "@/components/form"
import { PageHeader, Panel } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DEAL_STATUS_LABEL, formatMoney } from "@/lib/money"
import { requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { formatEventDate } from "@/lib/time"

import { addDeliverable, setDealStatus, setDeliverableDone } from "../actions"

export const metadata = { title: "Deal" }

export default async function DealPage({ params }: { params: Promise<{ slug: string; dealId: string }> }) {
  const { slug, dealId } = await params
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()

  const { data: deal } = await supabase
    .from("sponsorship_deals")
    .select("*, club:clubs!sponsorship_deals_club_id_fkey(organizations(name, slug, timezone)), sponsor:sponsors!sponsorship_deals_sponsor_id_fkey(industry, organizations(name, slug, website_url, description)), package:sponsorship_packages(title, deliverables)")
    .eq("id", dealId)
    .maybeSingle()
  if (!deal || (deal.club_id !== org.id && deal.sponsor_id !== org.id)) notFound()

  const isClub = deal.club_id === org.id
  const iProposed = deal.proposed_by_org === org.id
  const clubOrg = deal.club?.organizations
  const sponsorOrg = deal.sponsor?.organizations
  const tz = clubOrg?.timezone ?? "America/New_York"

  const [{ data: deliverables }, { data: events }] = await Promise.all([
    supabase.from("deal_deliverables").select("*, events(title, starts_at)").eq("deal_id", dealId).order("created_at"),
    isClub
      ? supabase
          .from("events")
          .select("id, title, starts_at")
          .eq("organization_id", org.id)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
          .limit(30)
      : Promise.resolve({ data: [] as { id: string; title: string; starts_at: string }[] }),
  ])

  const status = (s: "accepted" | "declined" | "active" | "completed" | "cancelled") => setDealStatus.bind(null, slug, dealId, s)
  const live = ["accepted", "active", "completed"].includes(deal.status)

  return (
    <>
      <PageHeader
        title={deal.title}
        description={`${isClub ? sponsorOrg?.name : clubOrg?.name} · ${formatMoney(deal.amount_cents, deal.currency)}`}
        actions={<Badge variant="outline">{DEAL_STATUS_LABEL[deal.status]}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Panel title="Terms">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium">{formatMoney(deal.amount_cents, deal.currency)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Dates</dt>
                <dd>{deal.starts_on || deal.ends_on ? `${deal.starts_on ?? "?"} → ${deal.ends_on ?? "?"}` : "Not set"}</dd>
              </div>
              {deal.package ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Package</dt>
                  <dd>
                    {deal.package.title}
                    {deal.package.deliverables.length ? (
                      <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                        {deal.package.deliverables.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {deal.terms ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Message</dt>
                  <dd className="whitespace-pre-wrap">{deal.terms}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>

          {live ? (
            <Panel title="Deliverables" description="Track what the club owes the sponsor. Both sides can see and tick these off.">
              {(deliverables ?? []).length ? (
                <ul className="mb-4 divide-y">
                  {deliverables!.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <p className={d.completed_at ? "text-muted-foreground line-through" : "font-medium"}>{d.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.events ? `At ${d.events.title} (${formatEventDate(d.events.starts_at, tz)})` : null}
                          {d.due_at ? ` Due ${new Date(d.due_at).toLocaleDateString()}` : null}
                        </p>
                      </div>
                      <form action={setDeliverableDone.bind(null, slug, d.id, !d.completed_at)}>
                        <Button size="sm" variant={d.completed_at ? "ghost" : "outline"}>
                          {d.completed_at ? "Undo" : "Mark done"}
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : null}
              <ActionForm action={addDeliverable.bind(null, slug, dealId)} resetOnSuccess>
                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <Input name="description" placeholder="e.g. Logo on club site" required />
                  <Input name="due_on" type="date" />
                </div>
                {isClub && (events ?? []).length ? (
                  <select name="event_id" className={selectClass} defaultValue="">
                    <option value="">Not tied to an event</option>
                    {events!.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title} · {formatEventDate(e.starts_at, tz)}
                      </option>
                    ))}
                  </select>
                ) : null}
                <SubmitButton size="sm">Add deliverable</SubmitButton>
              </ActionForm>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6">
          <Panel title="Next step">
            <div className="flex flex-col gap-2 text-sm">
              {deal.status === "proposed" && !iProposed ? (
                <>
                  <p className="text-muted-foreground">{isClub ? `${sponsorOrg?.name} wants to sponsor you.` : `${clubOrg?.name} sent you this proposal.`}</p>
                  <form action={status("accepted")}>
                    <Button className="w-full">Accept</Button>
                  </form>
                  <form action={status("declined")}>
                    <Button variant="outline" className="w-full">
                      Decline
                    </Button>
                  </form>
                </>
              ) : null}
              {deal.status === "proposed" && iProposed ? (
                <>
                  <p className="text-muted-foreground">Waiting for {isClub ? sponsorOrg?.name : clubOrg?.name} to answer.</p>
                  <form action={status("cancelled")}>
                    <Button variant="outline" className="w-full">
                      Withdraw proposal
                    </Button>
                  </form>
                </>
              ) : null}
              {deal.status === "accepted" ? (
                <>
                  <p className="text-muted-foreground">
                    {isClub
                      ? "Agreed. Send the sponsor an invoice, then mark it paid here."
                      : "Agreed. The club will send you an invoice."}
                  </p>
                  {isClub ? (
                    <form action={status("active")}>
                      <Button className="w-full">Mark payment received</Button>
                    </form>
                  ) : null}
                  <form action={status("cancelled")}>
                    <Button variant="ghost" className="w-full text-destructive">
                      Cancel deal
                    </Button>
                  </form>
                </>
              ) : null}
              {deal.status === "active" ? (
                <>
                  <p className="text-muted-foreground">Paid. Deliver what was agreed and tick it off.</p>
                  {isClub ? (
                    <form action={status("completed")}>
                      <Button className="w-full">Mark completed</Button>
                    </form>
                  ) : null}
                </>
              ) : null}
              {["completed", "declined", "cancelled"].includes(deal.status) ? (
                <p className="text-muted-foreground">This deal is {DEAL_STATUS_LABEL[deal.status].toLowerCase()}.</p>
              ) : null}
            </div>
          </Panel>

          {isClub && sponsorOrg ? (
            <Panel title="About the sponsor">
              <p className="font-medium">{sponsorOrg.name}</p>
              {deal.sponsor?.industry ? <p className="text-sm text-muted-foreground">{deal.sponsor.industry}</p> : null}
              {sponsorOrg.description ? <p className="mt-2 text-sm">{sponsorOrg.description}</p> : null}
              {sponsorOrg.website_url ? (
                <a href={sponsorOrg.website_url} className="mt-2 block text-sm underline" target="_blank" rel="noreferrer">
                  Website ↗
                </a>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  )
}

