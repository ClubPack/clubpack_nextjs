import { notFound } from "next/navigation"

import { ActionForm, Field, SubmitButton, selectClass } from "@/components/form"
import { PageHeader, Panel, Stat } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { clubUrl } from "@/lib/env"
import { BILLING_LABEL, formatMoney } from "@/lib/money"
import { hasRole, requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"

import { proposeDeal } from "../../sponsorship/actions"

export const metadata = { title: "Club" }

export default async function ClubKitPage({ params }: { params: Promise<{ slug: string; club: string }> }) {
  const { slug, club: clubSlug } = await params
  const { org, role } = await requireOrgAccess(slug, "staff")
  if (org.kind !== "sponsor") notFound()

  const supabase = await createClient()
  const { data: clubOrg } = await supabase.from("organizations").select("*").eq("slug", clubSlug).eq("kind", "club").maybeSingle()
  if (!clubOrg) notFound()

  const [{ data: stats, error: statsError }, { data: packages }] = await Promise.all([
    supabase.rpc("get_club_stats", { p_club: clubOrg.id, p_days: 90 }),
    supabase.from("sponsorship_packages").select("*").eq("organization_id", clubOrg.id).eq("is_active", true).order("position"),
  ])
  if (statsError) notFound() // club is not open to sponsors
  const s = stats?.[0]

  return (
    <>
      <PageHeader
        title={clubOrg.name}
        description={
          <>
            {[clubOrg.school, clubOrg.city].filter(Boolean).join(" · ")}{" "}
            <a href={clubUrl(clubOrg.slug)} target="_blank" rel="noreferrer" className="underline">
              Club site ↗
            </a>
          </>
        }
      />
      {clubOrg.description ? <p className="mb-6 max-w-2xl text-sm">{clubOrg.description}</p> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active members" value={s?.active_members ?? 0} />
        <Stat label="Events (90d)" value={s?.events_held ?? 0} />
        <Stat label="Unique attendees" value={s?.unique_attendees ?? 0} />
        <Stat label="Avg. attendance" value={s?.avg_attendance ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Packages">
          {(packages ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages published. You can still propose your own terms.</p>
          ) : (
            <ul className="space-y-4">
              {packages!.map((p) => (
                <li key={p.id} className="rounded-lg border p-4">
                  <p className="font-medium">
                    {p.title} · {formatMoney(p.price_cents, p.currency)} {BILLING_LABEL[p.billing_period]}
                  </p>
                  {p.description ? <p className="text-sm text-muted-foreground">{p.description}</p> : null}
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {p.deliverables.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Propose a sponsorship">
          {hasRole(role, "admin") ? (
            <ActionForm action={proposeDeal.bind(null, slug, clubOrg.id)}>
              <Field label="Package" htmlFor="package_id">
                <select id="package_id" name="package_id" className={selectClass} defaultValue={packages?.[0]?.id ?? ""}>
                  <option value="">Custom proposal</option>
                  {(packages ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({formatMoney(p.price_cents, p.currency)})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title" htmlFor="title">
                <Input id="title" name="title" required defaultValue={`${org.name} × ${clubOrg.name}`} />
              </Field>
              <Field label="Amount ($)" htmlFor="amount">
                <Input
                  id="amount"
                  name="amount"
                  inputMode="decimal"
                  required
                  defaultValue={packages?.[0] ? String(packages[0].price_cents / 100) : ""}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts" htmlFor="starts_on">
                  <Input id="starts_on" name="starts_on" type="date" />
                </Field>
                <Field label="Ends" htmlFor="ends_on">
                  <Input id="ends_on" name="ends_on" type="date" />
                </Field>
              </div>
              <Field label="Message" htmlFor="terms" hint="What you'd like in return, e.g. a perk for members at check-in.">
                <Textarea id="terms" name="terms" rows={4} />
              </Field>
              <SubmitButton>Send proposal</SubmitButton>
            </ActionForm>
          ) : (
            <p className="text-sm text-muted-foreground">Ask an admin on your team to send proposals.</p>
          )}
        </Panel>
      </div>
    </>
  )
}
