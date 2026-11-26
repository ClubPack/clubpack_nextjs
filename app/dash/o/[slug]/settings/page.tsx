import { revalidatePath } from "next/cache"

import { ActionForm, Checkbox, Field, SubmitButton, selectClass } from "@/components/form"
import { PageHeader, Panel } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { bool, fail, friendlyError, optStr, str, type ActionState } from "@/lib/actions"
import { ROOT_DOMAIN } from "@/lib/env"
import { getClub, requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { COMMON_TIMEZONES } from "@/lib/time"

export const metadata = { title: "Settings" }

async function saveSettings(slug: string, _: ActionState, form: FormData): Promise<ActionState> {
  "use server"
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()

  const timezone = str(form, "timezone")
  const { error: orgError } = await supabase
    .from("organizations")
    .update({ timezone: timezone || org.timezone, is_public: bool(form, "is_public") })
    .eq("id", org.id)
  if (orgError) return fail(friendlyError(orgError))

  if (org.kind === "club") {
    const joinPolicy = str(form, "join_policy")
    const { error } = await supabase
      .from("clubs")
      .update({
        category: optStr(form, "category"),
        join_policy: joinPolicy === "approval" || joinPolicy === "invite_only" ? joinPolicy : "open",
        allow_guest_rsvp: bool(form, "allow_guest_rsvp"),
        show_member_count: bool(form, "show_member_count"),
      })
      .eq("organization_id", org.id)
    if (error) return fail(friendlyError(error))
  } else {
    const { error } = await supabase
      .from("sponsors")
      .update({ industry: optStr(form, "industry"), service_area: optStr(form, "service_area") })
      .eq("organization_id", org.id)
    if (error) return fail(friendlyError(error))
    const { error: e2 } = await supabase
      .from("organizations")
      .update({
        name: str(form, "name") || org.name,
        description: optStr(form, "description"),
        website_url: optStr(form, "website_url"),
        city: optStr(form, "city"),
      })
      .eq("id", org.id)
    if (e2) return fail(friendlyError(e2))
  }

  revalidatePath(`/dash/o/${slug}`, "layout")
  return { ok: true, message: "Saved." }
}

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  const club = org.kind === "club" ? await getClub(org.id) : null
  const { data: sponsor } =
    org.kind === "sponsor" ? await supabase.from("sponsors").select("*").eq("organization_id", org.id).maybeSingle() : { data: null }
  const zones = COMMON_TIMEZONES.includes(org.timezone) ? COMMON_TIMEZONES : [org.timezone, ...COMMON_TIMEZONES]

  return (
    <>
      <PageHeader title={org.kind === "club" ? "Settings" : "Sponsor profile"} description={`Web address: ${slug}${org.kind === "club" ? `.${ROOT_DOMAIN}` : ""}`} />
      <Panel>
        <ActionForm action={saveSettings.bind(null, slug)}>
          {org.kind === "sponsor" ? (
            <>
              <Field label="Business name" htmlFor="name">
                <Input id="name" name="name" defaultValue={org.name} required />
              </Field>
              <Field label="About your business" htmlFor="description" hint="Clubs see this when you propose a sponsorship.">
                <Input id="description" name="description" defaultValue={org.description ?? ""} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Industry" htmlFor="industry">
                  <Input id="industry" name="industry" defaultValue={sponsor?.industry ?? ""} placeholder="e.g. Café, Gym, Outdoor gear" />
                </Field>
                <Field label="Where you operate" htmlFor="service_area">
                  <Input id="service_area" name="service_area" defaultValue={sponsor?.service_area ?? ""} placeholder="e.g. Greater Boston" />
                </Field>
                <Field label="Website" htmlFor="website_url">
                  <Input id="website_url" name="website_url" type="url" defaultValue={org.website_url ?? ""} />
                </Field>
                <Field label="City" htmlFor="city">
                  <Input id="city" name="city" defaultValue={org.city ?? ""} />
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field label="Joining" htmlFor="join_policy">
                <select id="join_policy" name="join_policy" defaultValue={club?.join_policy} className={selectClass}>
                  <option value="open">Anyone can join</option>
                  <option value="approval">Admins approve each request</option>
                  <option value="invite_only">Invite only</option>
                </select>
              </Field>
              <Field label="Category" htmlFor="category">
                <Input id="category" name="category" defaultValue={club?.category ?? ""} placeholder="e.g. Sports, Outdoors, Service, Culture" />
              </Field>
              <Checkbox
                name="allow_guest_rsvp"
                defaultChecked={club?.allow_guest_rsvp}
                label="Allow guest RSVPs"
                hint="People can RSVP with just a name and email, without an account. Ignored while a waiver is required."
              />
              <Checkbox name="show_member_count" defaultChecked={club?.show_member_count} label="Show member count on the club site" />
            </>
          )}
          <Checkbox
            name="is_public"
            defaultChecked={org.is_public}
            label={org.kind === "club" ? "Club site is public" : "Profile is public"}
            hint={org.kind === "club" ? "When off, only members can see the site and events." : undefined}
          />
          <Field label="Timezone" htmlFor="timezone">
            <select id="timezone" name="timezone" defaultValue={org.timezone} className={selectClass}>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <SubmitButton>Save settings</SubmitButton>
        </ActionForm>
      </Panel>
    </>
  )
}
