"use client";

import { motion } from "framer-motion";
import { AdminShell } from "@/app/(admin)/components/admin-shell";
import { EventsClient } from "@/app/(admin)/events/events-client";
import { tourAdminEvents } from "../../mock-data";

export default function AdminEventsView() {
  return (
    <motion.div
      className="min-h-dvh w-full overflow-auto bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AdminShell
        user={{ name: "Demo User", role: "Admin" }}
        memberCount={478}
        titleOverride="Events"
        sidebarActivePath="/events"
        hideMemberLimitBanner
      >
        <EventsClient events={tourAdminEvents} />
      </AdminShell>
    </motion.div>
  );
}
