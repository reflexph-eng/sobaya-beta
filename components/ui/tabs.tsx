"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type TabItem = { key: string; label: string; content: React.ReactNode };

export function SimpleTabs({ tabs, defaultTab }: { tabs: TabItem[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key);
  const current = tabs.find((tab) => tab.key === active) ?? tabs[0];
  if (!current) return null;
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-sobaya-border bg-sobaya-soft/40 p-1">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActive(tab.key)} className={cn("whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition", active === tab.key ? "bg-white text-sobaya-ink shadow-sm" : "text-sobaya-muted hover:bg-white/70 hover:text-sobaya-ink")}>
            {tab.label}
          </button>
        ))}
      </div>
      <div>{current.content}</div>
    </div>
  );
}
