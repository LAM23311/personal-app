import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/personal-app",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
