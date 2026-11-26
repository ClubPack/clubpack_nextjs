/**
 * Host layout
 *   <root>              marketing site
 *   app.<root>          dashboard for club admins, sponsors and members ("my." also accepted)
 *   <slug>.<root>       a club's public site
 *   verified custom domain -> a club's public site
 *
 * NEXT_PUBLIC_ROOT_DOMAIN is the bare domain ("joinclubpack.com"), or "localhost" in development,
 * where the hosts are app.localhost:3000 and <slug>.localhost:3000.
 */

function normalizeDomain(value: string | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]!
    .split(":")[0]!
}

export const ROOT_DOMAIN = normalizeDomain(process.env.NEXT_PUBLIC_ROOT_DOMAIN) || "localhost"
export const IS_LOCAL = ROOT_DOMAIN === "localhost"
export const APP_SUBDOMAIN = "app"
export const APP_SUBDOMAIN_ALIASES = ["app", "my"]

const PROTOCOL = IS_LOCAL ? "http" : "https"
const PORT = IS_LOCAL ? `:${process.env.NEXT_PUBLIC_DEV_PORT ?? "3000"}` : ""

/** Shared auth cookie across app.<root> and every <slug>.<root>. Not set on localhost. */
export const COOKIE_DOMAIN = IS_LOCAL ? undefined : `.${ROOT_DOMAIN}`

export function marketingUrl(path = "/") {
  return `${PROTOCOL}://${ROOT_DOMAIN}${PORT}${path}`
}

export function appUrl(path = "/") {
  return `${PROTOCOL}://${APP_SUBDOMAIN}.${ROOT_DOMAIN}${PORT}${path}`
}

export function clubUrl(slug: string, path = "/") {
  return `${PROTOCOL}://${slug}.${ROOT_DOMAIN}${PORT}${path}`
}

export function clubHost(slug: string) {
  return `${slug}.${ROOT_DOMAIN}`
}

/** Only allow same-site relative redirects ("/x", not "//evil.com" or "https://..."). */
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}
