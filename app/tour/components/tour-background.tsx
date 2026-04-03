"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

import { useTour } from "../context/tour-context";
import type { TourStepView } from "../tour-steps";
import { TourCreateClubForm } from "./tour-create-club-form";

const SideBySideView = dynamic(() => import("./views/side-by-side-view"));
const ClubFocusView = dynamic(() => import("./views/club-focus-view"));
const ClubEventsView = dynamic(() => import("./views/club-events-view"));
const AdminDashboardView = dynamic(() => import("./views/admin-dashboard-view"));
const AdminWebsiteView = dynamic(() => import("./views/admin-website-view"));
const AdminEventsView = dynamic(() => import("./views/admin-events-view"));
const AdminMembersView = dynamic(() => import("./views/admin-members-view"));

function WelcomeView() {
  return (
    <motion.div
      className="flex min-h-dvh w-full items-center justify-center bg-muted/30 p-6 md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
    </motion.div>
  );
}

function SignupView() {
  const { tourClubName, tourSubdomain, signupPhase, setTourClubName, goNext } = useTour();
  const interactive = signupPhase === "active";
  return (
    <motion.div
      className="flex min-h-dvh w-full items-center justify-center bg-muted/30 p-6 md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      >
        <TourCreateClubForm
          clubName={interactive ? tourClubName : ""}
          subdomain={interactive ? tourSubdomain : ""}
          interactive={interactive}
          onClubNameChange={setTourClubName}
          onContinue={goNext}
        />
      </motion.div>
    </motion.div>
  );
}

const viewMap: Record<TourStepView, () => React.ReactNode> = {
  welcome: () => <WelcomeView />,
  signup: () => <SignupView />,
  "side-by-side": () => <SideBySideView />,
  "club-focus": () => <ClubFocusView />,
  "admin-dashboard": () => <AdminDashboardView />,
  "club-events": () => <ClubEventsView />,
  "admin-website": () => <AdminWebsiteView />,
  "admin-events": () => <AdminEventsView />,
  "admin-members": () => <AdminMembersView />,
};

const ADMIN_VIEWS: TourStepView[] = ["admin-dashboard", "admin-website", "admin-events", "admin-members"];

function tourViewKey(view: TourStepView): string {
  return ADMIN_VIEWS.includes(view) ? "admin" : view;
}

export function TourBackground() {
  const { step } = useTour();
  const view = step?.view ?? "welcome";
  const RenderView = viewMap[view];
  const key = tourViewKey(view);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {RenderView()}
      </motion.div>
    </AnimatePresence>
  );
}
