import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border border-sobaya-border bg-white p-5 shadow-soft", className)}>{children}</section>;
}
