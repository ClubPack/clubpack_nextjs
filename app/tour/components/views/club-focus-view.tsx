"use client";

import { motion } from "framer-motion";
import { ClubSiteContent } from "./club-site-content";

export default function ClubFocusView() {
  return (
    <div className="min-h-dvh w-full overflow-auto bg-background">
      <motion.div
        initial={{ scale: 0.94, opacity: 0.85 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-dvh origin-top"
      >
        <ClubSiteContent />
      </motion.div>
    </div>
  );
}
