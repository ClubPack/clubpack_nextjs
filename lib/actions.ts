/**
 * Result shape for server actions used with useActionState.
 *
 * Never call redirect() inside a server action here: Next follows an action redirect by
 * re-fetching the page from the server's own origin, which bypasses the host-based rewrite
 * in proxy.ts (app.<root> would render the marketing site). Return `redirectTo` instead and
 * the client navigates, so the request goes through the proxy with the right host.
 */
export type ActionState = {
  ok?: boolean
  error?: string
  message?: string
  /** Same-host path to navigate to after the action. */
  redirectTo?: string
  /** Full page load instead of a client navigation (after sign-in/out, so every layout re-reads the session). */
  hardRedirect?: boolean
} | null

export function goTo(path: string, opts: { hard?: boolean } = {}): ActionState {
  return { ok: true, redirectTo: path, hardRedirect: opts.hard }
}

export function fail(error: string): ActionState {
  return { ok: false, error }
}

export function done(message?: string): ActionState {
  return { ok: true, message }
}

export function str(form: FormData, key: string) {
  const v = form.get(key)
  return typeof v === "string" ? v.trim() : ""
}

export function optStr(form: FormData, key: string) {
  const v = str(form, key)
  return v.length > 0 ? v : null
}

export function bool(form: FormData, key: string) {
  const v = form.get(key)
  return v === "on" || v === "true" || v === "1"
}

export function int(form: FormData, key: string) {
  const v = str(form, key)
  if (!v) return null
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

/** Relative same-site path or fallback (for `next` params posted from forms). */
export function safeNextLocal(next: string, fallback = "/") {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback
}

/** Turn Postgres / PostgREST errors into something a person can act on. */
export function friendlyError(error: { message?: string; code?: string } | null | undefined, fallback = "Something went wrong.") {
  if (!error) return fallback
  const msg = error.message ?? ""
  if (error.code === "23505") {
    if (msg.includes("slug")) return "That web address is taken. Try another."
    return "That already exists."
  }
  if (msg.includes("organizations_slug_check")) return "Use 3–40 lowercase letters, numbers or dashes (not a reserved word)."
  if (error.code === "42501" || msg.includes("row-level security")) return msg && !msg.includes("row-level") ? msg : "You don't have permission to do that."
  if (error.code === "22023" || error.code === "P0002") return msg
  if (error.code === "23514") return "Some of those values aren't allowed. Check the form and try again."
  return msg || fallback
}
