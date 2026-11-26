"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollTilt } from "../motion";
import { BrowserFrame } from "../primitives";

const VIEWS = [
  {
    id: "dashboard",
    label: "Admin dashboard",
    url: "app.joinclubpack.com",
    src: "/second.png",
    alt: "Admin dashboard preview",
  },
  {
    id: "website",
    label: "Club website",
    url: "yourclub.joinclubpack.com",
    src: "/first.jpg",
    alt: "Club website preview",
  },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export default function HeroImageToggle() {
  const [active, setActive] = useState<ViewId>("dashboard");
  const current = VIEWS.find((v) => v.id === active)!;

  return (
    <div className="relative">
      <div className="flex justify-center mb-5 sm:mb-7">
        <div
          role="tablist"
          aria-label="Product preview"
          className="inline-flex rounded-full bg-gray-100 p-1 ring-1 ring-gray-200/70"
        >
          {VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={active === view.id}
              onClick={() => setActive(view.id)}
              className={cn(
                "relative rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-colors",
                active === view.id ? "text-white" : "text-gray-600 hover:text-gray-900",
              )}
            >
              {active === view.id && (
                <motion.span
                  layoutId="hero-tab"
                  className="absolute inset-0 rounded-full bg-gray-950"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ScrollTilt>
        <BrowserFrame url={current.url}>
          <div className="relative aspect-[4/3] sm:aspect-video bg-gray-100">
            {VIEWS.map((view, i) => (
              <Image
                key={view.id}
                src={view.src}
                alt={view.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 1440px) 100vw, 1440px"
                className={cn(
                  "object-cover object-left-top sm:object-center transition-all duration-700",
                  active === view.id ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]",
                )}
              />
            ))}
          </div>
        </BrowserFrame>
      </ScrollTilt>

      {/* Soft blue shadow under the product shot. */}
      <div
        className="pointer-events-none absolute -bottom-10 left-1/2 -z-10 h-40 w-3/4 -translate-x-1/2 rounded-full bg-[#0054f9]/20 blur-3xl"
        aria-hidden
      />
    </div>
  );
}
