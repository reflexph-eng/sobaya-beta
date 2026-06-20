import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "success" | "warning" | "danger";

const tones: Record<StatusTone, string> = {
  neutral: "border-sobaya-border bg-white text-sobaya-muted",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700"
};

export function StatusBadge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: StatusTone; className?: string }) {
  return <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}
