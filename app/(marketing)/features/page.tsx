import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import {
  CalendarDays,
  ChartColumnIncreasing,
  Check,
  Globe,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";
import { APP_ORIGIN } from "@/lib/constants";
import clubSiteShot from "@/public/features/club-site.webp";
import membersShot from "@/public/features/members.webp";
import eventsShot from "@/public/features/events.webp";
import dashboardShot from "@/public/features/dashboard.webp";
import analyticsShot from "@/public/features/analytics.webp";
import { Reveal, Sticker } from "../components/motion";
import {
  BrowserFrame,
  CONTAINER,
  PageHero,
  PillButton,
} from "../components/primitives";

export const metadata: Metadata = {
  title: "Features",
  description:
    "A branded club website, member directory, event RSVPs, waivers, and analytics — everything your club needs in one place.",
};

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  details: string[];
  image: StaticImageData;
  /** Address shown in the browser frame around the screenshot. */
  url: string;
};

const features: Feature[] = [
  {
    icon: Globe,
    title: "Branded Club Website",
    description:
      "A fast, mobile-friendly website for your club that you can launch in minutes — no designer or developer needed.",
    details: [
      "Your own subdomain, like yourclub.joinclubpack.com",
      "Your logo, colors, hero photo, and tagline",
      "Upcoming events, FAQs, and a contact form built in",
      "Members sign up and RSVP right from the site",
    ],
    image: clubSiteShot,
    url: "outdoor-adventure.joinclubpack.com",
  },
  {
    icon: Users,
    title: "Member Sign-Up & Directory",
    description:
      "New members join through your site and land in one searchable directory.",
    details: [
      "Sign-up form with profile photo and phone number",
      "Searchable member directory with join dates",
      "Admin roles for your leadership team",
      "Collect and store signed waivers",
    ],
    image: membersShot,
    url: "app.joinclubpack.com/members",
  },
  {
    icon: CalendarDays,
    title: "Events & RSVPs",
    description:
      "Plan events, share them on your site, and know exactly who is showing up.",
    details: [
      "Create events with a cover photo, location, and map",
      "RSVP tracking with optional capacity limits",
      "Schedule when RSVPs open",
      "Members add events to Google Calendar in one tap",
    ],
    image: eventsShot,
    url: "app.joinclubpack.com/events",
  },
  {
    icon: LayoutDashboard,
    title: "Admin Dashboard",
    description:
      "One home base for running the club, so nothing lives in scattered spreadsheets and group chats.",
    details: [
      "See members, events, and RSVPs at a glance",
      "Recent activity across your club",
      "Edit your website and FAQs without code",
      "Event Ideas library for when you need inspiration",
    ],
    image: dashboardShot,
    url: "app.joinclubpack.com",
  },
  {
    icon: ChartColumnIncreasing,
    title: "Analytics",
    description:
      "Simple, high-signal metrics that show how your club is growing.",
    details: [
      "New members over the last 30 days",
      "RSVP trends to see which events land",
      "Website views to measure your reach",
      "Contact form messages in one inbox",
    ],
    image: analyticsShot,
    url: "app.joinclubpack.com/analytics",
  },
];

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything you need to run your club"
        description="ClubPack provides the tools, automation, and insights you need to build and grow a thriving community."
        stickers={
          <>
            <Sticker className="-left-10 top-4" rotate={-10}>
              5 tools in 1
            </Sticker>
            <Sticker className="-right-8 top-28" tone="black" rotate={8} delay={0.55}>
              No code ✨
            </Sticker>
          </>
        }
      >
        <PillButton href={`${APP_ORIGIN}/signup`} size="lg">
          Start building free
        </PillButton>
        <PillButton href="/pricing" variant="light" size="lg" arrow={false}>
          View pricing
        </PillButton>
      </PageHero>

      <section className="pb-20 sm:pb-32 bg-white">
        <div className={CONTAINER}>
          <div className="space-y-6 sm:space-y-8">
            {features.map((feature, index) => {
              const reversed = index % 2 === 1;
              return (
                <Reveal key={feature.title}>
                  <div
                    id={slugify(feature.title)}
                    className="scroll-mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center rounded-[32px] bg-gray-50 ring-1 ring-gray-900/5 p-6 sm:p-10 lg:p-14"
                  >
                    <div className={reversed ? "lg:order-2" : ""}>
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-2xl bg-[#0054f9] text-white shadow-[0_8px_16px_-4px_rgba(0,84,249,0.4)]">
                          <feature.icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          {String(index + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
                        </span>
                      </div>

                      <h2 className="mt-6 text-3xl sm:text-4xl font-semibold text-gray-900 tracking-[-0.03em] leading-[1.05]">
                        {feature.title}
                      </h2>

                      <p className="mt-4 text-gray-600 text-base sm:text-lg leading-relaxed">
                        {feature.description}
                      </p>

                      <ul className="mt-8 space-y-3">
                        {feature.details.map((detail) => (
                          <li key={detail} className="flex items-start gap-3">
                            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#0054f9] text-white">
                              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                            </span>
                            <span className="text-gray-700 text-base leading-relaxed">
                              {detail}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={reversed ? "lg:order-1" : ""}>
                      <BrowserFrame
                        url={feature.url}
                        className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:rotate-[0.4deg]"
                      >
                        <Image
                          src={feature.image}
                          alt={`ClubPack ${feature.title.toLowerCase()} screen`}
                          placeholder="blur"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="w-full h-auto"
                        />
                      </BrowserFrame>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
