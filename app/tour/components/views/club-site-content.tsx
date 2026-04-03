"use client";

import { ClubNavbar } from "@/app/(club-site)/components/club-navbar";
import { ClubFooter } from "@/app/(club-site)/components/club-footer";
import { HeroSection } from "@/app/(club-site)/[site]/components/hero-section";
import { AboutSection } from "@/app/(club-site)/[site]/components/about-section";
import { EventsSection } from "@/app/(club-site)/[site]/components/events-section";
import { FaqsSection } from "@/app/(club-site)/[site]/components/faqs-section";
import { JoinSection } from "@/app/(club-site)/[site]/components/join-section";

import {
  tourClubData,
  tourUpcomingEvents,
  tourFaqs,
  tourClubNav,
  tourClubFooter,
} from "../../mock-data";

export function ClubSiteContent() {
  return (
    <div className="bg-background text-foreground min-h-dvh flex flex-col">
      <ClubNavbar
        site={tourClubNav.site}
        clubName={tourClubNav.clubName}
        clubLogo={tourClubNav.clubLogo}
        user={null}
        memberAvatarUrl={null}
      />
      <main className="flex-1">
        <HeroSection club={tourClubData} />
        <AboutSection club={tourClubData} />
        <EventsSection events={tourUpcomingEvents} />
        <FaqsSection faqs={tourFaqs} />
        <JoinSection />
      </main>
      <ClubFooter club={tourClubFooter} hasPolicy={false} policyHref="#" />
    </div>
  );
}
