import { APP_ORIGIN } from "@/lib/constants";
import { Reveal, Sticker, WordReveal } from "../motion";
import { CONTAINER, HeroGlow, PillButton } from "../primitives";
import HeroImageToggle from "./HeroImageToggle";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-14 sm:pt-24 pb-16 sm:pb-24">
      <HeroGlow />

      <div className={`${CONTAINER} relative z-10`}>
        <div className="relative text-center max-w-5xl mx-auto">
          {/* Draggable stickers around the headline (desktop only). */}
          <div className="hidden lg:block">
            <Sticker className="left-4 top-16" rotate={-10} delay={0.5}>
              Free to start
            </Sticker>
            <Sticker className="-left-6 top-48" shape="burst" rotate={-6} delay={0.65}>
              <span className="block text-2xl font-bold">100+</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider mt-1">
                clubs
              </span>
            </Sticker>
            <Sticker className="right-10 top-6" shape="circle" tone="white" rotate={8} delay={0.75}>
              <span aria-hidden>👋</span>
            </Sticker>
            <Sticker className="-right-2 top-56" tone="black" rotate={7} delay={0.85}>
              Live in 3 mins ⚡
            </Sticker>
          </div>

          <Reveal y={12}>
            <a
              href={`${APP_ORIGIN}/signup`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full bg-white py-1.5 pl-3 pr-1.5 text-sm text-gray-700 ring-1 ring-gray-200 shadow-[0_6px_20px_-10px_rgba(15,23,42,0.25)] transition hover:ring-gray-300"
            >
              <span className="relative flex size-2">
                <span className="cp-ping absolute inline-flex size-full rounded-full bg-emerald-400" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              All clubs now join free
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-900 transition group-hover:bg-[#0054f9] group-hover:text-white">
                Start building →
              </span>
            </a>
          </Reveal>

          <h1 className="mt-8 text-[2.75rem] sm:text-7xl lg:text-[6.5rem] font-semibold text-gray-900 tracking-[-0.05em] leading-[0.95]">
            <WordReveal text={"The platform for\nmodern clubs"} delay={0.1} />
          </h1>

          <Reveal delay={0.35}>
            <p className="mt-7 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
              Build your club website, manage members, and plan events all in
              one platform.
            </p>
          </Reveal>

          <Reveal delay={0.45} className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
            <PillButton href={`${APP_ORIGIN}/signup`} size="lg">
              Start building free
            </PillButton>
            <PillButton href={`${APP_ORIGIN}/new?kind=sponsor`} variant="light" size="lg" arrow={false}>
              I want to sponsor clubs
            </PillButton>
          </Reveal>
        </div>

        <Reveal delay={0.55} y={40} className="mt-14 sm:mt-20">
          <HeroImageToggle />
        </Reveal>
      </div>
    </section>
  );
}
