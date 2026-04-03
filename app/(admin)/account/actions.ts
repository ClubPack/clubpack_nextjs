"use server"

import { revalidatePath } from "next/cache"

import { getAdminContext } from "@/lib/admin/get-admin-context"
import { createClient } from "@/lib/supabase/server"
import type { SimpleActionResult } from "@/lib/types/action-result"

export async function updateAdminProfile(input: {
  first_name: string
  last_name: string
}): Promise<SimpleActionResult> {
  try {
    const { userId } = await getAdminContext()
    const supabase = await createClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
      })
      .eq("id", userId)

    if (error) return { ok: false, error: error.message }
    revalidatePath("/account")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update profile." }
  }
}
