import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for database seeding`);
  return value;
}

async function main() {
  console.log("🌱 开始种子数据...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@yckx.edu";
  const adminUsername = process.env.SEED_ADMIN_USERNAME?.trim() || "admin";
  const adminPasswordValue = requiredEnv("SEED_ADMIN_PASSWORD");
  const inviteCode = requiredEnv("SEED_INVITE_CODE");

  if (adminPasswordValue === "admin123456" || adminPasswordValue.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be at least 12 characters and not use the old default"
    );
  }

  const adminPassword = await hash(adminPasswordValue, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: adminUsername,
      displayName: "管理员",
      passwordHash: adminPassword,
      role: "ADMIN",
      profile: {
        create: { title: "科协管理员" },
      },
    },
  });
  console.log(`  ✓ 管理员: ${adminEmail}`);

  await prisma.invitation.upsert({
    where: { code: inviteCode },
    update: {},
    create: {
      code: inviteCode,
      maxUses: 50,
      createdBy: admin.id,
    },
  });
  console.log("  ✓ 初始邀请码已创建");

  // 创建知识类分类
  const knowledgeCategories = [
    { name: "未分类", slug: "uncategorized", type: "KNOWLEDGE" as const },
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

  await prisma.category.upsert({
    where: { slug: "news" },
    update: { name: "科协新闻", type: "NEWS" },
    create: { name: "科协新闻", slug: "news", type: "NEWS" },
  });
  console.log("  ✓ 科协新闻分类");

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
