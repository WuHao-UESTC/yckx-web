"use client";

import { useEffect, useState } from "react";
import { BookOpen, Camera, Radio, Sparkles, Trophy, Waves } from "lucide-react";

const CHAPTERS = [
  { id: "surface", depth: "00m", label: "海面", icon: Waves },
  { id: "knowledge", depth: "80m", label: "知识潮汐", icon: BookOpen },
  { id: "competition", depth: "300m", label: "竞赛航线", icon: Trophy },
  { id: "events", depth: "900m", label: "时间回声", icon: Radio },
  { id: "routine", depth: "1800m", label: "同行灯火", icon: Camera },
  { id: "honors", depth: "4000m", label: "海底星图", icon: Sparkles },
];

export function DepthNavigation() {
  const [activeId, setActiveId] = useState(CHAPTERS[0].id);

  useEffect(() => {
    const sections = CHAPTERS.map((chapter) => document.getElementById(chapter.id)).filter(
      (section): section is HTMLElement => Boolean(section)
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-30% 0px -45%", threshold: [0.1, 0.3, 0.6] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="depth-navigation" aria-label="首页探索章节">
      <span className="depth-navigation__line" aria-hidden="true" />
      {CHAPTERS.map((chapter) => {
        const Icon = chapter.icon;
        const isActive = activeId === chapter.id;

        return (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            className={`depth-navigation__item ${isActive ? "is-active" : ""}`}
            aria-current={isActive ? "location" : undefined}
            title={`${chapter.depth} ${chapter.label}`}
          >
            <span className="depth-navigation__copy">
              <strong>{chapter.depth}</strong>
              <small>{chapter.label}</small>
            </span>
            <span className="depth-navigation__icon">
              <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </a>
        );
      })}
    </nav>
  );
}
