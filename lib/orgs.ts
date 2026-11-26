import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

export type Organization = Database["public"]["Tables"]["organizations"]["Row"]
export type Club = Database["public"]["Tables"]["clubs"]["Row"]
export type MemberRole = Database["public"]["Enums"]["member_role"]

const RANK: Record<MemberRole, number> = { member: 0, staff: 1, admin: 2, owner: 3 }

export function hasRole(role: MemberRole | null | undefined, min: MemberRole) {
  return role != null && RANK[role] >= RANK[min]
}

/** Organization visible to the caller (public, or one they belong to). */
export const getOrgBySlug = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle()
  return data
})

export const getClub = cache(async (organizationId: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from("clubs").select("*").eq("organization_id", organizationId).maybeSingle()
  return data
})

export const getMembership = cache(async (organizationId: string, userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle()
  return data
})

/**
 * Dashboard guard: the caller must be an active member of the org with at least `min` role.
 * Plain members are sent to the club's public site instead.
 */
export async function requireOrgAccess(slug: string, min: MemberRole = "staff") {
  const user = await requireUser(`/o/${slug}`)
  const org = await getOrgBySlug(slug)
  if (!org) notFound()

  const membership = await getMembership(org.id, user.id)
  if (!membership || membership.status !== "active") notFound()
  if (!hasRole(membership.role, min)) {
    if (min === "staff" || membership.role === "member") redirect("/")
    notFound()
  }

  return { user, org, role: membership.role }
}
