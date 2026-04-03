"use server"

import { revalidatePath } from "next/cache"

import { getAdminContext } from "@/lib/admin/get-admin-context"
import { createClient } from "@/lib/supabase/server"
import type { SimpleActionResult } from "@/lib/types/action-result"

export async function updateClubProfile(input: {
  name: string
  email: string
  phone_number: string
  meeting_location: string
  meeting_time: string
  description: string
}): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { error } = await supabase
      .from("clubs")
      .update({
        name: input.name,
        email: input.email,
        phone_number: input.phone_number,
        meeting_location: input.meeting_location,
        meeting_time: input.meeting_time,
        description: input.description,
      })
      .eq("id", profile.club_id)

    if (error) return { ok: false, error: error.message }
    revalidatePath("/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update club profile." }
  }
}

export async function upsertClubPolicy(content: string): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { data: existing } = await supabase
      .from("club_policy")
      .select("id")
      .eq("club_id", profile.club_id)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase
        .from("club_policy")
        .update({ content: content.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await supabase.from("club_policy").insert({
        club_id: profile.club_id,
        content: content.trim() || null,
      })
      if (error) return { ok: false, error: error.message }
    }
    revalidatePath("/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update policy." }
  }
}

export async function updateSettingsPreferences(input: {
  show_event_calendar: boolean
  show_contact_page: boolean
  show_explore_page: boolean
  require_login_to_rsvp: boolean
}): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { error } = await supabase
      .from("club_settings")
      .upsert(
        {
          club_id: profile.club_id,
          show_event_calendar: input.show_event_calendar,
          show_contact_page: input.show_contact_page,
          show_explore_page: input.show_explore_page,
          require_login_to_rsvp: input.require_login_to_rsvp,
        },
        { onConflict: "club_id" },
      )

    if (error) return { ok: false, error: error.message }
    revalidatePath("/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update preferences." }
  }
}
