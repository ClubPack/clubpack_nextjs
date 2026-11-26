"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal } from "../motion";
import { CONTAINER, SectionHeading } from "../primitives";

const STEPS = [
  {
    title: "Sign up",
    description: "Create your free account and name your club. No credit card needed.",
    tag: "Free",
    card: "bg-[#0054f9] text-white",
    desc: "text-white/75",
    tagClass: "bg-white text-[#0054f9]",
    offset: "lg:mt-0",
    rotate: -6,
  },
  {
    title: "Make it yours",
    description: "Add your logo, colors, and photos. Your website is live in about three minutes.",
    tag: "No code",
    card: "bg-white text-gray-900",
    desc: "text-gray-600",
    tagClass: "bg-gray-950 text-white",
    offset: "lg:mt-28",
    rotate: 5,
  },
  {
    title: "Invite members",
    description: "Share one link. Members sign up, sign waivers, and land in your directory.",
    tag: "One link",
    card: "bg-sky-100 text-gray-900",
    desc: "text-gray-700",
    tagClass: "bg-[#0054f9] text-white",
    offset: "lg:mt-10",
    rotate: -4,
  },
  {
    title: "Host events",
    description: "Create events, collect RSVPs, and see exactly who is showing up.",
    tag: "Let’s go 🎉",
    card: "bg-gray-800 text-white ring-1 ring-white/10",
    desc: "text-white/60",
    tagClass: "bg-white text-gray-950",
    offset: "lg:mt-36",
    rotate: 6,
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.6"],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="pb-28 sm:pb-40">
      <div className={CONTAINER}>
        <SectionHeading
          dark
          eyebrow="How it works"
          title={
            <>
              From idea to active club <span className="text-white/40">in an afternoon</span>
            </>
          }
        />

        <div ref={ref} className="relative">
          {/* Wavy line that draws itself as you scroll (desktop). */}
          <svg
            viewBox="0 0 1200 360"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 top-10 hidden h-[360px] w-full lg:block"
            aria-hidden
          >
            <motion.path
              d="M-20 120 C 150 20, 220 40, 300 120 S 450 300, 600 230 S 800 60, 900 140 S 1080 330, 1230 260"
              fill="none"
              stroke="white"
              strokeOpacity={0.9}
              strokeWidth={5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={reduce ? undefined : { pathLength }}
            />
          </svg>

          <ol className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className={step.offset}>
                <Reveal delay={i * 0.1}>
                  <div
                    className={cn(
                      "relative flex min-h-[280px] flex-col rounded-[28px] p-6 sm:p-7 transition-transform duration-500 hover:-translate-y-1.5 hover:rotate-[-0.5deg]",
                      step.card,
                    )}
                  >
                    <span
                      className={cn(
                        "absolute -top-3 right-5 rounded-full px-3 py-1 text-xs font-semibold shadow-lg",
                        step.tagClass,
                      )}
                      style={{ transform: `rotate(${step.rotate}deg)` }}
                    >
                      {step.tag}
                    </span>
                    <span className="font-mono text-sm opacity-60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-auto text-2xl sm:text-3xl font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className={cn("mt-2 text-base leading-relaxed", step.desc)}>
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
