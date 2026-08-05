import { prisma } from "@/lib/prisma";
import { listSubscriptions } from "@/modules/subscriptions/server/subscription-service";
import { SubscriptionManager } from "@/modules/subscriptions/components/subscription-manager";
import { requireGuest } from "@/server/auth/guards";

export default async function GuestSubscriptionsPage() {
  const user = await requireGuest();
  const [subscriptions, categories, columns] = await Promise.all([
    listSubscriptions(user.id),
    prisma.category.findMany({
      where: { isActive: true, type: { in: ["KNOWLEDGE", "COMPETITION", "NEWS"] } },
      select: { id: true, name: true, type: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.column.findMany({
      where: { isActive: true, type: { in: ["TECHNICAL", "NEWS"] } },
      select: { id: true, title: true, type: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const options = [
    ...categories.map((item) => ({
      id: item.id,
      label: `分类：${item.name}`,
      targetType: "CATEGORY" as const,
      type: item.type,
    })),
    ...columns.map((item) => ({
      id: item.id,
      label: `专栏：${item.title}`,
      targetType: "COLUMN" as const,
      type: item.type,
    })),
  ];
  return (
    <div className="max-w-3xl">
      <header className="workspace-panel-heading mb-6">
        <span>SUBSCRIPTION CONTROL</span>
        <h1>我的订阅</h1>
        <p>订阅整站、分类或专栏。知识库、竞赛和新闻发布后会立即发送邮件提醒。</p>
      </header>
      <SubscriptionManager
        options={options}
        initial={subscriptions.map((item) => ({
          targetKey: item.targetKey,
          category: item.category,
          column: item.column,
        }))}
      />
    </div>
  );
}
