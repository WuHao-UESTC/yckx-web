import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CodeBlock } from "./code-block";

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[rehypeSanitize, rehypeKatex]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match?.[1];
            const codeStr = String(children).replace(/\n$/, "");

            // 行内代码
            if (!className) {
              return (
                <code className="bg-[#f5f0e8] px-1.5 py-0.5 rounded text-[0.88em] text-[#8b5e3c]" {...props}>
                  {children}
                </code>
              );
            }

            // 代码块 — 检测 markmap / mermaid / pdf
            return <CodeBlock language={language} children={codeStr} />;
          },
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-md cursor-zoom-in hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          ),
          a: ({ href, children }) => {
            const isExternal = href?.startsWith("http");
            return (
              <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto"><table>{children}</table></div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
