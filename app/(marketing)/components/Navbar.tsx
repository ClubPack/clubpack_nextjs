import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { APP_ORIGIN } from "@/lib/constants";
import { NavLinks, MobileMenu } from "./NavbarClient";

export default function Navbar() {
  return (
    <header className="w-full bg-black sticky top-0 z-50">
      <nav className="w-full relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="relative flex items-center justify-between h-14">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5 group">
                <Image
                  src="/clubpack-logos/clubpack-logo-large.svg"
                  alt="ClubPack"
                  width={120}
                  height={24}
                  className="h-6 w-auto brightness-0 invert"
                  priority
                />
              </Link>
            </div>

            <NavLinks />

            <div className="hidden md:flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-full text-sm transition-colors"
              >
                <a
                  href={`${APP_ORIGIN}/login`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Login
                </a>
              </Button>
              <Button
                asChild
                className="h-8 px-4 rounded-md text-sm text-white bg-[#0054f9] hover:bg-[#0040d6]"
              >
                <a
                  href={`${APP_ORIGIN}/signup`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Free
                </a>
              </Button>
            </div>

            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
