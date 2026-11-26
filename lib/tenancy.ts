import { APP_SUBDOMAIN_ALIASES, IS_LOCAL, ROOT_DOMAIN } from "@/lib/env"

export type HostRoute =
  | { type: "marketing" }
  | { type: "app" }
  | { type: "club"; slug: string }
  | { type: "custom"; hostname: string }

const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/

export function resolveHost(rawHost: string | null): HostRoute {
  const host = (rawHost ?? "").split(":")[0]!.toLowerCase()

  if (!host || host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return { type: "marketing" }
  if (IS_LOCAL && (host === "127.0.0.1" || host === "::1" || host === "[::1]")) return { type: "marketing" }
  // Vercel preview/production deployment URLs show the marketing site.
  if (host.endsWith(".vercel.app")) return { type: "marketing" }

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = host.slice(0, -(ROOT_DOMAIN.length + 1))
    if (APP_SUBDOMAIN_ALIASES.includes(sub)) return { type: "app" }
    if (SLUG.test(sub)) return { type: "club", slug: sub }
    return { type: "marketing" }
  }

  return { type: "custom", hostname: host }
}

// Custom domain -> club slug. Verified domains are readable with the publishable key.
const domainCache = new Map<string, { slug: string | null; expires: number }>()
const DOMAIN_TTL_MS = 5 * 60 * 1000

export async function lookupCustomDomain(hostname: string): Promise<string | null> {
  const cached = domainCache.get(hostname)
  if (cached && cached.expires > Date.now()) return cached.slug

  let slug: string | null = null
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/organization_domains`)
    url.searchParams.set("select", "organizations(slug)")
    url.searchParams.set("hostname", `eq.${hostname}`)
    url.searchParams.set("limit", "1")
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (res.ok) {
      const rows = (await res.json()) as Array<{ organizations: { slug: string } | null }>
      slug = rows[0]?.organizations?.slug ?? null
    }
  } catch {
    slug = null
  }

  domainCache.set(hostname, { slug, expires: Date.now() + DOMAIN_TTL_MS })
  return slug
}
