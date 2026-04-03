"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const APP_ORIGIN = "https://my.joinclubpack.com";

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
    return `text-sm px-3 py-2 rounded-md transition-colors focus:outline-none ${
      active ? "text-gray-300" : "text-gray-400 hover:text-gray-300"
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
    </div>
  );
}

export function MobileMenu() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="md:hidden p-2 text-white hover:bg-gray-800 rounded-lg transition-colors focus:outline-none"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        <HamburgerIcon open={mobileOpen} />
      </button>

      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-gray-950/95 backdrop-blur-xl border-t border-gray-800">
          <div className="max-w-[1440px] mx-auto pt-2 pb-4 px-6 space-y-1">
            <Link
              href="/features"
              className="block px-3 py-2.5 text-sm font-medium text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="block px-3 py-2.5 text-sm font-medium text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/sponsors"
              className="block px-3 py-2.5 text-sm font-medium text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              For Sponsors
            </Link>
            <Link
              href="/blog"
              className="block px-3 py-2.5 text-sm font-medium text-white hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
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
                className="w-full bg-[#0054f9] hover:bg-[#0040d6] text-white px-4 py-2 rounded-md text-sm"
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
      )}
    </>
  );
}
