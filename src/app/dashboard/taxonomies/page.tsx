import { prisma } from "@/lib/prisma";
import { TaxonomyManager } from "@/modules/taxonomies/components/taxonomy-manager";
import { requireUser } from "@/server/auth/guards";

export default async function DashboardTaxonomiesPage() {
  await requireUser();
  const [categories, columns] = await Promise.all([
    prisma.category.findMany({
      where: { type: { in: ["KNOWLEDGE", "COMPETITION"] } },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        _count: { select: { posts: true } },
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.column.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        isActive: true,
        _count: { select: { posts: true } },
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <TaxonomyManager
      categories={categories.map(({ _count, ...category }) => ({
        ...category,
        type: category.type as "KNOWLEDGE" | "COMPETITION",
        postCount: _count.posts,
      }))}
      columns={columns.map(({ _count, ...column }) => ({
        ...column,
        postCount: _count.posts,
      }))}
    />
  );
}
