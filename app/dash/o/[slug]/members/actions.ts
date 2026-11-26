"use server"

import { createHash, randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"

import { fail, friendlyError, str, type ActionState } from "@/lib/actions"
import { appUrl } from "@/lib/env"
import { requireOrgAccess, type MemberRole } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"

export async function setMemberStatus(slug: string, userId: string, status: "active" | "removed") {
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  await supabase.from("organization_members").update({ status }).eq("organization_id", org.id).eq("user_id", userId)
  revalidatePath(`/dash/o/${slug}`, "layout")
}

export async function setMemberRole(slug: string, userId: string, form: FormData) {
  const { org } = await requireOrgAccess(slug, "admin")
  const role = str(form, "role") as MemberRole
  if (!["owner", "admin", "staff", "member"].includes(role)) return
  const supabase = await createClient()
  await supabase.from("organization_members").update({ role }).eq("organization_id", org.id).eq("user_id", userId)
  revalidatePath(`/dash/o/${slug}`, "layout")
}

export async function createInvite(slug: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { org, user } = await requireOrgAccess(slug, "admin")
  const email = str(form, "email").toLowerCase()
  const role = (str(form, "role") || "member") as MemberRole
  if (!email.includes("@")) return fail("Enter an email address.")
  if (!["admin", "staff", "member"].includes(role)) return fail("Pick a role.")

  const token = randomBytes(24).toString("base64url")
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex")
  const supabase = await createClient()

  // Replace any open invite for the same email.
  await supabase.from("organization_invitations").delete().eq("organization_id", org.id).eq("email", email).is("accepted_at", null)
  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: org.id,
    email,
    role,
    token_hash: tokenHash,
    invited_by: user.id,
  })
  if (error) return fail(friendlyError(error))

  revalidatePath(`/dash/o/${slug}/members`)
  return {
    ok: true,
    message: `Invite link for ${email} (valid 14 days, shown once): ${appUrl(`/invite/${token}`)}`,
  }
}

export async function revokeInvite(slug: string, inviteId: string) {
  const { org } = await requireOrgAccess(slug, "admin")
  const supabase = await createClient()
  await supabase.from("organization_invitations").delete().eq("id", inviteId).eq("organization_id", org.id)
  revalidatePath(`/dash/o/${slug}/members`)
}
