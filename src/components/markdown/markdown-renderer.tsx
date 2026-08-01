import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CodeBlock } from "./code-block";
import { slugify } from "@/lib/slugify";

interface Props {
  content: string;
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

export function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose max-w-none" id="article-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[[rehypeKatex, { strict: false, output: "html" }]]}
        components={{
          h1: ({ children, ...props }) => <h1 id={headingId(children, 1)} {...props}>{children}</h1>,
          h2: ({ children, ...props }) => <h2 id={headingId(children, 2)} {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 id={headingId(children, 3)} {...props}>{children}</h3>,
          h4: ({ children, ...props }) => <h4 id={headingId(children, 4)} {...props}>{children}</h4>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match?.[1];
            const codeStr = String(children).replace(/\n$/, "");

            if (!className) {
              return (
                <code className="bg-[#f5f0e8] px-1.5 py-0.5 rounded text-[0.88em] text-[#8b5e3c]" {...props}>
                  {children}
                </code>
              );
            }

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
