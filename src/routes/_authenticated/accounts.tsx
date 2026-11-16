import { createFileRoute } from "@tanstack/react-router";
import { Building2, CheckCircle2, CreditCard, FlaskConical, KeyRound, Landmark, Loader2, PiggyBank, Plus, RefreshCw, Unplug, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/finance/EmptyState";
import { InstitutionAvatar } from "@/components/finance/InstitutionAvatar";
import { OriginBadge } from "@/components/finance/OriginBadge";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { AppShell } from "@/components/layout/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinanceSnapshot } from "@/hooks/use-finance-data";
import { DEMO_INSTITUTIONS } from "@/lib/demo/dataset";
import { demoActions } from "@/lib/demo/store";
import { availableBalance, creditDebt } from "@/lib/finance/engine";
import { formatBRL, formatDateTime, formatMoney } from "@/lib/finance/format";
import type { Account, AccountType, ConnectionStatus, Institution } from "@/lib/finance/types";

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
  component: AccountsPage,
});

const TYPE_META: Record<AccountType, { label: string; icon: typeof Wallet }> = {
  checking: { label: "Conta corrente", icon: Wallet },
  savings: { label: "Poupança", icon: PiggyBank },
  credit: { label: "Cartão de crédito", icon: CreditCard },
  investment: { label: "Investimentos", icon: Landmark },
};

const STATUS_META: Record<ConnectionStatus, { label: string; variant: "income" | "warning" | "expense" | "muted" }> = {
  active: { label: "Ativa", variant: "income" },
  syncing: { label: "Sincronizando", variant: "muted" },
  expired: { label: "Expirada", variant: "warning" },
  error: { label: "Com erro", variant: "expense" },
};

function AccountsPage() {
  const { snapshot } = useFinanceSnapshot();
  const [addOpen, setAddOpen] = useState(false);
  const [toDisconnect, setToDisconnect] = useState<Institution | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const connectedIds = new Set(snapshot.institutions.map((i) => i.id));
  const disconnected = DEMO_INSTITUTIONS.filter((i) => !connectedIds.has(i.id));

  const refresh = (inst: Institution) => {
    setRefreshing(inst.id);
    // Demo data is local: refreshing only regenerates the snapshot timestamp.
    window.setTimeout(() => {
      demoActions.refresh();
      setRefreshing(null);
      toast.success(`${inst.name} atualizado`, { description: "Dados de demonstração recarregados." });
    }, 700);
  };

  return (
    <AppShell>
      <PageHeader
        title="Contas"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OriginBadge origin={snapshot.origin} />
            <span>Atualizado em {formatDateTime(snapshot.updatedAt)}</span>
          </span>
        }
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Adicionar instituição
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Instituições conectadas" value={snapshot.institutions.length} icon={Building2} />
        <StatCard label="Contas disponíveis" value={snapshot.accounts.length} icon={Wallet} />
        <StatCard label="Saldo disponível" value={formatBRL(availableBalance(snapshot))} icon={CheckCircle2} tone="primary" footer="Corrente + poupança" />
        <StatCard label="Fatura em aberto" value={formatBRL(creditDebt(snapshot))} icon={CreditCard} tone="expense" footer="Cartões de crédito" />
      </div>

      {snapshot.institutions.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={Building2}
            title="Nenhuma instituição conectada"
            description="Adicione uma instituição para ver contas, saldos e transações."
            action={
              <Button onClick={() => setAddOpen(true)}>
                <Plus /> Adicionar instituição
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {snapshot.institutions.map((inst) => (
            <InstitutionCard
              key={inst.id}
              institution={inst}
              accounts={snapshot.accounts.filter((a) => a.institutionId === inst.id)}
              lastSync={inst.lastSyncAt || snapshot.updatedAt}
              refreshing={refreshing === inst.id}
              onRefresh={() => refresh(inst)}
              onDisconnect={() => setToDisconnect(inst)}
            />
          ))}
        </div>
      )}

      <AddInstitutionDialog open={addOpen} onOpenChange={setAddOpen} disconnected={disconnected} />

      <AlertDialog open={!!toDisconnect} onOpenChange={(o) => !o && setToDisconnect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar {toDisconnect?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              As contas e transações dessa instituição deixam de aparecer no painel, nas análises e nas respostas do
              agente. Você pode reconectá-la depois em “Adicionar instituição”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!toDisconnect) return;
                demoActions.disconnect(toDisconnect.id);
                toast(`${toDisconnect.name} desconectado`);
                setToDisconnect(null);
              }}
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function InstitutionCard({
  institution,
  accounts,
  lastSync,
  refreshing,
  onRefresh,
  onDisconnect,
}: {
  institution: Institution;
  accounts: Account[];
  lastSync: string;
  refreshing: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
}) {
  const status = STATUS_META[refreshing ? "syncing" : institution.status];
  return (
    <section className="surface-card animate-fade-up overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <InstitutionAvatar institution={institution} className="size-11 text-sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium text-foreground">{institution.name}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
              <OriginBadge origin={institution.origin} short />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {institution.connectionType} · {accounts.length} {accounts.length === 1 ? "conta" : "contas"} · última
              sincronização {formatDateTime(lastSync)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Atualizar
          </Button>
          <Button variant="ghost" size="sm" onClick={onDisconnect} className="text-muted-foreground hover:text-expense">
            <Unplug /> Desconectar
          </Button>
        </div>
      </div>
      <div className="divide-y border-t">
        {accounts.map((a) => {
          const meta = TYPE_META[a.type];
          return (
            <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <meta.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {meta.label} •• {a.mask}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-medium text-foreground">{formatMoney(a.balance, a.currency)}</p>
                <p className="text-xs text-muted-foreground">{a.type === "credit" ? "Fatura em aberto" : "Saldo atual"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AddInstitutionDialog({
  open,
  onOpenChange,
  disconnected,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  disconnected: Institution[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar instituição</DialogTitle>
          <DialogDescription>Escolha de onde vêm os dados. Nenhuma conexão é simulada como real.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FlaskConical className="size-4 text-demo" /> Instituições de demonstração
            </div>
            {disconnected.length === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">Todas as instituições de demonstração já estão conectadas.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {disconnected.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-sm text-foreground">
                      <InstitutionAvatar institution={i} className="size-7 text-[0.65rem]" /> {i.name}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        demoActions.reconnect(i.id);
                        toast.success(`${i.name} reconectado`);
                      }}
                    >
                      Conectar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ProviderOption
            icon={Landmark}
            title="Plaid Sandbox"
            text="Banco fictício da Plaid para testes, com contas, saldos e transações de teste (em dólar)."
          />
          <ProviderOption
            icon={Building2}
            title="Pluggy · Open Finance"
            text="Instituições brasileiras pelo fluxo oficial do Pluggy Connect."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProviderOption({ icon: Icon, title, text }: { icon: typeof Landmark; title: string; text: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Icon className="size-4 text-info" /> {title}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
        </div>
        <Badge variant="muted" className="shrink-0">
          <KeyRound className="size-3" /> Aguardando credenciais
        </Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Esta conexão será liberada assim que as credenciais do provedor forem configuradas no servidor.
      </p>
    </div>
  );
}
