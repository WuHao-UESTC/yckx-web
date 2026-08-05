import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { compare } from "bcrypt";
import { changePasswordFormSchema, profileFormSchema } from "@/modules/users/profile.schemas";
import { hashPassword } from "@/modules/auth/server/password";
import { requireUser } from "@/server/auth/guards";
import { ForbiddenError } from "@/server/http/errors";
import { parseFormData } from "@/server/http/validation";

export default async function ProfilePage() {
  const currentUser = await requireUser();
  const userId = currentUser.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  async function updateProfile(formData: FormData) {
    "use server";
    const user = await requireUser();
    const input = parseFormData(formData, profileFormSchema);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: input.displayName,
        bio: input.bio,
        avatar: input.avatar,
        profile: {
          upsert: {
            create: {
              website: input.website,
              github: input.github,
              bilibili: input.bilibili,
              title: input.title,
            },
            update: {
              website: input.website,
              github: input.github,
              bilibili: input.bilibili,
              title: input.title,
            },
          },
        },
      },
    });
    revalidatePath("/dashboard/profile");
  }

  async function changePassword(formData: FormData) {
    "use server";
    const user = await requireUser();
    const input = parseFormData(formData, changePasswordFormSchema);

    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!u) return;

    const valid = await compare(input.oldPassword, u.passwordHash);
    if (!valid) throw new ForbiddenError("当前密码不正确");

    const newHash = await hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    revalidatePath("/dashboard/profile");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">个人资料</h1>

      {/* ── 基本信息 ── */}
      <form action={updateProfile} className="max-w-md space-y-4 mb-10">
        <h2 className="text-base font-bold text-[#1a1a1a] pb-2 border-b border-[#e8e0d5]">
          基本信息
        </h2>

        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            头像 URL
          </label>
          <input
            name="avatar"
            defaultValue={user.avatar ?? ""}
            className="input-field w-full"
            placeholder="https://..."
          />
          {user.avatar && (
            <div className="mt-2 w-16 h-16 rounded-full overflow-hidden bg-[#f5f0e8] border border-[#e8e0d5]">
              <img src={user.avatar} alt="头像预览" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            显示名称
          </label>
          <input
            name="displayName"
            defaultValue={user.displayName ?? ""}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            个性头衔
          </label>
          <input
            name="title"
            defaultValue={user.profile?.title ?? ""}
            className="input-field w-full"
            placeholder="e.g. 嵌入式爱好者"
          />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            个人简介
          </label>
          <textarea
            name="bio"
            defaultValue={user.bio ?? ""}
            rows={3}
            className="input-field w-full"
          />
        </div>

        <h2 className="text-base font-bold text-[#1a1a1a] pt-4 pb-2 border-b border-[#e8e0d5]">
          社交链接
        </h2>

        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            个人网站
          </label>
          <input
            name="website"
            defaultValue={user.profile?.website ?? ""}
            className="input-field w-full"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            GitHub 用户名
          </label>
          <input
            name="github"
            defaultValue={user.profile?.github ?? ""}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            B站 UID
          </label>
          <input
            name="bilibili"
            defaultValue={user.profile?.bilibili ?? ""}
            className="input-field w-full"
          />
        </div>

        <button type="submit" className="btn-primary">
          保存资料
        </button>
      </form>

      {/* ── 密码修改 ── */}
      <form action={changePassword} className="max-w-md space-y-4">
        <h2 className="text-base font-bold text-[#1a1a1a] pb-2 border-b border-[#e8e0d5]">
          修改密码
        </h2>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            当前密码
          </label>
          <input name="oldPassword" type="password" className="input-field w-full" required />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            新密码
          </label>
          <input
            name="newPassword"
            type="password"
            className="input-field w-full"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            确认新密码
          </label>
          <input
            name="confirmPassword"
            type="password"
            className="input-field w-full"
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="btn-primary">
          修改密码
        </button>
      </form>
    </div>
  );
}
