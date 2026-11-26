import HeroSection from "./components/home/HeroSection";
import TrustedClubsSection from "./components/home/TrustedClubsSection";
import ProblemSection from "./components/home/ProblemSection";
import SolutionSection from "./components/home/SolutionSection";
import FocusSection from "./components/home/FocusSection";
import HowItWorksSection from "./components/home/HowItWorksSection";
import FAQSection from "./components/home/FAQSection";

// Elliptical edges for the dark band, echoing a curved horizon.
const CURVE = "50% clamp(2.5rem, 6vw, 6rem)";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustedClubsSection />
      <ProblemSection />
      <SolutionSection />
      <div
        className="relative bg-gray-950 overflow-hidden"
        style={{
          borderTopLeftRadius: CURVE,
          borderTopRightRadius: CURVE,
          borderBottomLeftRadius: CURVE,
          borderBottomRightRadius: CURVE,
        }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#0054f9]/25 blur-[140px]"
          aria-hidden
        />
        <FocusSection />
        <HowItWorksSection />
      </div>
      <FAQSection />
    </>
  );
}
