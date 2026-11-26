import { Check } from "lucide-react";
import { Reveal, Sticker } from "../components/motion";
import {
  CONTAINER,
  PageHero,
  PillButton,
  SectionHeading,
} from "../components/primitives";


export const metadata = {
  title: "For Sponsors",
};

export default function SponsorsPage() {
  const benefits = [
    {
      title: "Discover & Connect",
      description:
        "Browse active clubs across campuses and find the right partnerships for your brand.",
    },
    {
      title: "Everything in One Place",
      description:
        "Club details, performance signals, and outreach — centralized for faster sponsorship management.",
    },
    {
      title: "Verified Partnerships",
      description:
        "Lightweight agreements and clear expectations built in for secure, transparent deals.",
    },
  ];

  const features = [
    {
      title: "Access to 500+ Clubs",
      description:
        "Connect with student organizations across multiple campuses and demographics.",
      details: [
        "Browse by campus, size, and interests",
        "Detailed club profiles and member counts",
        "Contact info and social links",
      ],
    },
    {
      title: "Analytics & Insights",
      description:
        "Track campaign performance and get clear reporting on sponsorship ROI.",
      details: [
        "Campaign performance tracking",
        "ROI measurement and reporting",
        "Student engagement signals",
      ],
    },
    {
      title: "Streamlined Process",
      description:
        "From discovery to deal closure in minutes with a guided workflow.",
      details: [
        "Simple sponsorship offers",
        "Automated paperwork",
        "Payment processing support",
      ],
    },
    {
      title: "Secure & Compliant",
      description:
        "Enterprise-grade security with best practices for educational partnerships.",
      details: ["Privacy-first handling", "Encryption in transit", "Audit-friendly records"],
    },
  ];

  const testimonials = [
    {
      quote:
        "ClubPack made it incredibly easy to find and partner with student clubs. The platform is intuitive and the results exceeded our expectations.",
      author: "Sarah Chen",
      role: "Marketing Director",
      company: "TechStart Inc.",
    },
    {
      quote:
        "We've seen a big increase in student engagement since partnering with clubs through ClubPack. The platform is game-changing.",
      author: "Michael Rodriguez",
      role: "Brand Manager",
      company: "Campus Connect",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="For sponsors"
        title="Partner with social clubs nationwide"
        description="Discover, connect, and collaborate with clubs through ClubPack. Join as a verified sponsor and start partnering faster."
        stickers={
          <>
            <Sticker className="-left-8 top-6" rotate={-8}>
              500+ active clubs
            </Sticker>
            <Sticker className="-right-6 top-28" tone="black" rotate={7} delay={0.55}>
              Verified partners ✓
            </Sticker>
          </>
        }
      >
        <PillButton href="/contact" size="lg">
          Contact us
        </PillButton>
        <PillButton href="/contact" variant="light" size="lg" arrow={false}>
          Schedule demo
        </PillButton>
      </PageHero>

      <section className="py-20 sm:py-32 bg-gray-50">
        <div className={CONTAINER}>
          <SectionHeading
            eyebrow="Why ClubPack"
            title="Sponsorships without the spreadsheets"
            description="Streamline your sponsorship process with tools designed for brand-club partnerships."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {benefits.map((benefit, i) => (
              <Reveal key={benefit.title} delay={i * 0.08}>
                <div className="h-full rounded-[28px] bg-white p-7 sm:p-9 ring-1 ring-gray-900/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-24px_rgba(15,23,42,0.22)]">
                  <span className="font-mono text-xs text-gray-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-10 text-2xl font-semibold tracking-tight text-gray-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-white">
        <div className={CONTAINER}>
          <SectionHeading
            eyebrow="Powerful features"
            title="Everything you need to succeed"
            description="Discover, connect, and partner with student clubs effectively."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 2) * 0.08}>
                <div
                  className={`h-full rounded-[28px] p-7 sm:p-9 ${
                    i === 0
                      ? "bg-[#0054f9] text-white"
                      : i === 3
                        ? "bg-gray-950 text-white"
                        : "bg-gray-50 text-gray-900 ring-1 ring-gray-900/5"
                  }`}
                >
                  <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-relaxed opacity-70">
                    {feature.description}
                  </p>
                  <ul className="mt-8 space-y-3">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-3">
                        <Check className="size-4 shrink-0 opacity-70" strokeWidth={3} aria-hidden />
                        <span className="opacity-90">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 bg-gray-50">
        <div className={CONTAINER}>
          <SectionHeading eyebrow="Testimonials" title="What our sponsors say" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {testimonials.map((t, i) => (
              <Reveal key={t.author} delay={i * 0.08}>
                <figure className="flex h-full flex-col rounded-[28px] bg-white p-7 sm:p-10 ring-1 ring-gray-900/5">
                  <blockquote className="text-xl sm:text-2xl font-medium tracking-tight leading-snug text-gray-900">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-[#0054f9] font-semibold text-white">
                      {t.author.charAt(0)}
                    </span>
                    <span>
                      <span className="block font-semibold text-gray-900">{t.author}</span>
                      <span className="block text-sm text-gray-500">
                        {t.role}, {t.company}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 rounded-[28px] bg-gray-950 p-8 sm:p-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-white">
                  Ready to partner with clubs?
                </h2>
                <p className="mt-3 text-white/60">
                  No setup fees • Cancel anytime • 30-day money-back guarantee
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <PillButton href="/contact">Contact us</PillButton>
                <PillButton href="/contact" variant="ghost" arrow={false}>
                  Contact sales
                </PillButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
