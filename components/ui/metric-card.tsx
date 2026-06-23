import Link from "next/link";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  compact?: boolean;
  className?: string;
  href?: string;
};

export function MetricCard({ label, value, helper, compact, className, href }: MetricCardProps) {
  const content = (
    <section className={cn(
      "rounded-2xl border border-sobaya-border bg-white p-4 shadow-soft sm:p-5",
      href ? "transition hover:-translate-y-0.5 hover:border-sobaya-primary/40 hover:shadow-md" : "",
      className
    )}>
      <p className="text-xs font-medium uppercase tracking-wide text-sobaya-muted sm:text-sm sm:normal-case sm:tracking-normal">{label}</p>
      <p className={cn("mt-2 font-semibold tracking-tight text-sobaya-ink", compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")}>{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-sobaya-muted">{helper}</p> : null}
      {href ? <p className="mt-3 text-xs font-medium text-sobaya-primary">Voir le détail →</p> : null}
    </section>
  );

  if (!href) return content;
  return <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-sobaya-primary/30 rounded-2xl">{content}</Link>;
}
