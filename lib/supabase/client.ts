import { createBrowserClient } from "@supabase/ssr"

import { COOKIE_DOMAIN } from "@/lib/env"
import type { Database } from "./database.types"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookieOptions: COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : undefined },
  )
}
