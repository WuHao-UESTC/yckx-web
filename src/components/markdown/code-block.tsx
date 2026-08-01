"use client";

import { useEffect, useRef, useState } from "react";

/** 智能代码块：检测语言标记，渲染 Markmap / Mermaid / PDF / 普通代码 */
export function CodeBlock({
  language,
  children,
}: {
  language?: string;
  children: string;
}) {
  const lang = language?.toLowerCase() || "";

  if (lang === "markmap") return <MarkmapBlock content={children} />;
  if (lang === "mermaid") return <MermaidBlock content={children} />;
  if (lang === "pdf") return <PdfBlock url={children.trim()} />;

  return <pre className="bg-[#2c2c2c] text-[#e8dcc8] p-5 rounded-md overflow-x-auto text-sm leading-relaxed">{children}</pre>;
}

/** Markmap 思维导图 */
function MarkmapBlock({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Markmap, loadCSS, loadJS } = await import("markmap-lib");
        const { Markmap: MarkmapView } = await import("markmap-view");
        const { buildHTML } = Markmap;

        const root = buildHTML(content);
        if (!root) throw new Error("无法解析思维导图内容");

        // 确保 CSS/JS 加载
        const style = document.createElement("style");
        style.textContent = `
          .markmap { width: 100%; min-height: 400px; }
          .markmap svg { width: 100%; height: 100%; }
        `;
        document.head.appendChild(style);

        if (ref.current && !cancelled) {
          const mm = MarkmapView.create(
            "svg#markmap-" + Math.random().toString(36).slice(2),
            {},
            root
          );
          ref.current.innerHTML = "";
          ref.current.appendChild(mm);
        }
      } catch (e) {
        if (!cancelled) setError("思维导图渲染失败：" + (e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [content]);

  if (error) return <pre className="bg-red-50 text-red-600 p-4 rounded-md text-sm">{error}</pre>;
  return <div ref={ref} className="w-full min-h-[400px] border border-[#e8e0d5] rounded-md p-4 overflow-auto" />;
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
    return () => { cancelled = true; };
  }, [content, id]);

  if (error) return <pre className="bg-red-50 text-red-600 p-4 rounded-md text-sm">{error}</pre>;
  return <div ref={ref} className="w-full overflow-auto" />;
}

/** PDF 嵌入 */
function PdfBlock({ url }: { url: string }) {
  if (!url) return <pre className="bg-red-50 text-red-600 p-4 rounded-md text-sm">请在代码块内容中输入 PDF 文件地址</pre>;
  return (
    <div className="w-full aspect-[4/3] min-h-[500px] border border-[#e8e0d5] rounded-md overflow-hidden">
      <iframe src={url} className="w-full h-full" title="PDF 预览" />
    </div>
  );
}
