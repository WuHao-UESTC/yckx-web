import Link from "next/link";
import { ArrowUpRight, FileText, FolderOpen, NotebookPen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/guards";

export default async function DashboardPage() {
  const user = await requireUser();
  const userId = user.id;

  const [postCount, draftCount, fileCount] = await Promise.all([
    prisma.post.count({ where: { authorId: userId, status: "PUBLISHED" } }),
    prisma.post.count({ where: { authorId: userId, status: "DRAFT" } }),
    prisma.file.count({ where: { uploaderId: userId } }),
  ]);

  return (
    <div className="workspace-overview">
      <header className="workspace-panel-heading">
        <span>LOGBOOK STATUS</span>
        <h1>工作台概览</h1>
        <p>查看自己的公开记录、未完成稿件与文件占用。</p>
      </header>

      <dl className="workspace-readouts">
        <div>
          <dt>已发布文章</dt>
          <dd>{postCount}</dd>
          <small>PUBLISHED SIGNALS</small>
        </div>
        <div>
          <dt>草稿</dt>
          <dd>{draftCount}</dd>
          <small>OPEN NOTES</small>
        </div>
        <div>
          <dt>上传文件</dt>
          <dd>{fileCount}</dd>
          <small>ATTACHED FILES</small>
        </div>
      </dl>

      <section className="workspace-quick-actions" aria-label="常用操作">
        <Link href="/dashboard/editor">
          <NotebookPen size={20} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <strong>开始一篇记录</strong>
            <small>打开编辑器</small>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <Link href="/dashboard/posts">
          <FileText size={20} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <strong>整理文章</strong>
            <small>发布、编辑与归档</small>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <Link href="/dashboard/files">
          <FolderOpen size={20} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <strong>检查附件</strong>
            <small>查看文件占用</small>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
