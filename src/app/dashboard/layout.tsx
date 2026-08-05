import { redirect } from "next/navigation";
import { InteriorPage } from "@/components/interior/interior-page";
import { InteriorWorkspaceNav } from "@/components/interior/interior-workspace-nav";
import { auth } from "@/lib/auth";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  if (user.role === "GUEST") {
    redirect("/guest");
  }
  const isAdmin = user.role === "ADMIN";
  const copy = HOME_CHAPTER_COPY.routine;

  return (
    <InteriorPage
      theme="workspace"
      depth={copy.depth}
      section="同行工作台"
      title="把每一次记录，留给下一位同行者。"
      description={copy.description}
      contentWidth="full"
      className="workspace-page"
    >
      <div className="workspace-layout">
        <InteriorWorkspaceNav
          variant="workspace"
          label={user.name ?? "用户"}
          showAdminLink={isAdmin}
        />
        <section className="workspace-layout__panel">{children}</section>
      </div>
    </InteriorPage>
  );
}
