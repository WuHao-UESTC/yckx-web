import { redirect } from "next/navigation";
import { InteriorPage } from "@/components/interior/interior-page";
import { InteriorWorkspaceNav } from "@/components/interior/interior-workspace-nav";
import { auth } from "@/lib/auth";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN") {
    redirect("/");
  }

  const copy = HOME_CHAPTER_COPY.honors;

  return (
    <InteriorPage
      theme="admin"
      depth={copy.depth}
      section="海底观测站"
      title="在星图背后，校准每一束公开信号。"
      description={copy.description}
      contentWidth="full"
      className="admin-page"
    >
      <div className="workspace-layout workspace-layout--admin">
        <InteriorWorkspaceNav variant="admin" label={session.user.name ?? "管理员"} />
        <section className="workspace-layout__panel">{children}</section>
      </div>
    </InteriorPage>
  );
}
