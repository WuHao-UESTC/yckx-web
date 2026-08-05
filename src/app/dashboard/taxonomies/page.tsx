import { prisma } from "@/lib/prisma";
import { TaxonomyManager } from "@/modules/taxonomies/components/taxonomy-manager";
import { requireUser } from "@/server/auth/guards";

export default async function DashboardTaxonomiesPage() {
  const user = await requireUser();
  const [categories, columns] = await Promise.all([
    prisma.category.findMany({
      where: { type: { in: ["KNOWLEDGE", "COMPETITION"] } },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        isActive: true,
        createdById: true,
        _count: { select: { posts: true } },
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.column.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        categoryId: true,
        isActive: true,
        createdById: true,
        _count: {
          select: { posts: true, technicalPosts: true, newsPosts: true, dailyPosts: true },
        },
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
        postCount:
          column.type === "TECHNICAL"
            ? _count.technicalPosts
            : column.type === "NEWS"
              ? _count.newsPosts
              : _count.dailyPosts,
      }))}
      currentUser={{ id: user.id, role: user.role }}
    />
  );
}
