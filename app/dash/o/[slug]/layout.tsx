import type { ReactNode } from "react"

import { clubUrl } from "@/lib/env"
import { requireOrgAccess } from "@/lib/orgs"

import { OrgNav } from "./org-nav"

export default async function OrgLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org, role } = await requireOrgAccess(slug, "staff")

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{org.kind === "club" ? "Club" : "Sponsor"}</p>
          <p className="font-semibold leading-tight">{org.name}</p>
          {org.kind === "club" ? (
            <a href={clubUrl(org.slug)} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">
              View club site ↗
            </a>
          ) : null}
        </div>
        <OrgNav slug={org.slug} kind={org.kind} role={role} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
