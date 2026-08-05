"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 视口懒加载包装器：当元素进入视口时触发渲染，并添加淡入动画。
 * 用于首页分屏优化 — 首屏以下区块延迟加载。
 */
export function LazySection({
  children,
  className = "",
  rootMargin = "200px",
}: {
  children: React.ReactNode;
  className?: string;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={`lazy-section ${visible ? "visible" : ""} ${className}`}>
      {visible && children}
    </div>
  );
}
