import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { utcToZonedParts } from "@/lib/time"

import { updateEvent } from "../../actions"
import { EventForm } from "../../event-form"

export const metadata = { title: "Edit event" }

export default async function EditEventPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const { org } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  const { data: e } = await supabase.from("events").select("*").eq("id", id).eq("organization_id", org.id).maybeSingle()
  if (!e) notFound()

  const start = utcToZonedParts(e.starts_at, org.timezone)
  const end = e.ends_at ? utcToZonedParts(e.ends_at, org.timezone) : null
  const opens = e.rsvp_opens_at ? utcToZonedParts(e.rsvp_opens_at, org.timezone) : null

  return (
    <>
      <PageHeader title="Edit event" description={e.series_id ? "This changes only this date, not the rest of the weekly series." : undefined} />
      <div className="rounded-xl border bg-background p-6">
        <EventForm
          action={updateEvent.bind(null, slug, id)}
          timeZone={org.timezone}
          allowRepeat={false}
          submitLabel="Save changes"
          defaults={{
            title: e.title,
            description: e.description,
            date: start.date,
            start_time: start.time,
            end_time: end?.time,
            location_name: e.location_name,
            location_address: e.location_address,
            capacity: e.capacity,
            visibility: e.visibility,
            rsvp_opens_date: opens?.date,
            rsvp_opens_time: opens?.time,
          }}
        />
      </div>
    </>
  )
}
