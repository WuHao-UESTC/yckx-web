import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/modules/auth/server/password";
import { requireGuest } from "@/server/auth/guards";
import { BadRequestError } from "@/server/http/errors";

export default async function GuestProfilePage() {
  const user = await requireGuest();
  async function updateProfile(formData: FormData) {
    "use server";
    const current = await requireGuest();
    const displayName =
      String(formData.get("displayName") ?? "")
        .trim()
        .slice(0, 40) || null;
    await prisma.user.update({ where: { id: current.id }, data: { displayName } });
    revalidatePath("/guest");
    revalidatePath("/guest/profile");
  }
  async function updatePassword(formData: FormData) {
    "use server";
    const current = await requireGuest();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");
    if (password.length < 8 || password !== confirm)
      throw new BadRequestError("密码至少 8 位且两次输入一致");
    await prisma.user.update({
      where: { id: current.id },
      data: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() },
    });
  }
  return (
    <div className="max-w-2xl space-y-8">
      <header className="workspace-panel-heading">
        <span>ACCOUNT PROFILE</span>
        <h1>账号资料</h1>
        <p>登录邮箱不可修改，昵称和密码可以随时更新。</p>
      </header>
      <form action={updateProfile} className="space-y-3">
        <label className="block">
          <span>登录邮箱</span>
          <input value={user.email} readOnly className="input-field w-full opacity-70" />
        </label>
        <label className="block">
          <span>用户名</span>
          <input value={user.username} readOnly className="input-field w-full opacity-70" />
        </label>
        <label className="block">
          <span>昵称</span>
          <input
            name="displayName"
            defaultValue={user.displayName ?? ""}
            className="input-field w-full"
            maxLength={40}
          />
        </label>
        <button className="btn-primary" type="submit">
          保存昵称
        </button>
      </form>
      <form action={updatePassword} className="space-y-3 border-t border-[#e8e0d5] pt-6">
        <h2 className="text-lg font-bold">修改密码</h2>
        <label className="block">
          <span>新密码</span>
          <input
            name="password"
            type="password"
            className="input-field w-full"
            minLength={8}
            required
          />
        </label>
        <label className="block">
          <span>确认新密码</span>
          <input
            name="confirmPassword"
            type="password"
            className="input-field w-full"
            minLength={8}
            required
          />
        </label>
        <button className="btn-primary" type="submit">
          修改密码
        </button>
      </form>
    </div>
  );
}
