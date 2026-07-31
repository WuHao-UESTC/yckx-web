import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSanitize, rehypeKatex]}
        components={{
          // 代码块：使用 Shiki 的服务端高亮？这里先用简化方案
          pre: ({ children }) => (
            <pre className="bg-[#2c2c2c] text-[#e8dcc8] p-5 rounded-md overflow-x-auto text-sm leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-[#f5f0e8] px-1.5 py-0.5 rounded text-[0.88em] text-[#8b5e3c]" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // 图片点击放大
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-md cursor-zoom-in hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={(e) => {
                (e.target as HTMLImageElement).classList.toggle("max-w-[90vw]");
                (e.target as HTMLImageElement).classList.toggle("fixed");
                (e.target as HTMLImageElement).classList.toggle("inset-0");
                (e.target as HTMLImageElement).classList.toggle("m-auto");
                (e.target as HTMLImageElement).classList.toggle("z-50");
              }}
            />
          ),
          // 外部链接新窗口打开
          a: ({ href, children }) => {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
          // 表格美化
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
