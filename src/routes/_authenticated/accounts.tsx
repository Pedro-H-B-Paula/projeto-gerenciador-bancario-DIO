import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

import { EmptyState } from "@/components/finance/EmptyState";
import { PageHeader } from "@/components/finance/PageHeader";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "Contas — Finance AI" },
      { name: "description", content: "Instituições conectadas, contas e saldos." },
      { property: "og:title", content: "Contas — Finance AI" },
      { property: "og:description", content: "Instituições conectadas, contas e saldos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Contas" description="Instituições conectadas, contas e saldos." />
      <div className="surface-card">
        <EmptyState icon={Construction} title="Página em construção" description="Esta tela será concluída na próxima etapa." />
      </div>
    </AppShell>
  );
}
