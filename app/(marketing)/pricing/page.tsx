import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import FaqList from "../components/FaqList";
import { Reveal, Sticker } from "../components/motion";
import { CONTAINER, PageHero, PillButton } from "../components/primitives";

export const metadata = {
  title: "Pricing",
};

import { APP_ORIGIN } from "@/lib/constants";

export default function PricingPage() {
  const plans = [
    {
      name: "FREE",
      price: "0",
      period: "month",
      features: [
        "Up to 50 members",
        "Club website",
        "Admin dashboard",
        "Basic event management",
        "Email support",
      ],
      description: "Perfect for clubs getting started with online presence",
      cta: "Get Started Free",
      href: `${APP_ORIGIN}/signup`,
      popular: false,
    },
    {
      name: "GROWTH",
      price: "4.99",
      period: "month",
      features: [
        "Up to 500 members",
        "Everything in Free",
        "Mobile app access",
        "Third-party integrations",
        "Advanced analytics",
      ],
      description: "Perfect for clubs ready to expand their reach",
      cta: "Subscribe",
      href: `${APP_ORIGIN}/signup`,
      popular: true,
    },
    {
      name: "PREMIUM",
      price: "29.99",
      period: "month",
      features: [
        "Unlimited members",
        "Everything in Growth",
        "Custom integrations",
        "AI-powered insights",
        "Priority support",
        "Custom domain",
        "API access",
        "White-label options",
      ],
      description: "For established clubs with advanced needs",
      cta: "Talk to Sales",
      href: "mailto:hello@clubpack.com?subject=ClubPack%20Premium",
      popular: false,
    },
  ] as const;

  const faqs = [
    {
      q: "Can I change plans later?",
      a: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we’ll prorate any billing differences.",
    },
    {
      q: "What happens if I exceed my member limit?",
      a: "We’ll notify you when you’re approaching your limit. You can upgrade your plan or we’ll work with you to find a fit.",
    },
    {
      q: "Do you offer discounts for annual billing?",
      a: "Yes. Annual billing saves you money, and we offer special discounts for student orgs and non-profits.",
    },
    {
      q: "Is there a setup fee?",
      a: "No setup fees ever. We include onboarding and training with all plans to help you start quickly.",
    },
    {
      q: "Can I cancel my subscription?",
      a: "Yes, you can cancel at any time. Your club stays active through the end of your billing period.",
    },
    {
      q: "Do you offer refunds?",
      a: "We offer a 30-day money-back guarantee on all paid plans.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        description="Start free, scale as you grow. No hidden fees, no long-term contracts."
        stickers={
          <>
            <Sticker className="-left-6 top-6" rotate={-8}>
              $0 to start
            </Sticker>
            <Sticker className="-right-4 top-24" tone="sky" rotate={7} delay={0.55}>
              Cancel anytime
            </Sticker>
          </>
        }
      >
        <div className="flex flex-wrap justify-center gap-2">
          {["No hidden fees", "30-day money back", "Cancel anytime"].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200"
            >
              <Check className="size-3.5 text-[#0054f9]" strokeWidth={3} aria-hidden />
              {item}
            </span>
          ))}
        </div>
      </PageHero>

      <section className="pb-20 sm:pb-32 bg-white">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 items-stretch">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.08} className="flex">
                <div
                  className={cn(
                    "relative flex w-full flex-col rounded-[28px] p-7 sm:p-9 transition-transform duration-500 hover:-translate-y-1",
                    plan.popular
                      ? "bg-gray-950 text-white shadow-[0_40px_80px_-30px_rgba(0,84,249,0.55)] lg:-my-4 lg:py-12"
                      : "bg-gray-50 text-gray-900 ring-1 ring-gray-900/5",
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-7 rotate-6 rounded-full bg-gradient-to-br from-[#4d86ff] to-[#0054f9] px-3 py-1 text-xs font-semibold text-white shadow-lg">
                      Most popular
                    </span>
                  )}

                  <p
                    className={cn(
                      "font-mono text-xs uppercase tracking-[0.2em]",
                      plan.popular ? "text-white/50" : "text-gray-500",
                    )}
                  >
                    {plan.name}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-6xl font-semibold tracking-[-0.04em]">
                      ${plan.price}
                    </span>
                    <span className={plan.popular ? "text-white/50" : "text-gray-500"}>
                      /{plan.period}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "mt-4 leading-relaxed",
                      plan.popular ? "text-white/60" : "text-gray-600",
                    )}
                  >
                    {plan.description}
                  </p>

                  <ul
                    className={cn(
                      "mt-8 space-y-3 border-t pt-8 mb-10",
                      plan.popular ? "border-white/10" : "border-gray-200",
                    )}
                  >
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                            plan.popular ? "bg-white text-gray-950" : "bg-[#0054f9] text-white",
                          )}
                        >
                          <Check className="size-3" strokeWidth={3} aria-hidden />
                        </span>
                        <span className={plan.popular ? "text-white/80" : "text-gray-700"}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <PillButton
                    href={plan.href}
                    variant={plan.popular ? "primary" : "dark"}
                    className="mt-auto w-full"
                  >
                    {plan.cta}
                  </PillButton>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FaqList
        className="bg-gray-50"
        faqs={faqs.map(({ q, a }) => ({ question: q, answer: a }))}
        description="Got questions? We've got answers."
      />
    </>
  );
}
