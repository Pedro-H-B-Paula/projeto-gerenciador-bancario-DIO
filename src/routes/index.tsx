import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, FlaskConical, LineChart, Lock, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { buildDemoSnapshot } from "@/lib/demo/dataset";
import { categoryColor } from "@/lib/finance/categories";
import { toISODate } from "@/lib/finance/dates";
import { categoryBreakdown, filterRange, summarize } from "@/lib/finance/engine";
import { formatBRL, formatPercent } from "@/lib/finance/format";
import { currentMonthRange } from "@/lib/finance/periods";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finance AI — Sua vida financeira, finalmente compreendida" },
      {
        name: "description",
        content: "Converse com um agente financeiro que analisa suas contas, gastos e padrões de consumo em português.",
      },
      { property: "og:title", content: "Finance AI — Sua vida financeira, finalmente compreendida" },
      {
        property: "og:description",
        content: "Um agente financeiro que entende suas contas, explica seus gastos e responde em linguagem natural.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Pergunte em linguagem natural",
    text: "“Quanto gastei com alimentação no mês passado?” O agente entende períodos como “últimos 30 dias” ou “desde janeiro”.",
  },
  {
    icon: BarChart3,
    title: "Respostas com números reais",
    text: "Cada valor vem dos dados disponíveis. Nada de saldos ou transações inventadas — e a origem é sempre indicada.",
  },
  {
    icon: LineChart,
    title: "Padrões e recorrências",
    text: "Assinaturas, gastos incomuns, comparação entre meses e estimativa de economia, com a metodologia explicada.",
  },
  {
    icon: ShieldCheck,
    title: "Somente leitura",
    text: "O agente não faz transferências nem pagamentos. Suas credenciais bancárias nunca passam pelo navegador.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 grid-pattern" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth" search={{ mode: "signin", redirect: undefined }}>
              Entrar
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
              Começar agora
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Agente financeiro pessoal
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Sua vida financeira, <span className="text-primary">finalmente compreendida.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              O Finance AI reúne suas contas, organiza suas transações e conversa com você sobre elas. Pergunte o que
              quiser — o agente interpreta os números, encontra padrões e explica o que está acontecendo com o seu
              dinheiro.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-glow">
                <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
                  Começar agora <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth" search={{ mode: "signin", redirect: undefined }}>
                  Já tenho conta
                </Link>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> Não é preciso conectar um banco para ver a demonstração.
            </p>
          </div>

          <AgentPreview />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="surface-card p-5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <f.icon className="size-4" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Finance AI</span>
          <span>Versão de demonstração · dados fictícios claramente identificados</span>
        </div>
      </footer>
    </div>
  );
}

/** Visual demo of the agent, computed from the demonstration dataset (client-only to avoid date mismatches). */
function AgentPreview() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(toISODate(new Date())), []);

  const data = useMemo(() => {
    if (!today) return null;
    const snap = buildDemoSnapshot(today, new Date().toISOString());
    const month = filterRange(snap.transactions, currentMonthRange(today));
    const cats = categoryBreakdown(month).slice(0, 4);
    return { cats, summary: summarize(month) };
  }, [today]);

  return (
    <div className="surface-card animate-fade-up p-4 sm:p-5 [animation-delay:120ms]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="size-2 rounded-full bg-primary" /> Agente Finance AI
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-demo-soft px-2 py-1 text-[0.7rem] font-medium text-demo">
          <FlaskConical className="size-3" /> Dados de demonstração
        </span>
      </div>

      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          Qual categoria consome mais dinheiro neste mês?
        </div>
      </div>

      <div className="mt-4 rounded-2xl rounded-bl-md border bg-surface p-4">
        {!data ? (
          <div className="flex items-center gap-1.5 py-6">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 rounded-full bg-muted-foreground animate-pulse-dot"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        ) : data.cats.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há despesas registradas neste mês.</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-foreground">
              Neste mês, <strong>{data.cats[0]!.label}</strong> lidera seus gastos com{" "}
              <strong className="tabular">{formatBRL(data.cats[0]!.total)}</strong>, cerca de{" "}
              {formatPercent(data.cats[0]!.share)} das despesas de{" "}
              <span className="tabular">{formatBRL(data.summary.expense)}</span>.
            </p>
            <div className="mt-4 space-y-2.5">
              {data.cats.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="tabular text-foreground">{formatBRL(c.total)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${Math.max(4, c.share)}%`, backgroundColor: categoryColor(c.category) }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[0.7rem] text-muted-foreground">
              Fonte: conjunto de demonstração · valores fictícios
            </p>
          </>
        )}
      </div>
    </div>
  );
}
