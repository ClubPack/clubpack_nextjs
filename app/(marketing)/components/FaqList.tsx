import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./motion";
import { CONTAINER, Eyebrow, PillButton } from "./primitives";

export type Faq = { question: string; answer: string };

/** Two-column FAQ: sticky heading on the left, card-style accordion on the right. */
export default function FaqList({
  faqs,
  title = "Questions, answered",
  description,
  className = "bg-white",
}: {
  faqs: Faq[];
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={`py-20 sm:py-32 ${className}`}>
      <div className={CONTAINER}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-20">
          <Reveal className="lg:sticky lg:top-24 lg:self-start">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.035em] leading-[1.02] text-gray-900">
              {title}
            </h2>
            {description && (
              <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-md">
                {description}
              </p>
            )}
            <div className="mt-8">
              <PillButton href="mailto:hello@clubpack.com" variant="light">
                Still curious? Email us
              </PillButton>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Accordion
              type="single"
              collapsible
              defaultValue="item-0"
              className="space-y-3"
            >
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`item-${index}`}
                  className="rounded-2xl border-0 bg-gray-50 px-5 sm:px-7 ring-1 ring-gray-900/5 transition-colors data-[state=open]:bg-white data-[state=open]:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.25)]"
                >
                  <AccordionTrigger className="py-5 sm:py-6 text-left text-base sm:text-lg font-medium text-gray-900 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-gray-600 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
