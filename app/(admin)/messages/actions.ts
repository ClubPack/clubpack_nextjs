"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getAdminContext } from "@/lib/admin/get-admin-context"
import type { SimpleActionResult } from "@/lib/types/action-result"

export async function deleteContactSubmission(id: string): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { error } = await supabase
      .from("club_contact_submissions")
      .delete()
      .eq("id", id)
      .eq("club_id", profile.club_id)

    if (error) return { ok: false, error: error.message }
    revalidatePath("/messages")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete message." }
  }
}
