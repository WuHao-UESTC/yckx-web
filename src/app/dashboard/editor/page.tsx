import Link from "next/link";
import { ArrowUpRight, Newspaper, NotebookPen, Wrench } from "lucide-react";

const CHANNELS = [
  {
    href: "/dashboard/editor/technical",
    icon: Wrench,
    code: "TECHNICAL CURRENT",
    title: "写技术文章",
    description: "知识库与竞赛记录，共享标签、附件和完整 Markdown 能力。",
    kind: "technical",
  },
  {
    href: "/dashboard/editor/news",
    icon: Newspaper,
    code: "ARCHIVE DISPATCH",
    title: "写新闻",
    description: "发布普通新闻，或归入获奖、活动等新闻专栏。",
    kind: "news",
  },
  {
    href: "/dashboard/routine",
    icon: NotebookPen,
    code: "DAILY LOG",
    title: "写日常",
    description: "留言、照片与感悟，以及年度总结等日常专栏。",
    kind: "daily",
  },
] as const;

export default function EditorChannelPage() {
  return (
    <div className="workspace-channel-picker">
      <header className="workspace-panel-heading">
        <span>CONTENT CHANNELS</span>
        <h1>选择记录类型</h1>
        <p>每条航道使用独立的组织规则，正文、标签、附件和草稿仍由同一套编辑系统管理。</p>
      </header>

      <nav aria-label="内容类型" className="workspace-channel-list">
        {CHANNELS.map(({ href, icon: Icon, code, title, description, kind }) => (
          <Link key={href} href={href} data-channel-kind={kind}>
            <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <small>{code}</small>
              <strong>{title}</strong>
              <p>{description}</p>
            </span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
