"use server"

import { revalidatePath } from "next/cache"

import { fail, friendlyError, goTo, optStr, str, type ActionState } from "@/lib/actions"
import { requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"

type DealStatus = "accepted" | "declined" | "active" | "completed" | "cancelled"

function dollarsToCents(value: string) {
  const n = Number.parseFloat(value.replace(/[$,]/g, ""))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

function refresh(slug: string) {
  revalidatePath(`/dash/o/${slug}`, "layout")
}

// --- Club side ------------------------------------------------------------------

export async function setOpenToSponsors(slug: string, open: boolean) {
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  await supabase.from("clubs").update({ open_to_sponsors: open }).eq("organization_id", org.id)
  refresh(slug)
  revalidatePath(`/site/${slug}`, "layout")
}

export async function addPackage(slug: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org } = await requireOrgAccess(slug, "admin")
  const price = dollarsToCents(str(form, "price"))
  if (!str(form, "title")) return fail("Name the package.")
  if (price === null) return fail("Enter a price in dollars (0 is fine for in-kind).")
  const period = str(form, "billing_period")
  const supabase = await createClient()
  const { count } = await supabase.from("sponsorship_packages").select("id", { count: "exact", head: true }).eq("organization_id", org.id)
  const { error } = await supabase.from("sponsorship_packages").insert({
    organization_id: org.id,
    title: str(form, "title"),
    description: optStr(form, "description"),
    deliverables: str(form, "deliverables")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    price_cents: price,
    billing_period: (["one_time", "per_event", "per_semester", "per_year"].includes(period) ? period : "one_time") as
      | "one_time"
      | "per_event"
      | "per_semester"
      | "per_year",
    position: count ?? 0,
  })
  if (error) return fail(friendlyError(error))
  refresh(slug)
  return { ok: true, message: "Package added." }
}

export async function togglePackage(slug: string, packageId: string, active: boolean) {
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  await supabase.from("sponsorship_packages").update({ is_active: active }).eq("id", packageId).eq("organization_id", org.id)
  refresh(slug)
}

// --- Both sides -------------------------------------------------------------------

export async function setDealStatus(slug: string, dealId: string, status: DealStatus) {
  await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  const { error } = await supabase.from("sponsorship_deals").update({ status }).eq("id", dealId)
  if (error) throw new Error(friendlyError(error))
  refresh(slug)
}

export async function addDeliverable(slug: string, dealId: string, _: ActionState, form: FormData): Promise<ActionState> {
  await requireOrgAccess(slug, "admin")
  const description = str(form, "description")
  if (!description) return fail("Describe the deliverable.")
  const due = str(form, "due_on")
  const supabase = await createClient()
  const { error } = await supabase.from("deal_deliverables").insert({
    deal_id: dealId,
    description,
    event_id: optStr(form, "event_id"),
    due_at: due ? new Date(`${due}T12:00:00Z`).toISOString() : null,
  })
  if (error) return fail(friendlyError(error))
  refresh(slug)
  return { ok: true, message: "Added." }
}

export async function setDeliverableDone(slug: string, deliverableId: string, done: boolean) {
  await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  await supabase
    .from("deal_deliverables")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("id", deliverableId)
  refresh(slug)
}

// --- Sponsor side -----------------------------------------------------------------

export async function proposeDeal(slug: string, clubId: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org, user } = await requireOrgAccess(slug, "admin")
  if (org.kind !== "sponsor") return fail("Only sponsor profiles can propose deals.")
  const amount = dollarsToCents(str(form, "amount"))
  if (amount === null) return fail("Enter an amount in dollars.")
  const title = str(form, "title")
  if (!title) return fail("Give the proposal a title.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sponsorship_deals")
    .insert({
      club_id: clubId,
      sponsor_id: org.id,
      package_id: optStr(form, "package_id"),
      proposed_by_org: org.id,
      proposed_by: user.id,
      title,
      terms: optStr(form, "terms"),
      amount_cents: amount,
      starts_on: optStr(form, "starts_on"),
      ends_on: optStr(form, "ends_on"),
    })
    .select("id")
    .single()
  if (error) return fail(friendlyError(error))

  refresh(slug)
  return goTo(`/o/${slug}/sponsorship/${data.id}`)
}
