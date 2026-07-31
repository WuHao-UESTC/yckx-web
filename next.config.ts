import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.120",
    "192.168.1.100",
    "localhost",
  ],
  serverExternalPackages: ["bcrypt"],
};

export default nextConfig;
