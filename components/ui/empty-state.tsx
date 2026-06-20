import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-sobaya-border bg-white p-6 text-center sm:p-8", className)}>
      {icon ? <div className="mx-auto flex w-fit items-center justify-center text-sobaya-muted">{icon}</div> : null}
      <p className="mt-3 font-medium text-sobaya-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-sobaya-muted">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
