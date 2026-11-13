import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

import { EmptyState } from "@/components/finance/EmptyState";
import { PageHeader } from "@/components/finance/PageHeader";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Análises — Finance AI" },
      { name: "description", content: "Tendências, categorias, despesas recorrentes e estimativa de economia." },
      { property: "og:title", content: "Análises — Finance AI" },
      { property: "og:description", content: "Tendências, categorias, despesas recorrentes e estimativa de economia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Análises" description="Tendências, categorias, despesas recorrentes e estimativa de economia." />
      <div className="surface-card">
        <EmptyState icon={Construction} title="Página em construção" description="Esta tela será concluída na próxima etapa." />
      </div>
    </AppShell>
  );
}
