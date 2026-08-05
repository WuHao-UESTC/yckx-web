import { revalidatePath } from "next/cache";
import { CalendarClock, Plus, Save, Trash2 } from "lucide-react";
import {
  milestoneFormSchema,
  resourceIdSchema,
  updateMilestoneFormSchema,
} from "@/modules/admin/admin.schemas";
import {
  createMilestone as createMilestoneRecord,
  deleteMilestone as deleteMilestoneRecord,
  findMilestones,
  updateMilestone as updateMilestoneRecord,
} from "@/modules/milestones/server/milestone-service";
import { requireAdmin } from "@/server/auth/guards";
import { parseFormData } from "@/server/http/validation";

function refreshMilestones() {
  revalidatePath("/");
  revalidatePath("/admin/milestones");
}

function dateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function AdminMilestonesPage() {
  await requireAdmin();
  const milestones = await findMilestones();

  async function createMilestone(formData: FormData) {
    "use server";
    await requireAdmin();
    const input = parseFormData(formData, milestoneFormSchema);
    await createMilestoneRecord(input);
    refreshMilestones();
  }

  async function updateMilestone(formData: FormData) {
    "use server";
    await requireAdmin();
    const { id, ...input } = parseFormData(formData, updateMilestoneFormSchema);
    await updateMilestoneRecord(id, input);
    refreshMilestones();
  }

  async function deleteMilestone(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = resourceIdSchema.parse(formData.get("id"));
    await deleteMilestoneRecord(id);
    refreshMilestones();
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex items-center gap-3">
        <CalendarClock className="text-[#0b6d9b]" size={24} aria-hidden="true" />
        <div>
          <h1 className="m-0 text-2xl font-bold text-[#1a1a1a]">大事记编辑</h1>
          <p className="m-0 text-sm text-[#6b6b6b]">记录会按时间排序并显示在 900m 时间回声中。</p>
        </div>
      </div>

      <form action={createMilestone} className="card mb-8 grid gap-4 md:grid-cols-[160px_1fr_auto]">
        <label className="text-sm text-[#4f6678]">
          时间
          <input name="occurredAt" type="date" required className="input-field mt-1 w-full" />
        </label>
        <label className="text-sm text-[#4f6678]">
          标题
          <input
            name="title"
            required
            maxLength={120}
            className="input-field mt-1 w-full"
            placeholder="大事记标题"
          />
        </label>
        <button type="submit" className="btn-primary self-end gap-2">
          <Plus size={16} aria-hidden="true" />
          新增
        </button>
        <label className="text-sm text-[#4f6678] md:col-span-3">
          描述
          <textarea
            name="description"
            required
            maxLength={500}
            rows={3}
            className="input-field mt-1 w-full resize-y"
            placeholder="用一段简短文字说明这次节点。"
          />
        </label>
      </form>

      <div className="space-y-3" aria-label="大事记列表">
        {milestones.map((milestone) => (
          <article key={milestone.id} className="card">
            <form action={updateMilestone} className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
              <input type="hidden" name="id" value={milestone.id} />
              <label className="text-sm text-[#4f6678]">
                时间
                <input
                  name="occurredAt"
                  type="date"
                  required
                  defaultValue={dateInputValue(milestone.occurredAt)}
                  className="input-field mt-1 w-full"
                />
              </label>
              <label className="text-sm text-[#4f6678]">
                标题
                <input
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={milestone.title}
                  className="input-field mt-1 w-full"
                />
              </label>
              <button type="submit" className="btn-primary self-end gap-2">
                <Save size={15} aria-hidden="true" />
                保存
              </button>
              <label className="text-sm text-[#4f6678] md:col-span-2">
                描述
                <textarea
                  name="description"
                  required
                  maxLength={500}
                  rows={2}
                  defaultValue={milestone.description}
                  className="input-field mt-1 w-full resize-y"
                />
              </label>
            </form>
            <form
              action={deleteMilestone}
              className="mt-3 flex justify-end border-t border-[#d7e4ea] pt-3"
            >
              <input type="hidden" name="id" value={milestone.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
              >
                <Trash2 size={15} aria-hidden="true" />
                删除
              </button>
            </form>
          </article>
        ))}
        {milestones.length === 0 && (
          <p className="rounded-md border border-dashed border-[#b9d1dc] px-5 py-8 text-center text-sm text-[#60788d]">
            暂无大事记，请先添加第一条时间记录。
          </p>
        )}
      </div>
    </div>
  );
}
