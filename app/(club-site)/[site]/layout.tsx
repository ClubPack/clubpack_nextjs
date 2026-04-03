import type { Metadata } from "next"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { getClubBySubdomain } from "@/lib/data/club-site"
import { createClient } from "@/lib/supabase/server"
import { sanitizeCssColor } from "@/lib/utils/sanitize-css-color"

import { ClubFooter } from "../components/club-footer"
import { ClubNavbar } from "../components/club-navbar"
import { PageViewTracker } from "../components/page-view-tracker"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ site: string }>
}): Promise<Metadata> {
  const { site } = await params
  const club = await getClubBySubdomain(site)
  if (!club) return {}

  const clubLogo =
    (typeof club.logo_url === "string" && club.logo_url) ||
    (typeof club.logo === "string" && club.logo) ||
    null
  const faviconUrl = clubLogo || "/clubpack-logo-site.png"

  return {
    icons: {
      icon: [{ url: faviconUrl, sizes: "32x32" }, { url: faviconUrl, sizes: "16x16" }],
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  }
}

export default async function ClubTenantLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ site: string }>
}) {
  const { site } = await params

  const supabase = await createClient()
  const [club, { data: { user } }] = await Promise.all([
    getClubBySubdomain(site),
    supabase.auth.getUser(),
  ])
  if (!club) notFound()

  const clubLogo = 
    (typeof club.logo_url === "string" && club.logo_url) ||
    (typeof club.logo === "string" && club.logo) ||
    null

  const primaryColor = sanitizeCssColor(
    typeof club.primary_color === "string" ? club.primary_color : null,
  )

  const [membershipRes, policyRes] = await Promise.all([
    user?.id
      ? supabase
          .from("memberships")
          .select("avatar_url")
          .eq("club_id", club.id)
          .eq("auth_user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("club_policy")
      .select("id, content")
      .eq("club_id", club.id)
      .limit(1)
      .maybeSingle(),
  ])

  const memberAvatarUrl =
    (membershipRes.data as { avatar_url?: string | null } | null)?.avatar_url ?? null
  const policy = policyRes.data as { id: string; content?: string | null } | null
  const hasPolicy = !!(policy?.id && policy?.content?.trim())

  return (
    <>
      <PageViewTracker site={site} />
      <div
        className="relative min-h-dvh bg-background text-foreground"
        style={primaryColor ? { "--primary": primaryColor } as React.CSSProperties : undefined}
      >
        <ClubNavbar 
          site={site} 
          clubName={(club.name ?? "").toString()} 
          clubLogo={clubLogo}
          user={user}
          memberAvatarUrl={memberAvatarUrl}
        />
        <main>{children}</main>
        <ClubFooter
          club={{
            name: (club.name ?? club.hero_headline ?? site).toString(),
            tagline: (club.tagline ?? club.hero_subtext ?? "").toString(),
            instagram: (club.instagram ?? "").toString(),
            contact_email: (club.contact_email ?? club.email ?? "").toString(),
          }}
          hasPolicy={hasPolicy}
          policyHref="/policy"
        />
      </div>
    </>
  )
}

