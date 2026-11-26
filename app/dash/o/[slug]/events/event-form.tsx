"use client"

import { ActionForm, Field, SubmitButton, selectClass } from "@/components/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ActionState } from "@/lib/actions"

export type EventDefaults = {
  title?: string
  description?: string | null
  date?: string
  start_time?: string
  end_time?: string
  location_name?: string | null
  location_address?: string | null
  capacity?: number | null
  visibility?: "public" | "members"
  rsvp_opens_date?: string
  rsvp_opens_time?: string
}

export function EventForm({
  action,
  defaults = {},
  timeZone,
  allowRepeat,
  submitLabel,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>
  defaults?: EventDefaults
  timeZone: string
  allowRepeat: boolean
  submitLabel: string
}) {
  return (
    <ActionForm action={action}>
      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" required defaultValue={defaults.title} placeholder="e.g. Wednesday open play" />
      </Field>
      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={4} defaultValue={defaults.description ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date" htmlFor="date">
          <Input id="date" name="date" type="date" required defaultValue={defaults.date} />
        </Field>
        <Field label="Starts" htmlFor="start_time">
          <Input id="start_time" name="start_time" type="time" required defaultValue={defaults.start_time} />
        </Field>
        <Field label="Ends" htmlFor="end_time">
          <Input id="end_time" name="end_time" type="time" defaultValue={defaults.end_time} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Times are in {timeZone.replace(/_/g, " ")} (change it in Settings).</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location name" htmlFor="location_name">
          <Input id="location_name" name="location_name" defaultValue={defaults.location_name ?? ""} placeholder="e.g. Rec center, court 3" />
        </Field>
        <Field label="Address" htmlFor="location_address">
          <Input id="location_address" name="location_address" defaultValue={defaults.location_address ?? ""} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Capacity" htmlFor="capacity" hint="Leave blank for no limit. Extra RSVPs join a waitlist.">
          <Input id="capacity" name="capacity" type="number" min={1} defaultValue={defaults.capacity ?? ""} />
        </Field>
        <Field label="Who can see it" htmlFor="visibility">
          <select id="visibility" name="visibility" defaultValue={defaults.visibility ?? "public"} className={selectClass}>
            <option value="public">Everyone (shown on your club site)</option>
            <option value="members">Members only</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="RSVPs open on (optional)" htmlFor="rsvp_opens_date" hint="Before this, people can see the event but not RSVP.">
          <Input id="rsvp_opens_date" name="rsvp_opens_date" type="date" defaultValue={defaults.rsvp_opens_date} />
        </Field>
        <Field label="RSVPs open at" htmlFor="rsvp_opens_time">
          <Input id="rsvp_opens_time" name="rsvp_opens_time" type="time" defaultValue={defaults.rsvp_opens_time ?? "09:00"} />
        </Field>
      </div>

      {allowRepeat ? (
        <Field label="Repeat weekly" htmlFor="repeat_weeks" hint="Creates this many weekly events at the same time (up to 26).">
          <Input id="repeat_weeks" name="repeat_weeks" type="number" min={1} max={26} defaultValue={1} />
        </Field>
      ) : null}

      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  )
}
