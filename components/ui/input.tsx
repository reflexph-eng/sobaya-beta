import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-11 w-full rounded-xl border border-sobaya-border bg-white px-4 text-sm outline-none transition placeholder:text-sobaya-muted focus:border-sobaya-primary disabled:cursor-not-allowed disabled:bg-sobaya-soft", props.className)} />;
}
