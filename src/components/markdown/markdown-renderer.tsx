import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { MarkdownStyle } from "@/generated/prisma/client";
import "katex/dist/katex.min.css";
import { CodeBlock } from "./code-block";
import { ImageLightbox } from "./image-lightbox";
import { slugify } from "@/lib/slugify";

interface Props {
  content: string;
  style?: MarkdownStyle;
}

/** 从 children 中提取纯文本，用于生成标题 id */
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

function headingId(children: React.ReactNode, level: number): string {
  const text = extractText(children);
  return `h${level}-${slugify(text)}`;
}

export function MarkdownRenderer({ content, style = "DEFAULT" }: Props) {
  return (
    <div
      className="prose markdown-body max-w-none"
      id="article-content"
      data-markdown-style={style.toLowerCase()}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[[rehypeKatex, { strict: false, output: "html" }]]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 id={headingId(children, 1)} {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 id={headingId(children, 2)} {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 id={headingId(children, 3)} {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 id={headingId(children, 4)} {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 id={headingId(children, 5)} {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 id={headingId(children, 6)} {...props}>
              {children}
            </h6>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match?.[1];
            const codeStr = String(children).replace(/\n$/, "");

            if (!className) {
              return (
                <code className="markdown-inline-code" {...props}>
                  {children}
                </code>
              );
            }

            return <CodeBlock language={language}>{codeStr}</CodeBlock>;
          },
          img: ({ src, alt }) => <ImageLightbox src={src} alt={alt} />,
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
          table: ({ children }) => (
            <div className="markdown-table-scroll">
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
