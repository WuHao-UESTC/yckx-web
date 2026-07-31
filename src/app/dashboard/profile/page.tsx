import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ProfilePage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  async function updateProfile(formData: FormData) {
    "use server";
    const session = await auth();
    const uid = (session?.user as { id: string }).id;
    await prisma.user.update({
      where: { id: uid },
      data: {
        displayName: formData.get("displayName") as string || null,
        bio: formData.get("bio") as string || null,
        profile: {
          upsert: {
            create: {
              website: formData.get("website") as string || null,
              github: formData.get("github") as string || null,
              bilibili: formData.get("bilibili") as string || null,
              title: formData.get("title") as string || null,
            },
            update: {
              website: formData.get("website") as string || null,
              github: formData.get("github") as string || null,
              bilibili: formData.get("bilibili") as string || null,
              title: formData.get("title") as string || null,
            },
          },
        },
      },
    });
    revalidatePath("/dashboard/profile");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">个人资料</h1>
      <form action={updateProfile} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">显示名称</label>
          <input name="displayName" defaultValue={user.displayName ?? ""} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">个性头衔</label>
          <input name="title" defaultValue={user.profile?.title ?? ""} className="input-field w-full" placeholder="e.g. 嵌入式爱好者" />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">个人简介</label>
          <textarea name="bio" defaultValue={user.bio ?? ""} rows={3} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">个人网站</label>
          <input name="website" defaultValue={user.profile?.website ?? ""} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">GitHub 用户名</label>
          <input name="github" defaultValue={user.profile?.github ?? ""} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">B站 UID</label>
          <input name="bilibili" defaultValue={user.profile?.bilibili ?? ""} className="input-field w-full" />
        </div>
        <button type="submit" className="btn-primary">保存</button>
      </form>
    </div>
  );
}
