import { notFound } from "next/navigation";
import { ArticleOutline } from "@/components/article/article-outline";
import { GiscusComments } from "@/components/article/giscus-comments";
import { MobileTOC } from "@/components/article/mobile-toc";
import { PostNav } from "@/components/article/post-nav";
import { ViewTracker } from "@/components/article/view-tracker";
import { InteriorPage, type InteriorTheme } from "@/components/interior/interior-page";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import {
  findAdjacentPosts,
  findPublishedArticle,
  type ArticleKind,
} from "../server/article-queries";

const ARTICLE_OPTIONS: Record<
  ArticleKind,
  {
    showAttachments: boolean;
    showBottomTags: boolean;
    showCategory: boolean;
    showViewCount: boolean;
    useCreatedAtFallback: boolean;
  }
> = {
  KNOWLEDGE: {
    showAttachments: true,
    showBottomTags: false,
    showCategory: true,
    showViewCount: true,
    useCreatedAtFallback: false,
  },
  COMPETITION: {
    showAttachments: true,
    showBottomTags: true,
    showCategory: false,
    showViewCount: true,
    useCreatedAtFallback: false,
  },
  EVENT: {
    showAttachments: true,
    showBottomTags: true,
    showCategory: false,
    showViewCount: false,
    useCreatedAtFallback: true,
  },
  NEWS: {
    showAttachments: true,
    showBottomTags: true,
    showCategory: false,
    showViewCount: true,
    useCreatedAtFallback: false,
  },
  DAILY: {
    showAttachments: true,
    showBottomTags: true,
    showCategory: false,
    showViewCount: true,
    useCreatedAtFallback: false,
  },
};

const ARTICLE_PRESENTATION: Record<
  ArticleKind,
  { theme: InteriorTheme; depth: string; section: string; recordLabel: string }
> = {
  KNOWLEDGE: {
    theme: "knowledge",
    depth: HOME_CHAPTER_COPY.knowledge.depth,
    section: HOME_CHAPTER_COPY.knowledge.label,
    recordLabel: "知识记录",
  },
  COMPETITION: {
    theme: "competition",
    depth: HOME_CHAPTER_COPY.competition.depth,
    section: HOME_CHAPTER_COPY.competition.label,
    recordLabel: "航线记录",
  },
  EVENT: {
    theme: "archive",
    depth: HOME_CHAPTER_COPY.archive.depth,
    section: HOME_CHAPTER_COPY.archive.label,
    recordLabel: "大事记档案",
  },
  NEWS: {
    theme: "archive",
    depth: HOME_CHAPTER_COPY.archive.depth,
    section: HOME_CHAPTER_COPY.archive.label,
    recordLabel: "新闻档案",
  },
  DAILY: {
    theme: "routine",
    depth: HOME_CHAPTER_COPY.routine.depth,
    section: HOME_CHAPTER_COPY.routine.label,
    recordLabel: "同行日志",
  },
};

const MARKDOWN_STYLE_LABEL = {
  DEFAULT: "默认阅读",
  TECHNICAL: "技术文档",
  PAPER: "论文阅读",
} as const;

export async function ArticleDetailPage({ slug, kind }: { slug: string; kind: ArticleKind }) {
  const post = await findPublishedArticle(slug, kind);
  if (!post) notFound();

  const [prevPost, nextPost] = await findAdjacentPosts(post, kind);
  const options = ARTICLE_OPTIONS[kind];
  const presentation = ARTICLE_PRESENTATION[kind];
  const displayDate = post.publishedAt ?? (options.useCreatedAtFallback ? post.createdAt : null);
  const authorName = post.author.displayName ?? post.author.username;
  const metadata = [
    authorName,
    displayDate?.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    options.showViewCount ? `${post.viewCount} 次阅读` : null,
    options.showCategory && post.category ? post.category.name : null,
  ].filter(Boolean);

  return (
    <InteriorPage
      theme={presentation.theme}
      depth={presentation.depth}
      section={presentation.section}
      title={post.title}
      description={metadata.join(" · ")}
      contentWidth="reading"
      className="article-page"
    >
      <ViewTracker slug={post.slug} />
      <div className="article-reading-frame">
        <article className="article-reading-sheet">
          <header className="article-reading-sheet__header">
            <span>{presentation.recordLabel}</span>
            <small>YCKX / {post.slug}</small>
            <small>{MARKDOWN_STYLE_LABEL[post.renderStyle]}</small>
            {post.tags.length > 0 && (
              <div className="article-reading-sheet__tags">
                {post.tags.map(({ tag }) => (
                  <a key={tag.id} href={`/tags/${tag.slug}`} className="tag">
                    {tag.name}
                  </a>
                ))}
              </div>
            )}
          </header>

          {post.coverImage && (
            <figure className="article-reading-sheet__cover">
              <img src={post.coverImage} alt={post.title} />
            </figure>
          )}

          <MobileTOC content={post.content} />
          <MarkdownRenderer content={post.content} style={post.renderStyle} />

          {post.technicalColumns.length > 0 && post.category && (
            <nav className="article-technical-columns" aria-label="所属专栏">
              <span>所属专栏</span>
              {post.technicalColumns.map(({ column }) => {
                const root =
                  post.category?.type === "COMPETITION" ? "/competition" : "/knowledge-base";
                return (
                  <a key={column.id} href={`${root}/${post.category?.slug}/columns/${column.slug}`}>
                    {column.title}
                  </a>
                );
              })}
            </nav>
          )}

          {options.showAttachments && post.files.length > 0 && (
            <section className="article-attachments" aria-labelledby="article-attachments-title">
              <h3 id="article-attachments-title">附件下载</h3>
              <ul>
                {post.files.map((file) => (
                  <li key={file.id}>
                    <a href={`/api/files/${file.id}`}>
                      {file.filename} ({(file.size / 1024).toFixed(0)} KB)
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {options.showBottomTags && post.tags.length > 0 && (
            <div className="article-bottom-tags">
              {post.tags.map(({ tag }) => (
                <a key={tag.id} href={`/tags/${tag.slug}`} className="tag">
                  {tag.name}
                </a>
              ))}
            </div>
          )}

          <PostNav prev={prevPost} next={nextPost} />
          <GiscusComments />

          <footer className="article-copyright">
            <p>© {authorName} · 英才科协</p>
            <p>未经许可，禁止转载。</p>
          </footer>
        </article>

        <ArticleOutline content={post.content} />
      </div>
    </InteriorPage>
  );
}
