import { notFound } from "next/navigation";
import { ArticleOutline } from "@/components/article/article-outline";
import { GiscusComments } from "@/components/article/giscus-comments";
import { MobileTOC } from "@/components/article/mobile-toc";
import { PostNav } from "@/components/article/post-nav";
import { ViewTracker } from "@/components/article/view-tracker";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
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
    showAttachments: false,
    showBottomTags: true,
    showCategory: false,
    showViewCount: true,
    useCreatedAtFallback: false,
  },
  EVENT: {
    showAttachments: false,
    showBottomTags: true,
    showCategory: false,
    showViewCount: false,
    useCreatedAtFallback: true,
  },
};

export async function ArticleDetailPage({ slug, kind }: { slug: string; kind: ArticleKind }) {
  const post = await findPublishedArticle(slug);
  if (!post) notFound();

  const [prevPost, nextPost] = await findAdjacentPosts(post, kind);
  const options = ARTICLE_OPTIONS[kind];
  const displayDate = post.publishedAt ?? (options.useCreatedAtFallback ? post.createdAt : null);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 flex justify-center gap-10">
      <ViewTracker slug={post.slug} />
      <div className="min-w-0 max-w-3xl flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] leading-tight mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
            <span>{post.author.displayName ?? post.author.username}</span>
            {displayDate && (
              <>
                <span>·</span>
                <time>
                  {displayDate.toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </>
            )}
            {options.showViewCount && (
              <>
                <span>·</span>
                <span>{post.viewCount} 次阅读</span>
              </>
            )}
            {options.showCategory && post.category && (
              <>
                <span>·</span>
                <span className="tag">{post.category.name}</span>
              </>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map(({ tag }) => (
                <a key={tag.id} href={`/tags/${tag.slug}`} className="tag">
                  {tag.name}
                </a>
              ))}
            </div>
          )}
        </header>

        {post.coverImage && (
          <div className="mb-6 rounded-md overflow-hidden bg-[#f5f0e8]">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-cover max-h-[400px]"
            />
          </div>
        )}

        <MobileTOC content={post.content} />
        <MarkdownRenderer content={post.content} />

        {options.showAttachments && post.files.length > 0 && (
          <div className="mt-8 p-4 bg-[#faf7f2] rounded-md border border-[#e8e0d5]">
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-2 font-[family-name:var(--font-sans)]">
              附件下载
            </h3>
            <ul className="space-y-1">
              {post.files.map((file) => (
                <li key={file.id}>
                  <a
                    href={`/api/files/${file.id}`}
                    className="text-sm text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]"
                  >
                    {file.filename} ({(file.size / 1024).toFixed(0)} KB)
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {options.showBottomTags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-1.5">
            {post.tags.map(({ tag }) => (
              <a key={tag.id} href={`/tags/${tag.slug}`} className="tag">
                {tag.name}
              </a>
            ))}
          </div>
        )}

        <PostNav prev={prevPost} next={nextPost} />
        <GiscusComments />

        <div className="mt-8 pt-6 border-t border-[#e8e0d5] text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          <p>© {post.author.displayName ?? post.author.username} · 英才科协</p>
          <p className="mt-1">未经许可，禁止转载。</p>
        </div>
      </div>

      <ArticleOutline content={post.content} />
    </div>
  );
}
