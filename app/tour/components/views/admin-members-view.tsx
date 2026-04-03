"use client";

import { motion } from "framer-motion";
import { AdminShell } from "@/app/(admin)/components/admin-shell";
import { MembersClient } from "@/app/(admin)/members/members-client";
import { tourAdminMembers, tourInviteUrl } from "../../mock-data";

export default function AdminMembersView() {
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
        titleOverride="Members"
        sidebarActivePath="/members"
        hideMemberLimitBanner
      >
        <MembersClient
          members={tourAdminMembers}
          inviteUrl={tourInviteUrl}
          newMembersThisMonth={52}
          adminCount={3}
          totalMembers={478}
        />
      </AdminShell>
    </motion.div>
  );
}
