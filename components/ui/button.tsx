import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-sobaya-primary text-white hover:bg-sobaya-primaryDark",
  secondary: "border border-sobaya-border bg-white text-sobaya-ink hover:bg-sobaya-soft",
  ghost: "text-sobaya-muted hover:bg-sobaya-soft"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60", variants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({ href, children, variant = "primary", className }: { href: string; children: React.ReactNode; variant?: keyof typeof variants; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60", variants[variant], className)}>
      {children}
    </Link>
  );
}
