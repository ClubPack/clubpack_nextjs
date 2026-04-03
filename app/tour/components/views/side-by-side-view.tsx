"use client";

import { motion } from "framer-motion";
import { AdminShell } from "@/app/(admin)/components/admin-shell";
import { HomeClient } from "@/app/(admin)/home/home-client";
import { useTour } from "../../context/tour-context";
import {
  tourAdminStats,
  tourRecentActivity,
  tourInviteUrl,
} from "../../mock-data";
import { ClubSiteContent } from "./club-site-content";

export default function SideBySideView() {
  const { tourSubdomain } = useTour();
  const displaySubdomain = tourSubdomain.trim() || "outdoor-adventure-club";
  const clubSiteUrl = `${displaySubdomain}.joinclubpack.com`;

  return (
    <motion.div
      className="flex min-h-dvh w-full items-center justify-center gap-6 bg-muted/30 p-6 md:flex-row md:gap-8 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="w-full max-w-[480px] flex-1 shrink-0 aspect-[4/3] md:max-w-[42%]"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="rounded-md bg-background px-3 py-1 text-xs text-muted-foreground font-mono">
                https://{clubSiteUrl}
              </span>
            </div>
            <div className="w-[52px]" aria-hidden />
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-background">
            <div className="scale-[0.5] origin-top-left w-[200%] min-h-[200%] md:scale-[0.55] md:w-[181.8%] md:min-h-[181.8%]">
              <ClubSiteContent />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="w-full max-w-[480px] flex-1 shrink-0 aspect-[4/3] md:max-w-[42%]"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
      >
        <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="rounded-md bg-background px-3 py-1 text-xs text-muted-foreground font-mono">
                https://my.joinclubpack.com
              </span>
            </div>
            <div className="w-[52px]" aria-hidden />
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-background">
            <div className="scale-[0.5] origin-top-left w-[200%] min-h-[200%] md:scale-[0.55] md:w-[181.8%] md:min-h-[181.8%]">
              <AdminShell
                user={{ name: "Demo User", role: "Admin" }}
                memberCount={478}
                titleOverride="Dashboard"
                hideMemberLimitBanner
              >
                <HomeClient
                  stats={tourAdminStats}
                  recentActivity={tourRecentActivity}
                  inviteUrl={tourInviteUrl}
                />
              </AdminShell>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
