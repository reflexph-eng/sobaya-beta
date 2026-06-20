import { Card } from "@/components/ui/card";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-sobaya-muted">{description}</p>
      <div className="mt-5 rounded-2xl border border-dashed border-sobaya-border bg-sobaya-soft p-5 text-sm text-sobaya-muted">
        Module préparé pour les prochains sprints. Aucune logique métier lourde dans Sprint 0.
      </div>
    </Card>
  );
}
