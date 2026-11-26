"use server"

import { revalidatePath } from "next/cache"

import { fail, friendlyError, goTo, int, optStr, str, type ActionState } from "@/lib/actions"
import { requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { zonedToUtc } from "@/lib/time"

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function readEventForm(form: FormData, timeZone: string) {
  const date = str(form, "date")
  const start = str(form, "start_time")
  const end = str(form, "end_time")
  if (!str(form, "title")) return { error: "Give the event a title." } as const
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) return { error: "Pick a date and start time." } as const

  const startsAt = zonedToUtc(date, start, timeZone)
  let endsAt: Date | null = end ? zonedToUtc(date, end, timeZone) : null
  if (endsAt && endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 3600 * 1000) // ends after midnight

  const opensDate = str(form, "rsvp_opens_date")
  const opensTime = str(form, "rsvp_opens_time") || "09:00"
  const rsvpOpensAt = opensDate ? zonedToUtc(opensDate, opensTime, timeZone) : null

  const capacity = int(form, "capacity")
  if (capacity !== null && capacity < 1) return { error: "Capacity must be at least 1, or leave it blank for no limit." } as const

  return {
    date,
    start,
    end,
    startsAt,
    endsAt,
    values: {
      title: str(form, "title"),
      description: optStr(form, "description"),
      location_name: optStr(form, "location_name"),
      location_address: optStr(form, "location_address"),
      capacity,
      visibility: str(form, "visibility") === "members" ? ("members" as const) : ("public" as const),
      rsvp_opens_at: rsvpOpensAt?.toISOString() ?? null,
    },
  } as const
}

export async function createEvent(slug: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org, user } = await requireOrgAccess(slug, "staff")
  const parsed = readEventForm(form, org.timezone)
  if ("error" in parsed) return fail(parsed.error!)

  const repeat = Math.min(Math.max(int(form, "repeat_weeks") ?? 1, 1), 26)
  const supabase = await createClient()

  let seriesId: string | null = null
  if (repeat > 1) {
    const { data: series, error } = await supabase
      .from("event_series")
      .insert({
        organization_id: org.id,
        title: parsed.values.title,
        recurrence_rule: `FREQ=WEEKLY;COUNT=${repeat}`,
        starts_on: parsed.date,
        ends_on: addDays(parsed.date, 7 * (repeat - 1)),
        created_by: user.id,
      })
      .select("id")
      .single()
    if (error) return fail(friendlyError(error))
    seriesId = series.id
  }

  const durationMs = parsed.endsAt ? parsed.endsAt.getTime() - parsed.startsAt.getTime() : null
  const opensLeadMs = parsed.values.rsvp_opens_at ? parsed.startsAt.getTime() - new Date(parsed.values.rsvp_opens_at).getTime() : null

  const rows = Array.from({ length: repeat }, (_, i) => {
    const startsAt = zonedToUtc(addDays(parsed.date, 7 * i), parsed.start, org.timezone)
    return {
      ...parsed.values,
      organization_id: org.id,
      series_id: seriesId,
      created_by: user.id,
      starts_at: startsAt.toISOString(),
      ends_at: durationMs ? new Date(startsAt.getTime() + durationMs).toISOString() : null,
      rsvp_opens_at: opensLeadMs !== null ? new Date(startsAt.getTime() - opensLeadMs).toISOString() : null,
    }
  })

  const { data, error } = await supabase.from("events").insert(rows).select("id, starts_at")
  if (error || !data?.length) {
    if (seriesId) await supabase.from("event_series").delete().eq("id", seriesId)
    return fail(friendlyError(error))
  }

  const first = [...data].sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]!
  revalidatePath(`/dash/o/${slug}`, "layout")
  return goTo(`/o/${slug}/events/${first.id}`)
}

export async function updateEvent(slug: string, eventId: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org } = await requireOrgAccess(slug, "staff")
  const parsed = readEventForm(form, org.timezone)
  if ("error" in parsed) return fail(parsed.error!)

  const supabase = await createClient()
  const { error } = await supabase
    .from("events")
    .update({ ...parsed.values, starts_at: parsed.startsAt.toISOString(), ends_at: parsed.endsAt?.toISOString() ?? null })
    .eq("id", eventId)
    .eq("organization_id", org.id)
  if (error) return fail(friendlyError(error))

  revalidatePath(`/dash/o/${slug}`, "layout")
  return goTo(`/o/${slug}/events/${eventId}`)
}

export async function setEventStatus(slug: string, eventId: string, status: "scheduled" | "cancelled") {
  const { org } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  await supabase.from("events").update({ status }).eq("id", eventId).eq("organization_id", org.id)
  revalidatePath(`/dash/o/${slug}`, "layout")
}

export async function deleteEvent(slug: string, eventId: string): Promise<ActionState> {
  const { org } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  const { error } = await supabase.from("events").delete().eq("id", eventId).eq("organization_id", org.id)
  if (error) return fail(friendlyError(error))
  revalidatePath(`/dash/o/${slug}`, "layout")
  return goTo(`/o/${slug}/events`)
}

// --- Check-in at the door -----------------------------------------------------

export async function checkInPerson(slug: string, eventId: string, form: FormData) {
  const { org, user } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  const userId = optStr(form, "user_id")
  const rsvpId = optStr(form, "rsvp_id")
  const guestName = optStr(form, "guest_name")
  await supabase.from("check_ins").insert({
    event_id: eventId,
    organization_id: org.id,
    user_id: userId,
    rsvp_id: rsvpId,
    guest_name: guestName,
    method: rsvpId ? "manual" : "walk_in",
    checked_in_by: user.id,
  })
  revalidatePath(`/dash/o/${slug}/events/${eventId}`)
}

export async function undoCheckIn(slug: string, eventId: string, checkInId: string) {
  const { org } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  await supabase.from("check_ins").delete().eq("id", checkInId).eq("organization_id", org.id)
  revalidatePath(`/dash/o/${slug}/events/${eventId}`)
}

export async function walkIn(slug: string, eventId: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org, user } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  const memberId = optStr(form, "member_id")
  const guestName = optStr(form, "guest_name")
  if (!memberId && !guestName) return fail("Pick a member or type a name.")
  const { error } = await supabase.from("check_ins").insert({
    event_id: eventId,
    organization_id: org.id,
    user_id: memberId,
    guest_name: memberId ? null : guestName,
    method: "walk_in",
    checked_in_by: user.id,
  })
  if (error) return fail(error.code === "23505" ? "Already checked in." : friendlyError(error))
  revalidatePath(`/dash/o/${slug}/events/${eventId}`)
  return { ok: true, message: "Checked in." }
}

export async function setRsvpStatus(slug: string, eventId: string, rsvpId: string, status: "going" | "waitlisted" | "cancelled") {
  const { org } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  await supabase.from("event_rsvps").update({ status }).eq("id", rsvpId).eq("organization_id", org.id)
  revalidatePath(`/dash/o/${slug}/events/${eventId}`)
}

export async function rotateCheckinCode(slug: string, eventId: string) {
  const { org } = await requireOrgAccess(slug, "staff")
  const supabase = await createClient()
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12)
  await supabase
    .from("event_checkin_codes")
    .update({ code, rotated_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("organization_id", org.id)
  revalidatePath(`/dash/o/${slug}/events/${eventId}`)
}
