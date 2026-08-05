"use client";

import { useEffect, useRef, useState } from "react";

/** 智能代码块：检测语言标记，渲染 Markmap / Mermaid / PDF / 普通代码 */
export function CodeBlock({ language, children }: { language?: string; children: string }) {
  const lang = language?.toLowerCase() || "";

  if (lang === "markmap") return <MarkmapBlock content={children} />;
  if (lang === "mermaid") return <MermaidBlock content={children} />;
  if (lang === "pdf") return <PdfBlock url={children.trim()} />;

  return <pre className="markdown-code-block">{children}</pre>;
}

/** Markmap 思维导图 */
function MarkmapBlock({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Transformer } = await import("markmap-lib");
        const { Markmap } = await import("markmap-view");
        const transformer = new Transformer();

        const { root } = transformer.transform(content);
        if (!root) throw new Error("无法解析思维导图内容");

        if (ref.current && !cancelled) {
          ref.current.innerHTML = "";
          const svgId = "markmap-" + Math.random().toString(36).slice(2);
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("id", svgId);
          svg.style.width = "100%";
          svg.style.minHeight = "400px";
          ref.current.appendChild(svg);
          Markmap.create(svg, {}, root);
        }
      } catch (e) {
        if (!cancelled) setError("思维导图渲染失败：" + (e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [content]);

  if (error) return <pre className="bg-red-50 text-red-600 p-4 rounded-md text-sm">{error}</pre>;
  return <div ref={ref} className="markdown-embed markdown-markmap" />;
}

/** Mermaid 图表 */
function MermaidBlock({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [id] = useState(() => "mermaid-" + Math.random().toString(36).slice(2));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "neutral" });
        const { svg } = await mermaid.render(id, content);
        if (ref.current && !cancelled) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) setError("图表渲染失败：" + (e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [content, id]);

  if (error) return <pre className="bg-red-50 text-red-600 p-4 rounded-md text-sm">{error}</pre>;
  return <div ref={ref} className="markdown-embed markdown-mermaid" />;
}

/** PDF 嵌入 */
function PdfBlock({ url }: { url: string }) {
  if (!url)
    return (
      <pre className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
        请在代码块内容中输入 PDF 文件地址
      </pre>
    );
  return (
    <div className="markdown-embed markdown-pdf">
      <iframe src={url} className="w-full h-full" title="PDF 预览" />
    </div>
  );
}
