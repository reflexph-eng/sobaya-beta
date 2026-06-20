import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, required, help, error, children, className }: FormFieldProps) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="font-medium text-sobaya-ink">
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {help ? <span className="text-xs leading-5 text-sobaya-muted">{help}</span> : null}
      {error ? <span className="text-xs leading-5 text-red-600">{error}</span> : null}
    </label>
  );
}

type SelectFieldProps = FormFieldProps & {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
};

export function SelectField({ label, required, help, error, value, onChange, children, disabled, className }: SelectFieldProps) {
  return (
    <FormField label={label} required={required} help={help} error={error} className={className}>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-sobaya-border bg-white px-4 text-sm outline-none transition focus:border-sobaya-primary disabled:cursor-not-allowed disabled:bg-sobaya-soft"
      >
        {children}
      </select>
    </FormField>
  );
}
