import Image from "next/image";
import { CountUp } from "../motion";
import { CONTAINER } from "../primitives";

const CLUBS = [
  { name: "Drifters Club", logo: "/promo-logos/drifters-logo.svg" },
  { name: "Happy Mile", logo: "/promo-logos/happy-mile-logo.svg" },
  { name: "Plunge Club", logo: "/promo-logos/plunge-club-logo.svg" },
];

// Repeat enough times that one half of the track is wider than any viewport.
const TRACK = Array.from({ length: 4 }, () => CLUBS).flat();

export default function TrustedClubsSection() {
  return (
    <section className="bg-white pb-16 sm:pb-24">
      <div className={CONTAINER}>
        <div className="flex items-center gap-4 sm:gap-6 mb-10">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
          <p className="text-sm text-gray-500 whitespace-nowrap">
            Trusted by{" "}
            <CountUp to={100} suffix="+" className="font-semibold text-gray-900 tabular-nums" />{" "}
            clubs
          </p>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
        </div>
      </div>

      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max items-center cp-logo-marquee">
          {[...TRACK, ...TRACK].map((club, i) => (
            <div key={i} className="flex items-center justify-center px-10 sm:px-14">
              <Image
                src={club.logo}
                alt={i < CLUBS.length ? `${club.name} logo` : ""}
                aria-hidden={i >= CLUBS.length || undefined}
                width={200}
                height={48}
                className="h-9 sm:h-11 w-auto object-contain brightness-0 opacity-50 transition-opacity duration-300 hover:opacity-90"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
