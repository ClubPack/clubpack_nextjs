"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, LayoutGrid, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_ORIGIN } from "@/lib/constants";

const LINKS = [
  { href: "/features", label: "Features", icon: LayoutGrid },
  { href: "/pricing", label: "Pricing", icon: Tag },
  { href: "/blog", label: "Blog", icon: BookOpen },
];

/** Pill nav pinned to the bottom of the viewport once the header scrolls away. */
export default function FloatingDock() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >
        document.documentElement.scrollHeight - 200;
      setVisible(window.scrollY > 480 && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          aria-label="Quick navigation"
          initial={{ y: 80, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 80, opacity: 0, x: "-50%" }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-4 sm:bottom-6 left-1/2 z-50 flex items-center gap-1 rounded-full bg-gray-950/90 p-1.5 text-sm text-white/70 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur-xl"
        >
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 transition-colors hover:bg-white/10 hover:text-white",
                pathname === href && "bg-white/10 text-white",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </Link>
          ))}
          <a
            href={`${APP_ORIGIN}/signup`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 whitespace-nowrap rounded-full bg-[#0054f9] px-4 py-2 font-medium text-white transition-colors hover:bg-[#0040d6]"
          >
            Join free
          </a>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
