import { createClient } from "@/lib/supabase/server"
import { type EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

const VALID_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
])

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const rawType = searchParams.get("type")
  const next = searchParams.get("next") ?? "/auth/create-club"

  const type = VALID_OTP_TYPES.has(rawType as EmailOtpType)
    ? (rawType as EmailOtpType)
    : null

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) redirect(next)
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/auth/login?error=${encodeURIComponent("Missing or invalid token")}`)
}
