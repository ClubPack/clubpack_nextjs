"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Fades + lifts its children into place the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that slides each word up from behind a mask on mount. */
export function WordReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  // "\n" in the text forces a line break.
  const lines = text.split("\n");
  let index = 0;

  return (
    <span className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word) => {
            const i = index++;
            return (
              <span
                key={i}
                className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom"
              >
                <motion.span
                  className="inline-block"
                  initial={reduce ? false : { y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: delay + i * 0.06,
                    ease: EASE_OUT,
                  }}
                >
                  {word}
                  {" "}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

const STICKER_TONES = {
  blue: "bg-gradient-to-br from-[#4d86ff] to-[#0054f9] text-white shadow-[0_12px_30px_-10px_rgba(0,84,249,0.7)]",
  black: "bg-gray-950 text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]",
  white: "bg-white text-gray-900 ring-1 ring-gray-200 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)]",
  sky: "bg-gradient-to-br from-sky-100 to-blue-200 text-[#0040d6] shadow-[0_12px_30px_-12px_rgba(0,84,249,0.45)]",
} as const;

export type StickerTone = keyof typeof STICKER_TONES;

/**
 * A tilted, draggable badge that pops in and gently floats. Position it with
 * absolute utility classes via `className`.
 */
export function Sticker({
  children,
  className,
  tone = "blue",
  rotate = -8,
  delay = 0.4,
  shape = "pill",
}: {
  children: ReactNode;
  className?: string;
  tone?: StickerTone;
  rotate?: number;
  delay?: number;
  shape?: "pill" | "circle" | "burst";
}) {
  const reduce = useReducedMotion();

  const body =
    shape === "burst" ? (
      <div className="relative grid place-items-center size-24 sm:size-28">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full drop-shadow-[0_12px_20px_rgba(0,84,249,0.45)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="cp-burst" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4d86ff" />
              <stop offset="100%" stopColor="#0054f9" />
            </linearGradient>
          </defs>
          <polygon
            fill="url(#cp-burst)"
            points={burstPoints(14, 50, 50, 50, 41)}
          />
        </svg>
        <div className="relative text-center text-white leading-none">
          {children}
        </div>
      </div>
    ) : (
      <div
        className={cn(
          "whitespace-nowrap font-semibold",
          shape === "circle"
            ? "grid place-items-center size-14 sm:size-16 rounded-full text-2xl sm:text-3xl"
            : "rounded-full px-4 py-2 text-sm",
          STICKER_TONES[tone],
        )}
      >
        {children}
      </div>
    );

  return (
    <motion.div
      drag={!reduce}
      dragSnapToOrigin
      dragElastic={0.5}
      whileDrag={{ scale: 1.1, rotate: 0 }}
      whileHover={{ scale: 1.06 }}
      initial={reduce ? false : { opacity: 0, scale: 0.4, rotate: rotate - 25 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay }}
      className={cn(
        "absolute z-20 cursor-grab select-none active:cursor-grabbing",
        className,
      )}
    >
      <div className={cn(!reduce && "cp-float")}>{body}</div>
    </motion.div>
  );
}

function burstPoints(spikes: number, cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Paragraph whose words brighten one by one as it scrolls through the viewport. */
export function ScrollRevealText({
  text,
  className,
  dimOpacity = 0.18,
}: {
  text: string;
  className?: string;
  dimOpacity?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });
  const words = text.split(" ");

  if (reduce) return <p className={className}>{text}</p>;

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <ScrollWord
          key={i}
          progress={scrollYProgress}
          range={[i / words.length, (i + 1) / words.length]}
          dimOpacity={dimOpacity}
        >
          {word}
        </ScrollWord>
      ))}
    </p>
  );
}

function ScrollWord({
  children,
  progress,
  range,
  dimOpacity,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  dimOpacity: number;
}) {
  const opacity = useTransform(progress, range, [dimOpacity, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">
      {children}
    </motion.span>
  );
}

/** Counts up to `to` once it scrolls into view. */
export function CountUp({
  to,
  suffix = "",
  className,
}: {
  to: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: EASE_OUT,
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}

/** Tilts and scales its child flat as it scrolls into view (hero product shot). */
export function ScrollTilt({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.25"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  return (
    <div ref={ref} className={cn("[perspective:1600px]", className)}>
      <motion.div
        style={reduce ? undefined : { rotateX, scale, transformOrigin: "center top" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Moves its child vertically at a different speed than the page for depth. */
export function Parallax({
  children,
  className,
  distance = 60,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div
        style={reduce ? undefined : { y }}
        className="absolute inset-[-80px_0]"
      >
        {children}
      </motion.div>
    </div>
  );
}
