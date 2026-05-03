"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

export type DocsSection = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export function DocsSidebar({
  sections,
  activeSection,
  mobileOpen,
  onCloseMobile,
}: {
  sections: DocsSection[];
  activeSection: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Backdrop mobile */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-washed-black/40"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-0 left-0 h-screen lg:h-[calc(100vh-4rem)] w-[280px] bg-pearl border-r border-washed-black/10 lg:bg-transparent lg:border-r-0 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Mobile close */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-washed-black/10">
          <span className="text-[14px] font-bold text-washed-black uppercase tracking-[0.15em]">
            Dokumentasi
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 rounded-full hover:bg-washed-black/5 cursor-pointer"
          >
            <X className="h-4 w-4 text-washed-black" />
          </button>
        </div>

        <nav className="overflow-y-auto h-full p-5 lg:p-6">
          <p className="hidden lg:block text-[11px] font-bold text-dim-grey uppercase tracking-[0.2em] mb-4 px-3">
            Navigasi
          </p>

          <ul className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-[13px] font-medium transition ${
                      active
                        ? "bg-washed-black text-pure-white font-bold"
                        : "text-washed-black hover:bg-washed-black/5"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${
                        active ? "text-[#ffba09]" : "text-dim-grey"
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
