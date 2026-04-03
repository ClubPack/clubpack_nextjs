"use client";

import { motion } from "framer-motion";
import { AdminShell } from "@/app/(admin)/components/admin-shell";
import { WebsiteClient } from "@/app/(admin)/website/website-client";
import {
  tourWebsiteInitial,
  tourWebsiteSettings,
  tourWebsiteFaqs,
  tourRootDomain,
} from "../../mock-data";

export default function AdminWebsiteView() {
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
        titleOverride="Website & App"
        sidebarActivePath="/website"
        hideMemberLimitBanner
      >
        <WebsiteClient
          initial={tourWebsiteInitial}
          settings={tourWebsiteSettings}
          faqs={tourWebsiteFaqs}
          rootDomain={tourRootDomain}
        />
      </AdminShell>
    </motion.div>
  );
}
