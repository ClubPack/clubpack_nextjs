"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  FileSignature,
  Globe,
  Handshake,
  LayoutDashboard,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type Item = { href: string; label: string; icon: LucideIcon; admin?: boolean }

export function OrgNav({ slug, kind, role }: { slug: string; kind: "club" | "sponsor"; role: string }) {
  const pathname = usePathname()
  const base = `/o/${slug}`
  const isAdmin = role === "owner" || role === "admin"

  const items: Item[] =
    kind === "club"
      ? [
          { href: base, label: "Overview", icon: LayoutDashboard },
          { href: `${base}/events`, label: "Events", icon: CalendarDays },
          { href: `${base}/members`, label: "Members", icon: Users },
          { href: `${base}/waiver`, label: "Waiver", icon: FileSignature, admin: true },
          { href: `${base}/site`, label: "Club site", icon: Globe, admin: true },
          { href: `${base}/sponsorship`, label: "Sponsorship", icon: Handshake, admin: true },
          { href: `${base}/settings`, label: "Settings", icon: Settings, admin: true },
        ]
      : [
          { href: base, label: "Overview", icon: LayoutDashboard },
          { href: `${base}/discover`, label: "Find clubs", icon: Search },
          { href: `${base}/sponsorship`, label: "Deals", icon: Handshake, admin: true },
          { href: `${base}/members`, label: "Team", icon: Users },
          { href: `${base}/settings`, label: "Profile", icon: Settings, admin: true },
        ]

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items
        .filter((i) => !i.admin || isAdmin)
        .map((item) => {
          const active = item.href === base ? pathname === base : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
    </nav>
  )
}
