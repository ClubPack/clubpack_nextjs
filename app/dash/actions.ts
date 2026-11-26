"use server"

import { revalidatePath } from "next/cache"

import { fail, friendlyError, goTo, optStr, str, type ActionState } from "@/lib/actions"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function createOrganization(_: ActionState, form: FormData): Promise<ActionState> {
  await requireUser("/new")
  const kind = str(form, "kind") === "sponsor" ? "sponsor" : "club"
  const name = str(form, "name")
  const slug = str(form, "slug").toLowerCase()
  if (name.length < 2) return fail("Give it a name.")
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) {
    return fail("Web address: 3–40 lowercase letters, numbers or dashes, not starting or ending with a dash.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_organization", { p_kind: kind, p_slug: slug, p_name: name })
  if (error || !data) return fail(friendlyError(error))

  const extra = {
    school: optStr(form, "school"),
    city: optStr(form, "city"),
    timezone: optStr(form, "timezone") ?? "America/New_York",
  }
  await supabase.from("organizations").update(extra).eq("id", data.id)

  revalidatePath("/dash", "layout")
  return goTo(`/o/${data.slug}`)
}

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("/profile")
  const supabase = await createClient()
  const year = Number.parseInt(str(form, "graduation_year"), 10)
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: str(form, "full_name"),
      school: optStr(form, "school"),
      phone: optStr(form, "phone"),
      graduation_year: Number.isFinite(year) ? year : null,
    })
    .eq("id", user.id)
  if (error) return fail(friendlyError(error))
  revalidatePath("/dash", "layout")
  return { ok: true, message: "Saved." }
}

export async function acceptInvitation(_: ActionState, form: FormData): Promise<ActionState> {
  await requireUser("/")
  const supabase = await createClient()
  const { data: orgId, error } = await supabase.rpc("accept_invitation", { p_token: str(form, "token") })
  if (error || !orgId) return fail(friendlyError(error, "This invitation is invalid or has expired."))

  const { data: org } = await supabase.from("organizations").select("slug").eq("id", orgId).single()
  revalidatePath("/dash", "layout")
  return goTo(org ? `/o/${org.slug}` : "/")
}
