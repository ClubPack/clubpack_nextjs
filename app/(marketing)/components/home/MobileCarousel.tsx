"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MobileCarouselProps = {
  children: ReactNode;
  /** Grid classes applied from `md` up, e.g. "md:grid-cols-2 lg:grid-cols-3". */
  gridClassName?: string;
  /** Accessible label for the slide group. */
  label: string;
};

/**
 * Below `md` the children render as a swipeable, snap-scrolling carousel with
 * a peek of the next card and dot navigation. From `md` up they fall back to
 * a regular CSS grid.
 */
export default function MobileCarousel({
  children,
  gridClassName = "md:grid-cols-2 lg:grid-cols-3",
  label,
}: MobileCarouselProps) {
  const slides = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const updateActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    Array.from(track.children).forEach((child, idx) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = idx;
      }
    });
    setActive(closest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Only a handful of slides, so measuring on every scroll event is cheap.
    track.addEventListener("scroll", updateActive, { passive: true });
    track.addEventListener("scrollend", updateActive);
    window.addEventListener("resize", updateActive);
    return () => {
      track.removeEventListener("scroll", updateActive);
      track.removeEventListener("scrollend", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [updateActive]);

  const scrollTo = (idx: number) => {
    const track = trackRef.current;
    const el = track?.children[idx] as HTMLElement | undefined;
    if (!track || !el) return;
    track.scrollTo({
      left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={trackRef}
        className={cn(
          // Mobile: horizontal snap scroller that bleeds to the screen edge.
          "flex gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain -mx-5 px-5 pb-2 scroll-px-5",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // sm: tablet portrait still scrolls, but with wider gutters.
          "sm:-mx-10 sm:px-10 sm:scroll-px-10",
          // md+: plain grid.
          "md:grid md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0 md:gap-6 lg:gap-8",
          gridClassName,
        )}
      >
        {slides.map((slide, idx) => (
          <div
            key={idx}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${slides.length}`}
            className="w-[86%] sm:w-[70%] shrink-0 snap-center flex md:w-auto"
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2 md:hidden">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={active === idx}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              active === idx ? "w-6 bg-gray-900" : "w-2 bg-gray-300",
            )}
          />
        ))}
      </div>
    </div>
  );
}
