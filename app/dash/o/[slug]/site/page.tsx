import { ActionForm, Field, SubmitButton } from "@/components/form"
import { PageHeader, Panel } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { clubUrl } from "@/lib/env"
import { requireOrgAccess } from "@/lib/orgs"
import { publicMediaUrl } from "@/lib/storage"
import { createClient } from "@/lib/supabase/server"

import { addFaq, deleteFaq, updateSite } from "./actions"

export const metadata = { title: "Club site" }

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  const { data: faqs } = await supabase.from("club_faqs").select("id, question, answer").eq("organization_id", org.id).order("position")
  const logo = publicMediaUrl(org.logo_path)
  const cover = publicMediaUrl(org.cover_path)

  return (
    <>
      <PageHeader
        title="Club site"
        description={
          <>
            Live at{" "}
            <a className="underline" href={clubUrl(slug)} target="_blank" rel="noreferrer">
              {clubUrl(slug).replace(/^https?:\/\//, "")}
            </a>
            . Its job is to get people to join and show up.
          </>
        }
      />
      <div className="space-y-6">
        <Panel title="Profile & branding">
          <ActionForm action={updateSite.bind(null, slug)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="name">
                <Input id="name" name="name" required defaultValue={org.name} />
              </Field>
              <Field label="Tagline" htmlFor="tagline" hint="One line under your name.">
                <Input id="tagline" name="tagline" maxLength={160} defaultValue={org.tagline ?? ""} />
              </Field>
            </div>
            <Field label="About" htmlFor="description">
              <Textarea id="description" name="description" rows={5} defaultValue={org.description ?? ""} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="School" htmlFor="school">
                <Input id="school" name="school" defaultValue={org.school ?? ""} />
              </Field>
              <Field label="City" htmlFor="city">
                <Input id="city" name="city" defaultValue={org.city ?? ""} />
              </Field>
              <Field label="Brand colour" htmlFor="brand_color">
                <Input id="brand_color" name="brand_color" type="color" defaultValue={org.brand_color ?? "#2563eb"} className="h-9 p-1" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Contact email" htmlFor="contact_email">
                <Input id="contact_email" name="contact_email" type="email" defaultValue={org.contact_email ?? ""} />
              </Field>
              <Field label="Instagram" htmlFor="instagram_handle">
                <Input id="instagram_handle" name="instagram_handle" placeholder="@yourclub" defaultValue={org.instagram_handle ?? ""} />
              </Field>
              <Field label="Website" htmlFor="website_url">
                <Input id="website_url" name="website_url" type="url" defaultValue={org.website_url ?? ""} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo" htmlFor="logo" hint="Square works best.">
                {logo ? <img src={logo} alt="" className="mb-2 size-16 rounded-lg border object-cover" /> : null}
                <Input id="logo" name="logo" type="file" accept="image/*" />
              </Field>
              <Field label="Cover photo" htmlFor="cover" hint="Wide photo of your club in action.">
                {cover ? <img src={cover} alt="" className="mb-2 h-16 w-32 rounded-lg border object-cover" /> : null}
                <Input id="cover" name="cover" type="file" accept="image/*" />
              </Field>
            </div>
            <SubmitButton>Save</SubmitButton>
          </ActionForm>
        </Panel>

        <Panel title="FAQs" description="Answer what new people always ask: when, where, cost, experience needed.">
          {(faqs ?? []).length > 0 ? (
            <ul className="mb-4 divide-y">
              {faqs!.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{f.question}</p>
                    <p className="text-sm text-muted-foreground">{f.answer}</p>
                  </div>
                  <form action={deleteFaq.bind(null, slug, f.id)}>
                    <Button variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
          <ActionForm action={addFaq.bind(null, slug)} resetOnSuccess>
            <Field label="Question" htmlFor="question">
              <Input id="question" name="question" required />
            </Field>
            <Field label="Answer" htmlFor="answer">
              <Textarea id="answer" name="answer" rows={3} required />
            </Field>
            <SubmitButton size="sm">Add FAQ</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  )
}
