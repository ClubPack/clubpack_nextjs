"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { bool, fail, friendlyError, goTo, safeNextLocal, str, type ActionState } from "@/lib/actions"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

import { getSiteClub } from "./data"

function refresh(slug: string) {
  revalidatePath(`/site/${slug}`, "layout")
  revalidatePath("/dash", "layout")
}

/** Sign the current waiver (if any) and join. Used by the /join page. */
export async function joinClub(slug: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org } = await getSiteClub(slug)
  const user = await getUser()
  const next = safeNextLocal(str(form, "next"), "/")
  if (!user) return goTo(`/login?next=${encodeURIComponent(`/join?next=${encodeURIComponent(next)}`)}`)

  const supabase = await createClient()
  const waiverId = str(form, "waiver_id")
  if (waiverId) {
    const signedName = str(form, "signed_name")
    if (!bool(form, "agree")) return fail("Tick the box to agree to the waiver.")
    if (signedName.length < 2) return fail("Type your full name to sign.")
    const h = await headers()
    const { error } = await supabase.from("waiver_signatures").insert({
      waiver_id: waiverId,
      organization_id: org.id,
      user_id: user.id,
      signed_name: signedName,
      user_agent: (h.get("user-agent") ?? "").slice(0, 500) || null,
    })
    if (error && error.code !== "23505") return fail(friendlyError(error))
  }

  const { error } = await supabase.rpc("join_club", { p_club: org.id })
  if (error) return fail(friendlyError(error))

  refresh(slug)
  return goTo(next)
}

export async function rsvp(slug: string, eventId: string, _: ActionState): Promise<ActionState> {
  await getSiteClub(slug)
  const user = await getUser()
  if (!user) return goTo(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`)

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("rsvp_to_event", { p_event: eventId })
  if (error) {
    if (error.hint === "waiver_required" || error.message.includes("waiver")) {
      return goTo(`/join?next=${encodeURIComponent(`/events/${eventId}`)}`)
    }
    if (error.message.includes("join the club")) return goTo(`/join?next=${encodeURIComponent(`/events/${eventId}`)}`)
    return fail(friendlyError(error))
  }
  refresh(slug)
  return { ok: true, message: data === "waitlisted" ? "The event is full, so you're on the waitlist. We'll move you up if a spot opens." : "You're going!" }
}

export async function cancelRsvp(slug: string, eventId: string, _: ActionState): Promise<ActionState> {
  await getSiteClub(slug)
  const supabase = await createClient()
  const { error } = await supabase.rpc("cancel_rsvp", { p_event: eventId })
  if (error) return fail(friendlyError(error))
  refresh(slug)
  return { ok: true, message: "RSVP cancelled." }
}

export async function guestRsvp(slug: string, eventId: string, _: ActionState, form: FormData): Promise<ActionState> {
  await getSiteClub(slug)
  const name = str(form, "name")
  const email = str(form, "email").toLowerCase()
  if (name.length < 2 || !email.includes("@")) return fail("Enter your name and email.")
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("guest_rsvp", { p_event: eventId, p_name: name, p_email: email })
  if (error) return fail(friendlyError(error))
  refresh(slug)
  return {
    ok: true,
    message: data === "waitlisted" ? `You're on the waitlist as ${email}.` : `You're going! Saved under ${email}.`,
  }
}

export async function selfCheckIn(slug: string, eventId: string, code: string, _: ActionState): Promise<ActionState> {
  await getSiteClub(slug)
  const supabase = await createClient()
  const { error } = await supabase.rpc("self_check_in", { p_event: eventId, p_code: code })
  if (error) {
    if (error.message.includes("join the club")) return goTo(`/join?next=${encodeURIComponent(`/checkin/${eventId}?code=${code}`)}`)
    return fail(friendlyError(error))
  }
  refresh(slug)
  return { ok: true, message: "You're checked in. Have fun!" }
}
