"use server"

import { revalidatePath } from "next/cache"

import { fail, friendlyError, optStr, str, type ActionState } from "@/lib/actions"
import { requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import type { TablesUpdate } from "@/lib/supabase/database.types"

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
}

async function uploadImage(orgId: string, file: File, kind: "logo" | "cover") {
  const ext = IMAGE_TYPES[file.type]
  if (!ext) return { error: "Use a JPG, PNG, WebP, AVIF or SVG image." }
  if (file.size > 10 * 1024 * 1024) return { error: "Images must be under 10 MB." }
  const supabase = await createClient()
  const path = `${orgId}/${kind}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from("org-media").upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { error: error.message }
  return { path }
}

export async function updateSite(slug: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org } = await requireOrgAccess(slug, "admin")
  const name = str(form, "name")
  if (name.length < 2) return fail("Add a name.")

  const color = str(form, "brand_color")
  const instagram = str(form, "instagram_handle").replace(/^@/, "")
  const updates: TablesUpdate<"organizations"> = {
    name,
    tagline: optStr(form, "tagline"),
    description: optStr(form, "description"),
    brand_color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : null,
    school: optStr(form, "school"),
    city: optStr(form, "city"),
    contact_email: optStr(form, "contact_email"),
    website_url: optStr(form, "website_url"),
    instagram_handle: instagram || null,
  }

  for (const kind of ["logo", "cover"] as const) {
    const file = form.get(kind)
    if (file instanceof File && file.size > 0) {
      const res = await uploadImage(org.id, file, kind)
      if ("error" in res) return fail(res.error!)
      if (kind === "logo") updates.logo_path = res.path!
      else updates.cover_path = res.path!
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("organizations").update(updates).eq("id", org.id)
  if (error) return fail(friendlyError(error))

  revalidatePath(`/dash/o/${slug}`, "layout")
  revalidatePath(`/site/${slug}`, "layout")
  return { ok: true, message: "Saved." }
}

export async function addFaq(slug: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org } = await requireOrgAccess(slug, "admin")
  const question = str(form, "question")
  const answer = str(form, "answer")
  if (!question || !answer) return fail("Add a question and an answer.")
  const supabase = await createClient()
  const { count } = await supabase.from("club_faqs").select("id", { count: "exact", head: true }).eq("organization_id", org.id)
  const { error } = await supabase.from("club_faqs").insert({ organization_id: org.id, question, answer, position: count ?? 0 })
  if (error) return fail(friendlyError(error))
  revalidatePath(`/dash/o/${slug}/site`)
  revalidatePath(`/site/${slug}`, "layout")
  return { ok: true, message: "Added." }
}

export async function deleteFaq(slug: string, faqId: string) {
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  await supabase.from("club_faqs").delete().eq("id", faqId).eq("organization_id", org.id)
  revalidatePath(`/dash/o/${slug}/site`)
  revalidatePath(`/site/${slug}`, "layout")
}
