import { appUrl, ROOT_DOMAIN } from "@/lib/env"

export { ROOT_DOMAIN }
/** Dashboard origin, used by the marketing site's sign-up / log-in links. */
export const APP_ORIGIN = appUrl("").replace(/\/$/, "")
