"use client";

import { motion } from "framer-motion";
import { AdminShell } from "@/app/(admin)/components/admin-shell";
import { HomeClient } from "@/app/(admin)/home/home-client";
import {
  tourAdminStats,
  tourRecentActivity,
  tourInviteUrl,
} from "../../mock-data";

export default function AdminDashboardView() {
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
        titleOverride="Dashboard"
        sidebarActivePath="/home"
        hideMemberLimitBanner
      >
        <HomeClient
          stats={tourAdminStats}
          recentActivity={tourRecentActivity}
          inviteUrl={tourInviteUrl}
        />
      </AdminShell>
    </motion.div>
  );
}
