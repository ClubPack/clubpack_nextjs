import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import clubSiteShot from "@/public/features/club-site.webp";
import membersShot from "@/public/features/members.webp";
import eventsShot from "@/public/features/events.webp";
import dashboardShot from "@/public/features/dashboard.webp";
import analyticsShot from "@/public/features/analytics.webp";
import { Reveal } from "../motion";
import { CONTAINER, PillButton, SectionHeading } from "../primitives";

type Tile = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image: StaticImageData;
  tone: "dark" | "blue" | "light";
  className?: string;
};

const TILES: Tile[] = [
  {
    id: "branded-club-website",
    title: "Beautiful website out of the box",
    description:
      "A custom site with your logo, colors, events, and sign-up form — published the moment you sign up.",
    tags: ["Website", "Live in 3 mins"],
    image: clubSiteShot,
    tone: "dark",
    className: "md:col-span-2",
  },
  {
    id: "member-sign-up-directory",
    title: "Member directory",
    description: "New members join through your site and land in one searchable list.",
    tags: ["Members"],
    image: membersShot,
    tone: "blue",
  },
  {
    id: "events-rsvps",
    title: "Events & RSVPs",
    description: "Plan events, share them, and know exactly who is showing up.",
    tags: ["Events"],
    image: eventsShot,
    tone: "light",
  },
  {
    id: "admin-dashboard",
    title: "Admin dashboard",
    description: "One home base for running the club.",
    tags: ["Dashboard"],
    image: dashboardShot,
    tone: "light",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Simple metrics that show how your club is growing.",
    tags: ["Insights"],
    image: analyticsShot,
    tone: "dark",
  },
];

const TONES = {
  dark: {
    card: "bg-gray-950 text-white",
    desc: "text-white/60",
    tag: "bg-white/10 text-white/80 ring-white/10",
    arrow: "bg-white text-gray-950",
  },
  blue: {
    card: "bg-[#0054f9] text-white",
    desc: "text-white/70",
    tag: "bg-white/15 text-white ring-white/20",
    arrow: "bg-white text-[#0054f9]",
  },
  light: {
    card: "bg-gray-100 text-gray-900",
    desc: "text-gray-600",
    tag: "bg-white text-gray-700 ring-gray-200",
    arrow: "bg-gray-950 text-white",
  },
} as const;

function ShowcaseTile({ tile, index }: { tile: Tile; index: number }) {
  const tone = TONES[tile.tone];
  const wide = tile.className?.includes("col-span-2");

  return (
    <Reveal delay={(index % 3) * 0.08} className={tile.className}>
      <Link
        href={`/features#${tile.id}`}
        className={cn(
          "group relative flex h-full min-h-[420px] sm:min-h-[480px] flex-col overflow-hidden rounded-[28px] p-6 sm:p-8 transition-transform duration-500 hover:-translate-y-1",
          tone.card,
        )}
      >
        <div className="relative z-10 flex items-start justify-between gap-6">
          <div className={wide ? "max-w-md" : "max-w-xs"}>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {tile.title}
            </h3>
            <p className={cn("mt-2 text-base leading-relaxed", tone.desc)}>
              {tile.description}
            </p>
          </div>
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full transition-all duration-500 group-hover:rotate-45 group-hover:scale-110",
              tone.arrow,
            )}
            aria-hidden
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>

        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          {tile.tags.map((tag) => (
            <span
              key={tag}
              className={cn("rounded-full px-3 py-1 text-xs font-medium ring-1", tone.tag)}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          className={cn(
            "relative mt-8 -mb-6 sm:-mb-8 flex-1",
            wide ? "ml-0 sm:ml-12" : "-mr-6 sm:-mr-8",
          )}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 overflow-hidden rounded-t-xl ring-1 ring-black/10 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.35)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-3",
              !wide && "rounded-tr-none",
            )}
          >
            <Image
              src={tile.image}
              alt={`ClubPack ${tile.title.toLowerCase()} screen`}
              placeholder="blur"
              sizes={wide ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 1024px) 100vw, 33vw"}
              className="w-full h-auto"
            />
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

export default function SolutionSection() {
  return (
    <section className="py-20 sm:py-32 bg-white">
      <div className={CONTAINER}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 sm:mb-16">
          <SectionHeading
            className="mb-0 sm:mb-0"
            eyebrow="The solution"
            title="Everything you need, all in one place"
            description="ClubPack eliminates the complexity with integrated tools designed specifically for club management."
          />
          <Reveal delay={0.1} className="shrink-0">
            <PillButton href="/features" variant="dark">
              See all features
            </PillButton>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {TILES.map((tile, i) => (
            <ShowcaseTile key={tile.id} tile={tile} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
