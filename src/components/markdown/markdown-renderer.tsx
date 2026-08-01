import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import "katex/dist/katex.min.css";
import { CodeBlock } from "./code-block";

const katexSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span || []), "className", "style"],
    math: ["xmlns"],
    annotation: ["encoding"],
    "*": ["className", "aria-hidden", "style"],
  },
  tagNames: [...(defaultSchema.tagNames || []), "math", "semantics", "annotation", "mrow", "mi", "mo", "mn", "msup", "msub", "mfrac", "msqrt", "mover", "munder", "mtable", "mtr", "mtd", "munderover", "mspace", "mpadded", "mphantom", "menclose"],
};

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[[rehypeKatex, { strict: false }], [rehypeSanitize, katexSchema]]}
        components={{
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
