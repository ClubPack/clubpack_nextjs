"use server"

import { headers } from "next/headers"

import { fail, friendlyError, goTo, str, type ActionState } from "@/lib/actions"
import { safeNext } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

async function currentOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

export async function logIn(_: ActionState, form: FormData): Promise<ActionState> {
  const email = str(form, "email").toLowerCase()
  const password = str(form, "password")
  const next = safeNext(str(form, "next"))
  if (!email || !password) return fail("Enter your email and password.")

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return fail(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message)

  return goTo(next, { hard: true })
}

export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const fullName = str(form, "full_name")
  const email = str(form, "email").toLowerCase()
  const password = str(form, "password")
  const next = safeNext(str(form, "next"))

  if (fullName.length < 2) return fail("Enter your name.")
  if (!email.includes("@")) return fail("Enter a valid email.")
  if (password.length < 8) return fail("Use at least 8 characters for your password.")

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await currentOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
  if (error) return fail(friendlyError(error))

  // Email confirmation disabled -> signed in immediately.
  if (data.session) return goTo(next, { hard: true })

  return { ok: true, message: `Check ${email} for a confirmation link to finish signing up.` }
}
