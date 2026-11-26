import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, WordReveal } from "./motion";

export const CONTAINER = "max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-16 w-full";

/** Small mono uppercase label with a blue dot, used above section titles. */
export function Eyebrow({
  children,
  dark = false,
  className,
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em]",
        dark ? "text-white/50" : "text-gray-500",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[#0054f9]" aria-hidden />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "mb-10 sm:mb-16",
        align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-3xl",
        className,
      )}
    >
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.035em] leading-[1.02]",
          dark ? "text-white" : "text-gray-900",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 text-lg sm:text-xl leading-relaxed",
            dark ? "text-white/60" : "text-gray-600",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-[#0054f9] text-white hover:bg-[#0040d6] shadow-[0_8px_24px_-8px_rgba(0,84,249,0.6)]",
  dark: "bg-gray-950 text-white hover:bg-gray-800",
  light: "bg-white text-gray-900 ring-1 ring-gray-200 hover:ring-gray-300 hover:bg-gray-50",
  ghost: "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15",
} as const;

/** Rounded pill link with an arrow that nudges on hover. */
export function PillButton({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow = true,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  className?: string;
}) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const classes = cn(
    "group inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-300 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0054f9]/50",
    size === "sm" && "h-9 px-4 text-sm",
    size === "md" && "h-11 px-6 text-sm",
    size === "lg" && "h-13 px-8 text-base",
    BUTTON_VARIANTS[variant],
    className,
  );
  const content = (
    <>
      {children}
      {arrow && (
        <ArrowUpRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith("http") && {
          target: "_blank",
          rel: "noopener noreferrer",
        })}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

/** Screenshot wrapper with a minimal browser chrome. */
export function BrowserFrame({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden bg-white ring-1 ring-gray-900/5 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.25)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-gray-300" />
          <span className="size-2.5 rounded-full bg-gray-300" />
          <span className="size-2.5 rounded-full bg-gray-300" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-full bg-white px-3 py-1 text-center text-[11px] text-gray-500 ring-1 ring-gray-200 sm:text-xs">
          {url}
        </div>
        <span className="w-[42px]" aria-hidden />
      </div>
      {children}
    </figure>
  );
}

/** Shared top-of-page hero for secondary marketing pages. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  stickers,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  stickers?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-white pt-20 sm:pt-28 pb-16 sm:pb-24">
      <HeroGlow />
      <div className={cn(CONTAINER, "relative text-center")}>
        <div className="relative mx-auto max-w-4xl">
          {stickers && <div className="hidden md:block">{stickers}</div>}
          <Reveal y={12}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.045em] leading-[0.98] text-gray-900">
            <WordReveal text={title} delay={0.05} />
          </h1>
          <Reveal delay={0.25}>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          </Reveal>
          {children && (
            <Reveal delay={0.35} className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              {children}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

/** Soft blue radial glow + dotted grid used behind page heroes. */
export function HeroGlow() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(0,84,249,0.10),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
    </div>
  );
}
