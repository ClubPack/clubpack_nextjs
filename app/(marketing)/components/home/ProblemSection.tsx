"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { APP_ORIGIN } from "@/lib/constants";
import { Reveal } from "../motion";
import { CONTAINER, PillButton, SectionHeading } from "../primitives";
import MobileCarousel from "./MobileCarousel";

const MESSAGES = [
  {
    id: 1,
    app: "Instagram",
    logo: "/logos/Instagram_icon.png",
    user: "@run_member",
    text: "Tagged you in a story: 'Best workout with the club! 🔥'",
    time: "2m ago",
  },
  {
    id: 2,
    app: "Strava",
    logo: "/logos/strava.png",
    user: "Run Club",
    text: "3 new members joined the 'Winter Miles' challenge.",
    time: "5m ago",
  },
  {
    id: 3,
    app: "Eventbrite",
    logo: "/logos/eventbrite.png",
    user: "Ticket Sales",
    text: "New order: 3 VIP tickets sold for the Gala. $150.00 total.",
    time: "12m ago",
  },
  {
    id: 4,
    app: "Partiful",
    logo: "/logos/partiful.png",
    user: "RSVP Update",
    text: "Sarah and 2 others RSVP'd for 'Weekend Hike'.",
    time: "20m ago",
  },
  {
    id: 5,
    app: "Instagram",
    logo: "/logos/Instagram_icon.png",
    user: "@new_member",
    text: "DM: 'What's the best way to sign up for next month?'",
    time: "45m ago",
  },
];

const appLogos = [
  { name: "Square", src: "/logos/square-logo.png" },
  { name: "Eventbrite", src: "/logos/eventbrite.png" },
  { name: "Partiful", src: "/logos/partiful.png" },
  { name: "Strava", src: "/logos/strava.png" },
  { name: "Squarespace", src: "/logos/squarespace.png" },
  { name: "Sweatpals", src: "/logos/sweatpals.png" },
  { name: "Venmo", src: "/logos/Venmo_logo.png" },
  { name: "Google Maps", src: "/logos/google-maps.png" },
  { name: "Instagram", src: "/logos/Instagram_icon.png" },
];

function NotificationAnimation() {
  const [visibleMessages, setVisibleMessages] = useState(MESSAGES.slice(0, 3));
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    let currentIndex = 3;
    const interval = setInterval(() => {
      const nextMessageIndex = currentIndex % MESSAGES.length;
      const nextMessage = { ...MESSAGES[nextMessageIndex], id: Date.now() };
      setVisibleMessages((prev) => [nextMessage, ...prev.slice(0, 2)]);
      currentIndex++;
    }, 3000);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div className="flex flex-col gap-4 h-full justify-start pt-2 overflow-hidden relative px-5 sm:px-8">
      <AnimatePresence initial={false} mode="popLayout">
        {visibleMessages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: -40, scale: 0.9, filter: "blur(0px)" }}
            animate={{
              opacity: idx === 0 ? 1 : idx === 1 ? 0.7 : 0.4,
              y: 0,
              scale: idx === 0 ? 1 : idx === 1 ? 0.96 : 0.92,
              filter: `blur(${idx === 0 ? 0 : idx === 1 ? 1.5 : 5}px)`,
            }}
            exit={{ opacity: 0, y: 40, scale: 0.8, filter: "blur(12px)" }}
            transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }}
            layout
            className="bg-white/90 backdrop-blur-sm p-3.5 rounded-[22px] shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] ring-1 ring-gray-900/5 flex items-center gap-4"
          >
            <div className="flex-shrink-0 w-12 h-12 relative">
              <Image
                src={msg.logo}
                alt={msg.app}
                fill
                sizes="48px"
                className="object-contain rounded-xl"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="font-bold text-[15px] text-gray-900 truncate">
                  {msg.app}
                </span>
                <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                  {msg.time}
                </span>
              </div>
              <p className="text-[13px] text-gray-600 leading-tight line-clamp-2">
                <span className="font-semibold text-gray-700">{msg.user}</span>{" "}
                {msg.text}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Resting height, wobble keyframes, and duration for each analytics bar.
