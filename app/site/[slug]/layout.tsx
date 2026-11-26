import type { Metadata } from "next"
import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"

import { appUrl, marketingUrl } from "@/lib/env"
import { publicMediaUrl } from "@/lib/storage"

import { getSiteClub, getVisitor } from "./data"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { org } = await getSiteClub(slug)
  const logo = publicMediaUrl(org.logo_path)
  const cover = publicMediaUrl(org.cover_path)
  return {
    title: { default: org.name, template: `%s · ${org.name}` },
    description: org.tagline ?? org.description?.slice(0, 160) ?? `${org.name} on ClubPack`,
    icons: logo ? { icon: logo, apple: logo } : undefined,
    openGraph: { title: org.name, description: org.tagline ?? undefined, images: cover ? [cover] : logo ? [logo] : undefined },
  }
}

export default async function ClubSiteLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org, club } = await getSiteClub(slug)
  const visitor = await getVisitor(org.id)
  const logo = publicMediaUrl(org.logo_path)
  const brand = org.brand_color ?? "#111827"
  const isMember = visitor.membership?.status === "active"

  return (
    <div className="min-h-dvh bg-background text-foreground" style={{ "--brand": brand } as CSSProperties}>
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
            {logo ? <img src={logo} alt="" className="size-8 rounded-md object-cover" /> : <span className="size-8 rounded-md" style={{ background: brand }} />}
            <span className="truncate">{org.name}</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/#events" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Events
            </Link>
            {club.open_to_sponsors ? (
              <Link href="/sponsor" className="hidden text-muted-foreground hover:text-foreground sm:inline">
                Sponsor us
              </Link>
            ) : null}
            {visitor.user ? (
              <>
                <a href={appUrl("/")} className="text-muted-foreground hover:text-foreground">
                  My ClubPack
                </a>
                {!isMember ? (
                  <Link href="/join" className="rounded-full px-4 py-1.5 font-medium text-white" style={{ background: brand }}>
                    Join
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <Link href="/login?next=/" className="text-muted-foreground hover:text-foreground">
                  Log in
                </Link>
                <Link href="/join" className="rounded-full px-4 py-1.5 font-medium text-white" style={{ background: brand }}>
                  Join
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-16 border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {org.name}</span>
          <a href={marketingUrl("/")} className="hover:text-foreground">
            Powered by ClubPack
          </a>
        </div>
      </footer>
    </div>
  )
}
