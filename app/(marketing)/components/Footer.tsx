import Link from "next/link";
import Image from "next/image";
import { ArrowUp } from "lucide-react";
import { APP_ORIGIN } from "@/lib/constants";
import { Reveal, Sticker } from "./motion";
import { CONTAINER, PillButton } from "./primitives";

const COLUMNS = [
  {
    title: "Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sponsors", href: "/sponsors" },
      { label: "Contact", href: "/contact" },
      { label: "Dashboard", href: APP_ORIGIN },
      { label: "Login", href: `${APP_ORIGIN}/login` },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "Instagram", href: "#" },
      { label: "X", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  const className =
    "text-lg font-medium text-gray-900 transition-colors duration-200 hover:text-[#0054f9]";
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-white">
      {/* Giant call to action */}
      <div className="relative pt-24 sm:pt-36 pb-12 sm:pb-20">
        <div className="relative mx-auto max-w-[1440px] px-5">
          <div className="hidden sm:block">
            <Sticker className="left-[6%] -top-6" rotate={-9} delay={0.2}>
              Free to start
            </Sticker>
            <Sticker className="right-[8%] -top-10" shape="circle" tone="white" rotate={10} delay={0.3}>
              <span aria-hidden>🎉</span>
            </Sticker>
            <Sticker className="right-[18%] bottom-0" tone="black" rotate={6} delay={0.4}>
              Live in 3 mins ⚡
            </Sticker>
            <Sticker className="left-[14%] bottom-2" tone="sky" rotate={-4} delay={0.5}>
              No code needed
            </Sticker>
          </div>

          <Reveal>
            <a
              href={`${APP_ORIGIN}/signup`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block text-center"
            >
              <span className="block text-[17vw] lg:text-[14rem] font-semibold leading-[0.85] tracking-[-0.065em] text-gray-950 transition-colors duration-500 group-hover:text-[#0054f9]">
                Start your club
              </span>
            </a>
          </Reveal>
        </div>
      </div>

      {/* Link grid */}
      <div className={CONTAINER}>
        <div className="grid grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] border-t border-gray-200">
          <div className="col-span-2 lg:col-span-1 py-10 lg:pr-10 border-b lg:border-b-0 lg:border-r border-gray-200">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
              Start a club
            </p>
            <a
              href="mailto:hello@clubpack.com"
              className="mt-4 block text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 hover:text-[#0054f9] transition-colors"
            >
              hello@clubpack.com
            </a>
            <p className="mt-3 max-w-sm text-gray-500 leading-relaxed">
              The all-in-one platform for modern social clubs. Focus on your
              community, we&apos;ll handle the logistics.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <PillButton href={`${APP_ORIGIN}/signup`} size="sm">
                Join free
              </PillButton>
              <PillButton href="/pricing" variant="light" size="sm" arrow={false}>
                View pricing
              </PillButton>
            </div>
          </div>

          {COLUMNS.map((col, i) => (
            <div
              key={col.title}
              className={`py-10 lg:pl-10 ${i < COLUMNS.length - 1 ? "lg:border-r border-gray-200" : ""} ${i === 0 ? "pr-6" : ""}`}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 py-8">
          <Link href="/" aria-label="ClubPack home">
            <Image
              src="/clubpack-logos/clubpack-logo-large.svg"
              alt="ClubPack"
              width={120}
              height={24}
              className="h-6 w-auto"
            />
          </Link>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} ClubPack. Built for the modern club.
          </p>
          <a
            href="#"
            className="group inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Back to top
            <ArrowUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