const BARS = [
  { h: 55, wobble: [55, 60, 53, 57, 55], d: 4, delay: 0 },
  { h: 75, wobble: [75, 70, 78, 73, 75], d: 4.5, delay: 0.3 },
  { h: 92, wobble: [92, 95, 90, 94, 92], d: 4.2, delay: 0.6 },
  { h: 65, wobble: [65, 63, 68, 64, 65], d: 4.7, delay: 0.9 },
  { h: 85, wobble: [85, 88, 83, 86, 85], d: 4.3, delay: 0.2 },
  { h: 97, wobble: [97, 95, 99, 96, 97], d: 4.6, delay: 0.5 },
  { h: 70, wobble: [70, 73, 68, 71, 70], d: 4.4, delay: 0.8 },
];

function ProblemCard({
  index,
  title,
  description,
  cta,
  children,
}: {
  index: number;
  title: string;
  description: string;
  cta: string;
  children: ReactNode;
}) {
  return (
    <Reveal delay={index * 0.1} className="flex w-full">
      <Card className="group bg-white w-full rounded-3xl p-6 sm:p-8 border-0 ring-1 ring-gray-900/5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-24px_rgba(15,23,42,0.22)] transition-all duration-500 overflow-hidden flex flex-col h-full gap-0">
        <div className="flex-1">
          <span className="font-mono text-xs text-gray-400">
            {String(index + 1).padStart(2, "0")} / 03
          </span>
          <h3 className="mt-3 text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-base mb-6 leading-relaxed">
            {description}
          </p>
          <PillButton href={`${APP_ORIGIN}/signup`} variant="light" size="sm" className="mb-6">
            {cta}
          </PillButton>
        </div>
        {children}
      </Card>
    </Reveal>
  );
}

export default function ProblemSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-20 sm:py-32 bg-gray-50">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="The problem"
          title={
            <>
              Managing a club is <span className="text-gray-400">difficult</span>
            </>
          }
          description="Every club leader knows the struggle of managing multiple tools and keeping everyone connected."
        />

        <MobileCarousel label="Club management problems">
          <ProblemCard
            index={0}
            title="Too many softwares"
            description="Running a club requires juggling multiple tools with scattered logins and details across different platforms."
            cta="Explore our solution"
          >
            <div className="space-y-3 -mx-6 sm:-mx-8 mb-2 sm:mb-6 mt-auto overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              {[appLogos.slice(0, 5), appLogos.slice(5, 9)].map((row, r) => (
                <div key={r} className="overflow-hidden">
                  <div
                    className={`flex gap-3 px-6 sm:px-8 ${r === 0 ? "cp-marquee-right" : "cp-marquee-left"}`}
                  >
                    {[...row, ...row].map((app, idx) => (
                      <div
                        key={`${app.name}-${idx}`}
                        className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0"
                      >
                        <Image
                          src={app.src}
                          alt={idx < row.length ? app.name : ""}
                          fill
                          sizes="80px"
                          className="object-contain rounded-2xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ProblemCard>

          <ProblemCard
            index={1}
            title="No club analytics"
            description="Clubs struggle to understand performance, member engagement, and growth without clear data."
            cta="Get better analytics"
          >
            <div className="-mx-6 sm:-mx-8 mt-auto pt-4 sm:pt-6 pb-2 sm:pb-6">
              <div className="flex items-end justify-center gap-2 h-40 sm:h-48">
                {BARS.map((bar, i) => (
                  <motion.div
                    key={i}
                    className={`w-6 sm:w-8 rounded-t-md transition-colors duration-500 ${
                      i === 5
                        ? "bg-[#0054f9]"
                        : "bg-gray-200 group-hover:bg-blue-100"
                    }`}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : { height: bar.wobble.map((v) => `${v}%`) }
                    }
                    transition={{
                      duration: bar.d,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: bar.delay,
                    }}
                    style={{ height: `${bar.h}%` }}
                  />
                ))}
              </div>
            </div>
          </ProblemCard>

          <ProblemCard
            index={2}
            title="Communication chaos"
            description="Keeping members informed and aligned across multiple channels is messy and time-consuming."
            cta="Consolidate the chaos"
          >
            <div className="relative -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 h-[280px] sm:h-[320px] mt-auto">
              <NotificationAnimation />
            </div>
          </ProblemCard>
        </MobileCarousel>
      </div>
    </section>
  );
}
