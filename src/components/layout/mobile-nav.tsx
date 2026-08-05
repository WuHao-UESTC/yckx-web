"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div>
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "关闭菜单" : "打开菜单"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
      >
        {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="mobile-menu-overlay"
            onClick={() => setOpen(false)}
            aria-label="关闭菜单"
          />
          <nav id="mobile-navigation" className="mobile-menu-panel" aria-label="移动端导航">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                <span>{link.label}</span>
                <ChevronRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
