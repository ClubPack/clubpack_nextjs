import { NextResponse, type NextRequest } from "next/server"

import { appUrl } from "@/lib/env"
import { updateSession, withCookies } from "@/lib/supabase/proxy"
import { lookupCustomDomain, resolveHost } from "@/lib/tenancy"

/**
 * Routes every request by host:
 *   marketing host  -> app/(marketing)      (no rewrite)
 *   app host        -> app/dash/...         (sign-in required)
 *   club host       -> app/site/[slug]/...
 *   custom domain   -> app/site/[slug]/...  (verified domains only)
 * Auth pages (/login, /signup, /auth/*) are served as-is on every host so a club site can
 * sign people in without leaving its own domain.
 */

const SHARED_PREFIXES = ["/login", "/signup", "/auth"]
const INTERNAL_PREFIXES = ["/dash", "/site"]

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`))
}

function rewriteTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.rewrite(url, { request: req })
}

function notFound(req: NextRequest) {
  return rewriteTo(req, "/__not_found")
}

export async function proxy(req: NextRequest) {
  const route = resolveHost(req.headers.get("host"))
  const { pathname, search } = req.nextUrl
  const suffix = pathname === "/" ? "" : pathname

  // Supabase sends confirmation / magic links to the project's Site URL ("/?code=...") when the
  // requested redirect isn't allow-listed. Finish the sign-in on the dashboard host, which holds the
  // PKCE verifier cookie for sign-ups started there (in production the cookie is shared anyway).
  const code = req.nextUrl.searchParams.get("code")
  if (pathname === "/" && code) {
    const target = route.type === "marketing" ? new URL(appUrl("/auth/callback")) : new URL("/auth/callback", req.url)
    target.searchParams.set("code", code)
    target.searchParams.set("next", "/")
    return NextResponse.redirect(target)
  }

  // Internal route trees are only reachable through a rewrite.
  if (startsWithAny(pathname, INTERNAL_PREFIXES)) return notFound(req)

  const shared = startsWithAny(pathname, SHARED_PREFIXES)

  if (route.type === "marketing" && !shared) return NextResponse.next()

  const { response, userId } = await updateSession(req)
  if (shared || route.type === "marketing") return response

  if (route.type === "app") {
    if (!userId) {
      const login = req.nextUrl.clone()
      login.pathname = "/login"
      login.search = `?next=${encodeURIComponent(pathname + search)}`
      return withCookies(response, NextResponse.redirect(login))
    }
    return withCookies(response, rewriteTo(req, `/dash${suffix}`))
  }

  const slug = route.type === "club" ? route.slug : await lookupCustomDomain(route.hostname)
  if (!slug) return withCookies(response, notFound(req))
  return withCookies(response, rewriteTo(req, `/site/${slug}${suffix}`))
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.[a-zA-Z0-9]+$).*)",
  ],
}
