import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseResourceIds, toggleTaxonomyFormSchema } from "@/modules/admin/admin.schemas";
import {
  AdminBatchCheckbox,
  AdminBatchToolbar,
} from "@/modules/admin/components/admin-batch-toolbar";
import { ConfirmDeleteButton } from "@/modules/admin/components/confirm-delete-button";
import { deleteAdminTaxonomies } from "@/modules/admin/server/admin-delete-service";
import {
  createMemberCategory,
  createMemberColumn,
  renameMemberCategory,
  renameMemberColumn,
} from "@/modules/taxonomies/server/taxonomy-service";
import {
  createCategorySchema,
  createColumnSchema,
  renameCategoryFormSchema,
  renameColumnFormSchema,
} from "@/modules/taxonomies/taxonomy.schemas";
import { requireAdmin } from "@/server/auth/guards";
import { parseFormData } from "@/server/http/validation";

const TYPE_LABELS: Record<string, string> = {
  KNOWLEDGE: "知识分类",
  COMPETITION: "竞赛类别",
  NEWS: "新闻专栏",
  DAILY: "日常专栏",
  TECHNICAL: "技术专栏",
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
        category: { select: { name: true } },
        _count: {
          select: { posts: true, technicalPosts: true, newsPosts: true, dailyPosts: true },
        },
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

  async function renameCategory(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const input = parseFormData(formData, renameCategoryFormSchema);
    await renameMemberCategory(input.slug, { name: input.name }, user);
    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/taxonomies");
    revalidatePath("/knowledge-base");
    revalidatePath("/competition");
  }

  async function renameColumn(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const input = parseFormData(formData, renameColumnFormSchema);
    await renameMemberColumn(input.slug, { title: input.title }, user);
    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/taxonomies");
    revalidatePath("/knowledge-base");
    revalidatePath("/competition");
    revalidatePath("/archive");
    revalidatePath("/routine");
  }

  async function deleteCategories(formData: FormData) {
    "use server";
    await requireAdmin();
    await deleteAdminTaxonomies("category", parseResourceIds(formData));
    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/taxonomies");
    revalidatePath("/");
    revalidatePath("/knowledge-base");
    revalidatePath("/competition");
    revalidatePath("/archive");
  }

  async function deleteColumns(formData: FormData) {
    "use server";
    await requireAdmin();
    await deleteAdminTaxonomies("column", parseResourceIds(formData));
    revalidatePath("/admin/categories");
    revalidatePath("/dashboard/taxonomies");
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
        <form action={createColumn}>
          <strong>新建技术专栏</strong>
          <input name="title" required maxLength={100} placeholder="专栏标题" />
          <input name="description" maxLength={300} placeholder="专栏说明，可选" />
          <input type="hidden" name="type" value="TECHNICAL" />
          <select name="categoryId" required>
            {categories
              .filter((category) => ["KNOWLEDGE", "COMPETITION"].includes(category.type))
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {TYPE_LABELS[category.type]} · {category.name}
                </option>
              ))}
          </select>
          <button type="submit" className="btn-primary">
            创建
          </button>
        </form>
      </div>

      <section className="admin-taxonomies__register" aria-labelledby="category-register-title">
        <h2 id="category-register-title">分类登记</h2>
        <AdminBatchToolbar
          action={deleteCategories}
          formId="admin-categories-batch-delete"
          group="admin-categories"
          itemCount={categories.length}
          noun="分类"
        />
        {categories.map((category) => (
          <div key={category.id}>
            <AdminBatchCheckbox
              formId="admin-categories-batch-delete"
              group="admin-categories"
              id={category.id}
              label={`选择分类：${category.name}`}
            />
            <span>{TYPE_LABELS[category.type] ?? category.type}</span>
            <strong>{category.name}</strong>
            <small>{category._count.posts} 篇</small>
            <small>
              {category.creator?.displayName ?? category.creator?.username ?? "系统记录"}
            </small>
            <div className="admin-taxonomies__actions">
              <form action={renameCategory} className="admin-taxonomies__rename">
                <input type="hidden" name="slug" value={category.slug} />
                <input name="name" defaultValue={category.name} required maxLength={80} />
                <button type="submit">改名</button>
              </form>
              <form action={toggleTaxonomy}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="resource" value="category" />
                <input type="hidden" name="isActive" value={String(!category.isActive)} />
                <button type="submit">{category.isActive ? "停用" : "恢复"}</button>
              </form>
              <form action={deleteCategories}>
                <input type="hidden" name="ids" value={category.id} />
                <ConfirmDeleteButton noun="分类" />
              </form>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-taxonomies__register" aria-labelledby="column-register-title">
        <h2 id="column-register-title">专栏登记</h2>
        <AdminBatchToolbar
          action={deleteColumns}
          formId="admin-columns-batch-delete"
          group="admin-columns"
          itemCount={columns.length}
          noun="专栏"
        />
        {columns.map((column) => (
          <div key={column.id}>
            <AdminBatchCheckbox
              formId="admin-columns-batch-delete"
              group="admin-columns"
              id={column.id}
              label={`选择专栏：${column.title}`}
            />
            <span>{TYPE_LABELS[column.type]}</span>
            <strong>{column.title}</strong>
            <small>
              {column.type === "TECHNICAL"
                ? column._count.technicalPosts
                : column.type === "NEWS"
                  ? column._count.newsPosts
                  : column._count.dailyPosts}{" "}
              篇
            </small>
            {column.category && <small>{column.category.name}</small>}
            <small>
              {column.creator?.displayName ??
                column.creator?.username ??
                admin.displayName ??
                admin.username}
            </small>
            <div className="admin-taxonomies__actions">
              <form action={renameColumn} className="admin-taxonomies__rename">
                <input type="hidden" name="slug" value={column.slug} />
                <input name="title" defaultValue={column.title} required maxLength={100} />
                <button type="submit">改名</button>
              </form>
              <form action={toggleTaxonomy}>
                <input type="hidden" name="id" value={column.id} />
                <input type="hidden" name="resource" value="column" />
                <input type="hidden" name="isActive" value={String(!column.isActive)} />
                <button type="submit">{column.isActive ? "停用" : "恢复"}</button>
              </form>
              <form action={deleteColumns}>
                <input type="hidden" name="ids" value={column.id} />
                <ConfirmDeleteButton noun="专栏" />
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
