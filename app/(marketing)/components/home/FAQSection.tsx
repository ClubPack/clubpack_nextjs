import FaqList, { type Faq } from "../FaqList";

const faqs: Faq[] = [
  {
    question: "How do I get started with ClubPack?",
    answer:
      "Sign up, name your club, and your website is live in about three minutes. From there you can invite members, create events, and customize your site from the admin dashboard.",
  },
  {
    question: "Do I need a website already?",
    answer:
      "No. Every club gets a professionally designed website on signup, with events, member sign-up, and contact pages built in. You can edit the content any time.",
  },
  {
    question: "Can I manage events and RSVPs?",
    answer:
      "Yes. Create events in seconds, share them on your club site, and track RSVPs and attendance from one place.",
  },
  {
    question: "How do I communicate with my members?",
    answer:
      "Use the built-in messages tool to reach your whole club or specific groups without juggling spreadsheets and group chats.",
  },
  {
    question: "Does ClubPack support waivers?",
    answer:
      "Yes. You can collect waivers from members digitally so you always know who has signed before they show up.",
  },
  {
    question: "What kind of analytics do I get?",
    answer:
      "Track member growth, event RSVPs, and engagement over time so you can see what is working and make decisions that grow your community.",
  },
];

export default function FAQSection() {
  return (
    <FaqList
      faqs={faqs}
      title="Frequently asked questions"
      description="Answers to the most common questions about running your club with ClubPack."
    />
  );
}
