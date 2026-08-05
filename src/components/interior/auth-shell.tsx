import type { ReactNode } from "react";
import { Waves } from "lucide-react";
import { InteriorPage } from "@/components/interior/interior-page";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <InteriorPage
      theme="surface"
      depth="00m"
      section="海面"
      title={title}
      contentWidth="reading"
      className="auth-page"
      showHeader={false}
    >
      <div className="auth-stage">
        <section className="auth-stage__intro">
          <div className="auth-stage__coordinate">
            <Waves size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>00m · SURFACE ACCESS</span>
          </div>
          <h1>英才实验学院大学生科技协会</h1>
          <p>从海面进入共同维护的知识、竞赛与科协档案。</p>
          <div className="auth-stage__horizon" aria-hidden="true">
            <span />
            <span />
          </div>
        </section>
        <section className="auth-panel">
          <header>
            <small>IDENTITY CHECK</small>
            <h2>{title}</h2>
            <p>{description}</p>
          </header>
          {children}
          <footer>{footer}</footer>
        </section>
      </div>
    </InteriorPage>
  );
}
