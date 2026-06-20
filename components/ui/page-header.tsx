export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-sobaya-muted">{description}</p>
    </header>
  );
}
