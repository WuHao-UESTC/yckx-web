import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createUrlSlug } from "@/lib/url-slug";
import { createCategoryFormSchema, resourceIdSchema } from "@/modules/admin/admin.schemas";
import { requireAdmin } from "@/server/auth/guards";
import { parseFormData } from "@/server/http/validation";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  async function createCategory(formData: FormData) {
    "use server";
    await requireAdmin();
    const input = parseFormData(formData, createCategoryFormSchema);
    const slug = createUrlSlug(input.name);
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: input.name, slug, type: input.type },
    });
    revalidatePath("/admin/categories");
  }

  async function deleteCategory(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = resourceIdSchema.parse(formData.get("id"));
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
  }

  const typeLabels: Record<string, string> = {
    KNOWLEDGE: "知识",
    COMPETITION: "竞赛",
    EVENT: "事件",
    COLUMN: "专栏",
    ROUTINE: "日常",
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">分类管理</h1>

      {/* 新建分类 */}
      <form action={createCategory} className="card mb-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            名称
          </label>
          <input name="name" className="input-field w-40" required placeholder="新分类名" />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            类型
          </label>
          <select name="type" className="input-field">
            <option value="KNOWLEDGE">知识</option>
            <option value="COMPETITION">竞赛</option>
            <option value="EVENT">事件</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">
          添加分类
        </button>
      </form>

      {/* 分类列表 */}
      <div className="space-y-2">
        {Object.entries(
          categories.reduce(
            (acc, c) => {
              if (!acc[c.type]) acc[c.type] = [];
              acc[c.type].push(c);
              return acc;
            },
            {} as Record<string, typeof categories>
          )
        ).map(([type, cats]) => (
          <div key={type} className="mb-6">
            <h2 className="text-sm font-bold text-[#6b6b6b] uppercase mb-2 font-[family-name:var(--font-sans)]">
              {typeLabels[type] || type}
            </h2>
            {cats.map((cat) => (
              <div key={cat.id} className="card flex items-center justify-between mb-1">
                <div>
                  <span className="font-bold text-[#1a1a1a]">{cat.name}</span>
                  <span className="text-xs text-[#6b6b6b] ml-2 font-[family-name:var(--font-sans)]">
                    {cat._count.posts} 篇
                  </span>
                </div>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-700 font-[family-name:var(--font-sans)]"
                  >
                    删除
                  </button>
                </form>
              </div>
            ))}
          </div>
        ))}
        {categories.length === 0 && <p className="text-[#6b6b6b]">暂无分类。</p>}
      </div>
    </div>
  );
}
