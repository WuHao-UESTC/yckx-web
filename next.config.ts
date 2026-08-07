import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.120", "192.168.1.100", "localhost"],

  // Next.js 16 Cache Components: public content is cached explicitly with `use cache`.
  cacheComponents: true,

  // Docker standalone 部署模式
  output: "standalone",

  // 图片优化
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    minimumCacheTTL: 86400,
  },

  // 安全头
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },

  serverExternalPackages: ["bcrypt", "@prisma/adapter-pg", "pg", "sharp"],
  reactStrictMode: false,
};

export default nextConfig;
