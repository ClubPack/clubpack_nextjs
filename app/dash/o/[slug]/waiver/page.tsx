import { revalidatePath } from "next/cache"

import { ActionForm, Field, SubmitButton } from "@/components/form"
import { PageHeader, Panel } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fail, friendlyError, str, type ActionState } from "@/lib/actions"
import { getClub, requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Waiver" }

async function publishWaiver(slug: string, _: ActionState, form: FormData): Promise<ActionState> {
  "use server"
  const { org, user } = await requireOrgAccess(slug, "admin")
  const title = str(form, "title")
  const body = str(form, "body")
  if (!title || body.length < 20) return fail("Add a title and the full waiver text.")

  const supabase = await createClient()
  const { data: latest } = await supabase
    .from("waivers")
    .select("version")
    .eq("organization_id", org.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  await supabase.from("waivers").update({ is_active: false }).eq("organization_id", org.id).eq("is_active", true)
  const { error } = await supabase.from("waivers").insert({
    organization_id: org.id,
    version: (latest?.version ?? 0) + 1,
    title,
    body,
    created_by: user.id,
  })
  if (error) return fail(friendlyError(error))

  revalidatePath(`/dash/o/${slug}`, "layout")
  return { ok: true, message: "Published. Members will be asked to sign this version before their next RSVP." }
}

async function setRequireWaiver(slug: string, value: boolean) {
  "use server"
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  await supabase.from("clubs").update({ require_waiver: value }).eq("organization_id", org.id)
  revalidatePath(`/dash/o/${slug}`, "layout")
}

export default async function WaiverPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  const club = await getClub(org.id)

  const { data: versions } = await supabase
    .from("waivers")
    .select("id, version, title, body, is_active, created_at")
    .eq("organization_id", org.id)
    .order("version", { ascending: false })
  const active = (versions ?? []).find((v) => v.is_active)

  const { count: signedCount } = active
    ? await supabase.from("waiver_signatures").select("id", { count: "exact", head: true }).eq("waiver_id", active.id)
    : { count: 0 }
  const { count: memberCount } = await supabase
    .from("organization_members")
    .select("user_id", { count: "exact", head: true })
    .eq("organization_id", org.id)
    .eq("status", "active")

  return (
    <>
      <PageHeader
        title="Waiver"
        description="Members read and sign this in the app when they join or RSVP. No PDFs to chase."
      />
      <div className="space-y-6">
        <Panel
          title={club?.require_waiver ? "Waiver required" : "Waiver not required"}
          description={
            club?.require_waiver
              ? "People must sign the current version before they can RSVP. Guest RSVPs are turned off while this is on."
              : "Turn this on if your activity needs a liability waiver."
          }
          actions={
            <form action={setRequireWaiver.bind(null, slug, !club?.require_waiver)}>
              <Button variant={club?.require_waiver ? "outline" : "default"} size="sm" disabled={!club?.require_waiver && !active}>
                {club?.require_waiver ? "Stop requiring" : "Require waiver"}
              </Button>
            </form>
          }
        >
          {active ? (
            <p className="text-sm">
              Version {active.version} · <span className="tabular-nums">{signedCount ?? 0}</span> of {memberCount ?? 0} members have signed it.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Publish a waiver below first.</p>
          )}
        </Panel>

        <Panel title={active ? "Publish a new version" : "Write your waiver"} description={active ? "Editing creates a new version; everyone re-signs it." : undefined}>
          <ActionForm action={publishWaiver.bind(null, slug)}>
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" required defaultValue={active?.title ?? `${org.name} participation waiver`} />
            </Field>
            <Field label="Waiver text" htmlFor="body" hint="Paste the full text your school or insurer requires.">
              <Textarea id="body" name="body" rows={14} required defaultValue={active?.body ?? ""} />
            </Field>
            <SubmitButton>{active ? "Publish new version" : "Publish waiver"}</SubmitButton>
          </ActionForm>
        </Panel>

        {(versions ?? []).length > 1 ? (
          <Panel title="History">
            <ul className="divide-y text-sm">
              {versions!.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2">
                  <span>
                    v{v.version} · {v.title}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString()}
                    {v.is_active ? <Badge>Current</Badge> : null}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </>
  )
}
