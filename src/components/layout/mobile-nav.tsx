"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* 汉堡按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col gap-1 p-2 -mr-1"
        aria-label="菜单"
      >
        <span className={`block w-5 h-0.5 bg-[#6b6b6b] rounded transition-all ${open ? "rotate-45 translate-y-[6px]" : ""}`} />
        <span className={`block w-5 h-0.5 bg-[#6b6b6b] rounded transition-all ${open ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-0.5 bg-[#6b6b6b] rounded transition-all ${open ? "-rotate-45 -translate-y-[6px]" : ""}`} />
      </button>

      {/* 下拉导航 */}
      {open && (
        <>
          {/* 遮罩 */}
          <div className="fixed inset-0 top-14 z-40 bg-black/20" onClick={() => setOpen(false)} />
          {/* 菜单面板 */}
          <nav className="absolute top-14 left-0 right-0 z-50 bg-[#fdfcf9] border-b border-[#e8e0d5] shadow-lg py-2 px-5 font-[family-name:var(--font-sans)]">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-3 text-sm text-[#6b6b6b] hover:text-[#8b5e3c] border-b border-[#e8e0d5] last:border-b-0 transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
