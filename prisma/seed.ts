import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 开始种子数据...");

  // 创建管理员
  const adminPassword = await hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@yckx.edu" },
    update: {},
    create: {
      email: "admin@yckx.edu",
      username: "admin",
      displayName: "管理员",
      passwordHash: adminPassword,
      role: "ADMIN",
      profile: {
        create: { title: "科协管理员" },
      },
    },
  });
  console.log(`  ✓ 管理员: admin@yckx.edu / admin123456`);

  // 创建初始邀请码
  await prisma.invitation.upsert({
    where: { code: "YKX2025INITIAL00" },
    update: {},
    create: {
      code: "YKX2025INITIAL00",
      maxUses: 50,
      createdBy: admin.id,
    },
  });
  console.log(`  ✓ 初始邀请码: YKX2025INITIAL00 (可用50次)`);

  // 创建知识类分类
  const knowledgeCategories = [
    { name: "信号与系统", slug: "signals-and-systems", type: "KNOWLEDGE" as const },
    { name: "电子电路设计", slug: "circuit-design", type: "KNOWLEDGE" as const },
    { name: "射频电路设计", slug: "rf-design", type: "KNOWLEDGE" as const },
    { name: "嵌入式系统", slug: "embedded-systems", type: "KNOWLEDGE" as const },
    { name: "编程技术", slug: "programming", type: "KNOWLEDGE" as const },
    { name: "数学基础", slug: "mathematics", type: "KNOWLEDGE" as const },
  ];

  for (const cat of knowledgeCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✓ ${knowledgeCategories.length} 个知识分类`);

  // 创建竞赛类分类
  const competitionCategories = [
    { name: "电子设计竞赛", slug: "electronic-design-contest", type: "COMPETITION" as const },
    { name: "电赛-控制组", slug: "edc-control", type: "COMPETITION" as const },
    { name: "电赛-信号组", slug: "edc-signal", type: "COMPETITION" as const },
    { name: "集成电路创新创业大赛", slug: "ic-innovation", type: "COMPETITION" as const },
    { name: "嵌入式设计大赛", slug: "embedded-design", type: "COMPETITION" as const },
    { name: "物联网设计大赛", slug: "iot-design", type: "COMPETITION" as const },
  ];

  for (const cat of competitionCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✓ ${competitionCategories.length} 个竞赛分类`);

  console.log("✅ 种子数据完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
