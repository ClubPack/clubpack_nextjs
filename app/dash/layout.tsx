import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { getProfile, requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: { default: "ClubPack", template: "%s · ClubPack" },
  robots: { index: false, follow: false },
}

export default async function DashLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/")
  const profile = await getProfile(user.id)

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-bold tracking-tight">
            ClubPack
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{profile?.full_name || user.email}</span>
            <Link href="/profile" className="text-muted-foreground hover:text-foreground">
              Profile
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-muted-foreground hover:text-foreground">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
