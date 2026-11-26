import { PageHeader } from "@/components/page-header"
import { requireOrgAccess } from "@/lib/orgs"

import { createEvent } from "../actions"
import { EventForm } from "../event-form"

export const metadata = { title: "New event" }

export default async function NewEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org } = await requireOrgAccess(slug, "staff")
  return (
    <>
      <PageHeader title="New event" description="Practices, meetings, socials: anything people RSVP to and show up at." />
      <div className="rounded-xl border bg-background p-6">
        <EventForm action={createEvent.bind(null, slug)} timeZone={org.timezone} allowRepeat submitLabel="Create event" />
      </div>
    </>
  )
}
