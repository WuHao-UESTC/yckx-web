import { redirect } from "next/navigation";
import { InteriorPage } from "@/components/interior/interior-page";
import { InteriorWorkspaceNav } from "@/components/interior/interior-workspace-nav";
import { auth } from "@/lib/auth";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "GUEST") redirect("/dashboard");
  const copy = HOME_CHAPTER_COPY.routine;
  return (
    <InteriorPage
      theme="workspace"
      depth={copy.depth}
      section="游客后台"
      title="管理你的阅读偏好与账号"
      description="订阅知识库、竞赛和新闻更新，参与文章讨论。"
      contentWidth="full"
      className="workspace-page"
    >
      <div className="workspace-layout">
        <InteriorWorkspaceNav variant="guest" label={session.user.name ?? "游客"} />
        <section className="workspace-layout__panel">{children}</section>
      </div>
    </InteriorPage>
  );
}
