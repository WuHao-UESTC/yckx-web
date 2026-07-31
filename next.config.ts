import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.120",
    "192.168.1.100",
    "localhost",
  ],
  serverExternalPackages: ["bcrypt", "@prisma/adapter-pg", "pg"],
  // 关闭 StrictMode 以消除 React 19 开发模式下的 Performance 测量报错
  // 生产环境不受影响，该报错仅为开发环境已知问题
  reactStrictMode: false,
};

export default nextConfig;
