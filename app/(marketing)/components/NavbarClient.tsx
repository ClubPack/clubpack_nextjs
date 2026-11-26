"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { APP_ORIGIN } from "@/lib/constants";

function HamburgerIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavLinks() {
  const pathname = usePathname();

  const navLinkClass = (href: string) => {
    const active = pathname === href;
    return `text-sm px-4 py-2 rounded-full transition-colors focus:outline-none ${
      active ? "text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
    }`;
  };

  return (
    <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
      <Link href="/features" className={navLinkClass("/features")}>
        Features
      </Link>
      <Link href="/blog" className={navLinkClass("/blog")}>
        Blog
      </Link>
      <Link href="/pricing" className={navLinkClass("/pricing")}>
        Pricing
      </Link>
      <Link href="/sponsors" className={navLinkClass("/sponsors")}>
        Sponsors
      </Link>
    </div>
  );
}

export function MobileMenu() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  // Close the menu whenever the route changes (e.g. back/forward navigation).
  if (mobileOpen && openedAt !== pathname) {
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    // Close if the viewport grows past the md breakpoint while open.
    const mql = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    mql.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      mql.removeEventListener("change", onBreakpoint);
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className="md:hidden p-2 text-white hover:bg-gray-800 rounded-lg transition-colors focus:outline-none"
        onClick={() => {
          setOpenedAt(pathname);
          setMobileOpen((v) => !v);
        }}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        aria-controls="marketing-mobile-menu"
      >
        <HamburgerIcon open={mobileOpen} />
      </button>

      {mobileOpen && (
        <>
        <div
          className="absolute top-full left-0 right-0 h-dvh bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <div
          id="marketing-mobile-menu"
          className="absolute top-full left-0 right-0 md:hidden bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 max-h-[calc(100dvh-4rem)] overflow-y-auto"
        >
          <div className="max-w-[1440px] mx-auto pt-2 pb-4 px-6 space-y-1">
            <Link
              href="/features"
              className="block px-3 py-3 text-base font-medium text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="block px-3 py-3 text-base font-medium text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/sponsors"
              className="block px-3 py-3 text-base font-medium text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              For Sponsors
            </Link>
            <Link
              href="/blog"
              className="block px-3 py-3 text-base font-medium text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Blog
            </Link>
            <div className="pt-4 space-y-2">
              <Button
                asChild
                variant="ghost"
                className="w-full justify-center text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-full text-sm transition-colors"
              >
                <a
                  href={`${APP_ORIGIN}/login`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </a>
              </Button>
              <Button
                asChild
                className="w-full bg-[#0054f9] hover:bg-[#0040d6] text-white px-4 py-2 rounded-full text-sm"
              >
                <a
                  href={`${APP_ORIGIN}/signup`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                >
                  Start Building Free
                </a>
              </Button>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
}
