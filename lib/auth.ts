import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type SessionUser = { id: string; email: string | null }

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || typeof claims.sub !== "string") return null
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null }
})

/** Redirects to /login (on the current host) when signed out. `next` is the path to come back to. */
export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
  return data
})
