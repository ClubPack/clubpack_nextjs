"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getAdminContext } from "@/lib/admin/get-admin-context"
import type { SimpleActionResult } from "@/lib/types/action-result"

export async function updateClubBranding(input: {
  name: string
  primary_color?: string
}): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { error } = await supabase
      .from("clubs")
      .update({
        name: input.name,
        primary_color: input.primary_color,
      })
      .eq("id", profile.club_id)

    if (error) return { ok: false, error: error.message }
    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update branding." }
  }
}

export async function updateClubWebsiteContent(input: {
  hero_headline: string
  hero_subtext: string
  tagline: string
  instagram: string
  about_blurb?: string
}): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { error } = await supabase
      .from("clubs")
      .update({
        hero_headline: input.hero_headline,
        hero_subtext: input.hero_subtext,
        tagline: input.tagline,
        instagram: input.instagram,
        about_blurb: input.about_blurb,
      })
      .eq("id", profile.club_id)

    if (error) return { ok: false, error: error.message }
    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update website content." }
  }
}

function fileExt(name: string) {
  const ext = name.split(".").pop()
  if (!ext) return "png"
  return ext.toLowerCase()
}

async function uploadClubAsset(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  clubId: string
  folder: "logo" | "hero"
  file: File
}): Promise<string> {
  const path = `${params.clubId}/${params.folder}/${params.folder}.${fileExt(params.file.name)}`
  const uploadRes = await params.supabase.storage
    .from("club-assets")
    .upload(path, params.file, { upsert: true, contentType: params.file.type })

  if (uploadRes.error) throw new Error(uploadRes.error.message)

  const signed = await params.supabase.storage
    .from("club-assets")
    .createSignedUrl(path, 60 * 60 * 24 * 365)

  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(signed.error?.message ?? "Failed to create signed URL.")
  }

  return signed.data.signedUrl
}

export async function uploadClubLogo(formData: FormData): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file selected." }

    const supabase = await createClient()
    const logo_url = await uploadClubAsset({
      supabase,
      clubId: profile.club_id,
      folder: "logo",
      file,
    })

    const { error } = await supabase
      .from("clubs")
      .update({ logo_url })
      .eq("id", profile.club_id)

    if (error) return { ok: false, error: error.message }
    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to upload logo." }
  }
}

export async function uploadClubHeroImage(formData: FormData): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file selected." }

    const supabase = await createClient()
    const hero_image_url = await uploadClubAsset({
      supabase,
      clubId: profile.club_id,
      folder: "hero",
      file,
    })

    const { error } = await supabase
      .from("clubs")
      .update({ hero_image_url })
      .eq("id", profile.club_id)

    if (error) return { ok: false, error: error.message }
    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to upload hero image." }
  }
}

export async function updateClubSettings(input: {
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
    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update settings." }
  }
}

export async function createFaq(input: {
  question: string
  answer: string
  order_index: number
}): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { error } = await supabase.from("faqs").insert({
      club_id: profile.club_id,
      question: input.question,
      answer: input.answer,
      order_index: input.order_index,
    })

    if (error) return { ok: false, error: error.message }
    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create FAQ." }
  }
}

export async function updateFaq(input: {
  id: string
  question: string
  answer: string
  order_index: number
}): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { error } = await supabase
      .from("faqs")
      .update({
        question: input.question,
        answer: input.answer,
        order_index: input.order_index,
      })
      .eq("id", input.id)
      .eq("club_id", profile.club_id)

    if (error) return { ok: false, error: error.message }
    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update FAQ." }
  }
}

export async function deleteFaq(id: string): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const { error } = await supabase.from("faqs").delete().eq("id", id).eq("club_id", profile.club_id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete FAQ." }
  }
}

export async function reorderFaqs(orderedIds: string[]): Promise<SimpleActionResult> {
  try {
    const { profile } = await getAdminContext()
    if (!profile.club_id) return { ok: false, error: "No club linked." }

    const supabase = await createClient()
    const updates = orderedIds.map((id, i) =>
      supabase
        .from("faqs")
        .update({ order_index: i })
        .eq("id", id)
        .eq("club_id", profile.club_id)
    )
    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)
    if (failed?.error) return { ok: false, error: failed.error.message }

    revalidatePath("/website")
    revalidatePath("/settings/website")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reorder FAQs." }
  }
}
