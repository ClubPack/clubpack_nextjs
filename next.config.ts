import path from "node:path"
import type { NextConfig } from "next"

const appDir = path.resolve(__dirname)

const nextConfig: NextConfig = {
  outputFileTracingRoot: appDir,
  turbopack: {
    root: appDir,
  },
  experimental: {
    // Logo / cover photo uploads go through server actions (images are capped at 10 MB).
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  images: {
    // Supabase Storage public URLs (org-media, avatars).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
}

export default nextConfig
