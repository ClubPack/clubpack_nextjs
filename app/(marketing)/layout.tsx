import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./marketing.css";
import AnnouncementBanner from "./components/AnnouncementBanner";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_ROOT_DOMAIN === "localhost"
      ? "http://localhost:3000"
      : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "joinclubpack.com"}`,
  ),
  title: {
    default: "ClubPack",
    template: "%s | ClubPack",
  },
  description: "The all-in-one platform for modern social clubs.",
  icons: { icon: "/clubpack-logo-site.png" },
  openGraph: {
    type: "website",
    siteName: "ClubPack",
    title: "ClubPack — The platform for modern clubs",
    description:
      "Build your club website, manage members, and plan events all in one platform.",
    images: [{ url: "/clubpack-logo-site.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "ClubPack — The platform for modern clubs",
    description:
      "Build your club website, manage members, and plan events all in one platform.",
    images: ["/clubpack-logo-site.png"],
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

