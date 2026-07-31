import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.120",
    "192.168.1.100",
    "localhost",
  ],
  serverExternalPackages: ["bcrypt", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
