import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/modules/auth/server/invite-code";
import { revalidatePath } from "next/cache";
import { invitationFormSchema, resourceIdSchema } from "@/modules/admin/admin.schemas";
import { requireAdmin } from "@/server/auth/guards";
import { parseFormData } from "@/server/http/validation";

export default async function InvitationsPage() {
  await requireAdmin();
  const invitations = await prisma.invitation.findMany({
    include: { creator: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  async function createInvitation(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const input = parseFormData(formData, invitationFormSchema);
    const expiresAt = new Date(Date.now() + input.days * 86400000);
    const code = generateInviteCode();

    await prisma.invitation.create({
      data: {
        code,
        maxUses: input.maxUses,
        expiresAt,
        createdBy: user.id,
      },
    });
    revalidatePath("/admin/invitations");
  }

  async function toggleInvitation(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = resourceIdSchema.parse(formData.get("id"));
    const invitation = await prisma.invitation.findUniqueOrThrow({
      where: { id },
      select: { isActive: true },
    });
    await prisma.invitation.update({
      where: { id },
      data: { isActive: !invitation.isActive },
    });
    revalidatePath("/admin/invitations");
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">邀请码管理</h1>

      {/* 生成新邀请码 */}
      <form action={createInvitation} className="card mb-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            最大使用次数
          </label>
          <input
            name="maxUses"
            type="number"
            defaultValue={1}
            min={1}
            max={100}
            className="input-field w-24"
          />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            有效期（天）
          </label>
          <input
            name="days"
            type="number"
            defaultValue={30}
            min={1}
            max={365}
            className="input-field w-24"
          />
        </div>
        <button type="submit" className="btn-primary">
          生成邀请码
        </button>
      </form>

      {/* 邀请码列表 */}
      <div className="space-y-2">
        {invitations.map((inv) => (
          <div key={inv.id} className="card flex items-center justify-between flex-wrap gap-2">
            <div>
              <code className="text-sm font-mono">{inv.code}</code>
              <div className="text-xs text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
                已用 {inv.usedCount}/{inv.maxUses} · 创建者 {inv.creator.username} · 过期{" "}
                {inv.expiresAt?.toLocaleDateString("zh-CN") || "无"}
              </div>
            </div>
            <form action={toggleInvitation}>
              <input type="hidden" name="id" value={inv.id} />
              <input type="hidden" name="isActive" value={String(inv.isActive)} />
              <button
                type="submit"
                className={`text-xs px-3 py-1 rounded font-[family-name:var(--font-sans)] ${inv.isActive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
              >
                {inv.isActive ? "禁用" : "启用"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
