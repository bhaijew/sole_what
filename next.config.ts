import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "bcryptjs"],
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
