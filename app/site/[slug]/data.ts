import "server-only"

import { cache } from "react"
import { notFound } from "next/navigation"

import { getUser } from "@/lib/auth"
import { getClub, getMembership, getOrgBySlug } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"

/** The club behind this site, or 404 (unknown, sponsor, archived, or private and you're not a member). */
export const getSiteClub = cache(async (slug: string) => {
  const org = await getOrgBySlug(slug)
  if (!org || org.kind !== "club" || org.archived_at) notFound()
  const club = await getClub(org.id)
  if (!club) notFound()
  return { org, club }
})

/** Signed-in visitor's relationship to the club: membership, current waiver, and whether they've signed it. */
export const getVisitor = cache(async (orgId: string) => {
  const user = await getUser()
  const supabase = await createClient()
  const { data: waiver } = await supabase
    .from("waivers")
    .select("id, version, title, body")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .maybeSingle()

  if (!user) return { user: null, membership: null, waiver, signedWaiver: false }

  const [membership, { data: signature }] = await Promise.all([
    getMembership(orgId, user.id),
    waiver
      ? supabase.from("waiver_signatures").select("id").eq("waiver_id", waiver.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return { user, membership, waiver, signedWaiver: Boolean(signature) }
})
