import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 锁定 Turbopack 根目录，避免被上层目录的 lockfile 误判为工作区根。
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
