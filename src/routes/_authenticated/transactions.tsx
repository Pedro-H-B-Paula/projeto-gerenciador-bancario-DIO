import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

import { EmptyState } from "@/components/finance/EmptyState";
import { PageHeader } from "@/components/finance/PageHeader";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transações — Finance AI" },
      { name: "description", content: "Extrato completo com filtros por período, categoria e conta." },
      { property: "og:title", content: "Transações — Finance AI" },
      { property: "og:description", content: "Extrato completo com filtros por período, categoria e conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Transações" description="Extrato completo com filtros por período, categoria e conta." />
      <div className="surface-card">
        <EmptyState icon={Construction} title="Página em construção" description="Esta tela será concluída na próxima etapa." />
      </div>
    </AppShell>
  );
}
