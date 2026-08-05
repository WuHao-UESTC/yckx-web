import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toggleTaxonomyFormSchema } from "@/modules/admin/admin.schemas";
import {
  createMemberCategory,
  createMemberColumn,
} from "@/modules/taxonomies/server/taxonomy-service";
import { createCategorySchema, createColumnSchema } from "@/modules/taxonomies/taxonomy.schemas";
import { requireAdmin } from "@/server/auth/guards";
import { parseFormData } from "@/server/http/validation";

const TYPE_LABELS: Record<string, string> = {
  KNOWLEDGE: "知识分类",
  COMPETITION: "竞赛类别",
  NEWS: "新闻专栏",
  DAILY: "日常专栏",
  EVENT: "旧事件分类",
  ROUTINE: "旧日常分类",
  COLUMN: "旧专栏分类",
};

export default async function AdminCategoriesPage() {
  const admin = await requireAdmin();
  const [categories, columns] = await Promise.all([
    prisma.category.findMany({
      include: {
        creator: { select: { username: true, displayName: true } },
        _count: { select: { posts: true } },
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.column.findMany({
      include: {
        creator: { select: { username: true, displayName: true } },
        _count: { select: { posts: true } },
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  async function createCategory(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const input = parseFormData(formData, createCategorySchema);
    await createMemberCategory(input, user.id);
    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/taxonomies");
  }

  async function createColumn(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const input = parseFormData(formData, createColumnSchema);
    await createMemberColumn(input, user.id);
    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/taxonomies");
  }

  async function toggleTaxonomy(formData: FormData) {
    "use server";
    await requireAdmin();
    const input = parseFormData(formData, toggleTaxonomyFormSchema);
    if (input.resource === "category") {
      await prisma.category.update({ where: { id: input.id }, data: { isActive: input.isActive } });
    } else {
      await prisma.column.update({ where: { id: input.id }, data: { isActive: input.isActive } });
    }
    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/taxonomies");
    revalidatePath("/knowledge-base");
    revalidatePath("/competition");
    revalidatePath("/archive");
    revalidatePath("/routine");
  }

  return (
    <div className="admin-taxonomies">
      <header className="workspace-panel-heading">
        <span>GLOBAL INDEX GOVERNANCE</span>
        <h1>分类与专栏治理</h1>
        <p>成员负责创建，管理员负责停用、恢复和处理全站内容组织冲突。</p>
      </header>

      <div className="admin-taxonomies__create">
        <form action={createCategory}>
          <strong>新建技术分类</strong>
          <input name="name" required maxLength={80} placeholder="分类名称" />
          <select name="type">
            <option value="KNOWLEDGE">知识分类</option>
            <option value="COMPETITION">竞赛类别</option>
          </select>
          <button type="submit" className="btn-primary">
            创建
          </button>
        </form>
        <form action={createColumn}>
          <strong>新建专栏</strong>
          <input name="title" required maxLength={100} placeholder="专栏标题" />
          <input name="description" maxLength={300} placeholder="专栏说明，可选" />
          <select name="type">
            <option value="NEWS">新闻专栏</option>
            <option value="DAILY">日常专栏</option>
          </select>
          <button type="submit" className="btn-primary">
            创建
          </button>
        </form>
      </div>

      <section className="admin-taxonomies__register" aria-labelledby="category-register-title">
        <h2 id="category-register-title">分类登记</h2>
        {categories.map((category) => (
          <div key={category.id}>
            <span>{TYPE_LABELS[category.type] ?? category.type}</span>
            <strong>{category.name}</strong>
            <small>{category._count.posts} 篇</small>
            <small>
              {category.creator?.displayName ?? category.creator?.username ?? "系统记录"}
            </small>
            <form action={toggleTaxonomy}>
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="resource" value="category" />
              <input type="hidden" name="isActive" value={String(!category.isActive)} />
              <button type="submit">{category.isActive ? "停用" : "恢复"}</button>
            </form>
          </div>
        ))}
      </section>

      <section className="admin-taxonomies__register" aria-labelledby="column-register-title">
        <h2 id="column-register-title">专栏登记</h2>
        {columns.map((column) => (
          <div key={column.id}>
            <span>{TYPE_LABELS[column.type]}</span>
            <strong>{column.title}</strong>
            <small>{column._count.posts} 篇</small>
            <small>
              {column.creator?.displayName ??
                column.creator?.username ??
                admin.displayName ??
                admin.username}
            </small>
            <form action={toggleTaxonomy}>
              <input type="hidden" name="id" value={column.id} />
              <input type="hidden" name="resource" value="column" />
              <input type="hidden" name="isActive" value={String(!column.isActive)} />
              <button type="submit">{column.isActive ? "停用" : "恢复"}</button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
