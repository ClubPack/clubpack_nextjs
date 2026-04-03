import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_ORIGIN } from "@/lib/constants";
import HeroImageToggle from "./HeroImageToggle";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white min-h-screen flex items-center pt-32 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-[520px] h-[520px] bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[520px] h-[520px] bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
      </div>

      <div className="max-w-[1280px] mx-auto px-8 sm:px-12 lg:px-16 w-full relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-gray-900 mb-8 tracking-tight leading-[1.05]">
            The platform for
            <br />
            modern clubs
          </h1>

          <p className="text-lg sm:text-xl md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Build your club website, manage members, and plan events all in one
            platform.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button
              asChild
              className="h-auto bg-[#0054f9] hover:bg-[#0040d6] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:ring-blue-500/50"
            >
              <a
                href={`${APP_ORIGIN}/signup`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Start Building Free
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            >
              <Link href="/tour">Take a tour</Link>
            </Button>
          </div>
        </div>

        <HeroImageToggle />
      </div>
    </section>
  );
}
