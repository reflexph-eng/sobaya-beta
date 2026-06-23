"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CollapsibleSection({ title, description, defaultOpen = true, children, action }: { title: string; description?: string; defaultOpen?: boolean; children: React.ReactNode; action?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="p-0">
      <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex flex-1 items-start gap-3 text-left" aria-expanded={open}>
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sobaya-border bg-white text-sobaya-muted">
            <ChevronDown size={17} className={cn("transition", open ? "rotate-0" : "-rotate-90")} />
          </span>
          <span>
            <span className="block text-base font-semibold text-sobaya-ink">{title}</span>
            {description ? <span className="mt-1 block text-sm leading-5 text-sobaya-muted">{description}</span> : null}
          </span>
        </button>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {open ? <div className="border-t border-sobaya-border px-4 py-4 sm:px-5">{children}</div> : null}
    </Card>
  );
}
