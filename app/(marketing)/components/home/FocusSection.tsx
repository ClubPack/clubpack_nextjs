import Image from "next/image";
import { HeartHandshake, Sparkles, Users } from "lucide-react";
import { APP_ORIGIN } from "@/lib/constants";
import { Parallax, Reveal, ScrollRevealText } from "../motion";
import { CONTAINER, Eyebrow, PillButton } from "../primitives";

const VALUES = [
  {
    icon: Users,
    title: "Know your people",
    description:
      "See who is joining and showing up, so every member gets noticed.",
  },
  {
    icon: HeartHandshake,
    title: "Make it easy to belong",
    description:
      "Simple sign-ups and clear events mean less figuring out, more time together.",
  },
  {
    icon: Sparkles,
    title: "Get your time back",
    description:
      "Let the busywork run itself and put your energy into the moments that matter.",
  },
];

export default function FocusSection() {
  return (
    <section className="pt-28 sm:pt-40 pb-20 sm:pb-28">
      <div className={CONTAINER}>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-16">
          <Reveal>
            <Eyebrow dark>People, not paperwork</Eyebrow>
          </Reveal>
          <ScrollRevealText
            className="text-3xl sm:text-5xl lg:text-[3.75rem] font-medium tracking-[-0.03em] leading-[1.08] text-white"
            text="Clubs are about friendships and showing up together. ClubPack handles the logistics so you can spend your time on people, not paperwork."
          />
        </div>

        <div className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-16">
          <div className="hidden lg:block" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-stretch">
            <Reveal className="lg:col-span-3">
              <Parallax className="relative rounded-[28px] aspect-[3/2] lg:aspect-auto lg:h-full lg:min-h-[460px]">
                <Image
                  src="/club-photos/happy-group.webp"
                  alt="Happy club members gathered together"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </Parallax>
            </Reveal>

            <div className="lg:col-span-2 flex flex-col justify-between gap-10">
              <ul className="divide-y divide-white/10">
                {VALUES.map(({ icon: Icon, title, description }, i) => (
                  <li key={title} className="py-6 first:pt-0">
                    <Reveal delay={i * 0.1} className="flex gap-4">
                      <div className="size-11 shrink-0 rounded-2xl bg-white/10 text-white flex items-center justify-center ring-1 ring-white/10">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {title}
                        </h3>
                        <p className="text-white/60 text-base leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>

              <Reveal delay={0.3}>
                <PillButton href={`${APP_ORIGIN}/signup`} size="lg">
                  Get started today
                </PillButton>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
