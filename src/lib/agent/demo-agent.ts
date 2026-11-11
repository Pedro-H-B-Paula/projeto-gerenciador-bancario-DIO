/**
 * Stage 1 agent: deterministic intent matching over the financial engine. No LLM involved.
 * Every number comes from the snapshot; unknown questions get an honest "I can't answer yet".
 * Stage 4 replaces intent matching with an LLM that calls the same engine functions as tools.
 */
import { CATEGORIES, categoryColor, categoryLabel } from "@/lib/finance/categories";
import { addMonths, startOfMonth } from "@/lib/finance/dates";
import {
  availableBalance,
  categoryBreakdown,
  categoryTotal,
  comparePeriods,
  creditDebt,
  detectRecurring,
  filterRange,
  monthToDateRanges,
  monthlySeries,
  savingsEstimate,
  summarize,
  topTransactions,
  unusualExpenses,
} from "@/lib/finance/engine";
import { formatBRL, formatDate, formatPercent, monthLong, monthShort } from "@/lib/finance/format";
import { capitalize, currentMonthRange, normalizeText, previousMonthRange, resolvePeriod } from "@/lib/finance/periods";
import type { CategoryId, DateRange, FinancialSnapshot } from "@/lib/finance/types";
import type { AgentAnswer, MessageBlock } from "./blocks";

export const SUGGESTED_QUESTIONS = [
  "Quanto tenho disponível atualmente?",
  "Quanto gastei neste mês?",
  "Qual categoria consome mais dinheiro?",
  "Quais foram minhas maiores despesas?",
  "Compare meus gastos deste mês com o anterior.",
  "Identifique minhas despesas recorrentes.",
  "Estou gastando mais do que ganho?",
  "Quanto consegui economizar nos últimos três meses?",
];

type Intent =
  | "balance"
  | "recurring"
  | "compare"
  | "top"
  | "categories"
  | "category"
  | "over-income"
  | "savings"
  | "spending"
  | "income"
  | "unusual"
  | "methodology"
  | "transfer"
  | "unknown";

function findCategory(t: string): CategoryId | null {
  for (const c of Object.values(CATEGORIES)) {
    if (c.id === "transferencia" || c.id === "outros") continue;
    if (c.keywords.some((k) => new RegExp(`\\b${k}\\b`).test(t))) return c.id;
  }
  return null;
}

export function detectIntent(question: string): Intent {
  const t = normalizeText(question);
  if (/\b(transfer|transfira|pague|pagar|pix para|enviar dinheiro)/.test(t) && !/gast|quanto/.test(t)) return "transfer";
  if (/metodolog|como (voce )?calcul|como chegou|de onde vem/.test(t)) return "methodology";
  if (/recorrent|assinatura|fixas|mensalidade/.test(t)) return "recurring";
  if (/mais do que (ganho|recebo)|gastando mais|no vermelho|receitas (e|versus|vs) despesas/.test(t)) return "over-income";
  if (/econom|poupe|poupar|guardei|guardar|sobrou/.test(t)) return "savings";
  if (/compar|em relacao|versus|\bvs\b/.test(t)) return "compare";
  if (/incomu|fora do padrao|estranh|atipic|anormal/.test(t)) return "unusual";
  if (/maior(es)? (despesa|gasto|compra|transac)|mais caro/.test(t)) return "top";
  if (/categoria|consome mais|onde (eu )?gasto|com o que (eu )?gasto|distribuicao/.test(t)) return "categories";
  if (/saldo|disponivel|quanto (eu )?tenho|dinheiro em conta/.test(t)) return "balance";
  if (/(gast|despes|paguei)/.test(t) && findCategory(t)) return "category";
  if (/recebi|ganhei|receita|entrou|entradas|renda/.test(t)) return "income";
  if (/gast|despes|paguei|saiu|saidas/.test(t)) return "spending";
  return "unknown";
}

function source(s: FinancialSnapshot, period?: DateRange, note?: string): MessageBlock {
  return { type: "source", origin: s.origin, updatedAt: s.updatedAt, period: period?.label, note };
}

function periodLine(r: DateRange) {
  return `${formatDate(r.from)} a ${formatDate(r.to)}`;
}

export function answerQuestion(question: string, snapshot: FinancialSnapshot, today: string): AgentAnswer {
  const txs = snapshot.transactions;
  const intent = detectIntent(question);
  const t = normalizeText(question);

  if (intent === "transfer") {
    return {
      content:
        "Não consigo realizar transferências, pagamentos ou qualquer operação financeira. Nesta versão eu apenas **consulto e analiso** seus dados.",
      blocks: [],
    };
  }

  if (snapshot.accounts.length === 0) {
    return {
      content:
        "Não há nenhuma conta conectada no momento, então não tenho dados para responder. Conecte uma instituição em **Contas** (ou restaure a demonstração) e pergunte novamente.",
      blocks: [],
    };
  }

  switch (intent) {
    case "balance": {
      const total = availableBalance(snapshot);
      const debt = creditDebt(snapshot);
      const assets = snapshot.accounts.filter((a) => a.type !== "credit");
      const instName = (id: string) => snapshot.institutions.find((i) => i.id === id)?.name ?? "—";
      return {
        content: `Você tem **${formatBRL(total)}** disponíveis somando ${assets.length === 1 ? "sua conta" : `suas ${assets.length} contas`} corrente e poupança.${
          debt > 0 ? `\n\nSeparadamente, há **${formatBRL(debt)}** em compras no cartão de crédito ainda não pagas — esse valor não foi descontado do saldo acima.` : ""
        }`,
        blocks: [
          {
            type: "table",
            title: "Saldos por conta",
            columns: [
              { key: "conta", label: "Conta" },
              { key: "inst", label: "Instituição" },
              { key: "saldo", label: "Saldo", align: "right" },
            ],
            rows: snapshot.accounts.map((a) => ({
              conta: `${a.name} •• ${a.mask}`,
              inst: instName(a.institutionId),
              saldo: a.type === "credit" ? `${formatBRL(a.balance)} (fatura)` : formatBRL(a.balance),
            })),
          },
          source(snapshot),
        ],
      };
    }

    case "spending":
    case "income": {
      const range = resolvePeriod(question, today) ?? currentMonthRange(today);
      const s = summarize(filterRange(txs, range));
      const isIncome = intent === "income";
      const cats = categoryBreakdown(filterRange(txs, range)).slice(0, 5);
      const blocks: MessageBlock[] = [
        {
          type: "stats",
          items: [
            { label: "Receitas", value: formatBRL(s.income), tone: "income" },
            { label: "Despesas", value: formatBRL(s.expense), tone: "expense" },
            { label: "Resultado", value: formatBRL(s.net), tone: s.net >= 0 ? "income" : "expense" },
          ],
        },
      ];
      if (!isIncome && cats.length > 0)
        blocks.push({
          type: "chart",
          title: "Principais categorias",
          kind: "bar",
          data: cats.map((c) => ({ label: c.label, value: c.total, color: categoryColor(c.category) })),
        });
      blocks.push(source(snapshot, range));
      if (s.count === 0)
        return { content: `Não encontrei movimentações **${range.label}** (${periodLine(range)}).`, blocks: [source(snapshot, range)] };
      return {
        content: isIncome
          ? `${capitalize(range.label)} você recebeu **${formatBRL(s.income)}**.`
          : `${capitalize(range.label)} você gastou **${formatBRL(s.expense)}**${
              cats[0] ? `. A maior parte foi com **${cats[0].label.toLowerCase()}** (${formatBRL(cats[0].total)}, ${formatPercent(cats[0].share)} das despesas)` : ""
            }.\n\n*Pagamentos de fatura e transferências entre suas contas não entram nessa soma, para não contar a mesma despesa duas vezes.*`,
        blocks,
      };
    }

    case "category": {
      const cat = findCategory(t)!;
      const range = resolvePeriod(question, today) ?? currentMonthRange(today);
      const total = categoryTotal(filterRange(txs, range), cat);
      const allExp = summarize(filterRange(txs, range)).expense;
      const share = allExp > 0 ? (total / allExp) * 100 : 0;
      // Fair reference: same length previous period.
      let refLine = "";
      if (!resolvePeriod(question, today) || /este mes|neste mes|mes atual/.test(t)) {
        const { current, previous } = monthToDateRanges(today);
        const prev = categoryTotal(filterRange(txs, previous), cat);
        const cur = categoryTotal(filterRange(txs, current), cat);
        if (prev > 0) {
          const pct = ((cur - prev) / prev) * 100;
          refLine = ` Isso representa ${pct >= 0 ? "um aumento" : "uma redução"} de **${formatPercent(Math.abs(pct))}** em relação ao mesmo período do mês anterior (${formatBRL(prev)}).`;
        }
      }
      const items = filterRange(txs, range).filter((x) => x.direction === "expense" && x.category === cat);
      return {
        content:
          total === 0
            ? `Não encontrei gastos com **${categoryLabel(cat).toLowerCase()}** ${range.label}.`
            : `Você gastou **${formatBRL(total)}** com ${categoryLabel(cat).toLowerCase()} ${range.label}, aproximadamente **${formatPercent(share)}** das suas despesas.${refLine}`,
        blocks: [
          ...(items.length
            ? [
                {
                  type: "table" as const,
                  title: `${items.length} lançamentos`,
                  columns: [
                    { key: "data", label: "Data" },
                    { key: "desc", label: "Descrição" },
                    { key: "valor", label: "Valor", align: "right" as const },
                  ],
                  rows: [...items]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 8)
                    .map((x) => ({ data: formatDate(x.date), desc: x.description, valor: formatBRL(x.amount) })),
                },
              ]
            : []),
          source(snapshot, range),
        ],
      };
    }

    case "categories": {
      const range = resolvePeriod(question, today) ?? currentMonthRange(today);
      const cats = categoryBreakdown(filterRange(txs, range));
      if (!cats.length) return { content: `Não há despesas ${range.label}.`, blocks: [source(snapshot, range)] };
      return {
        content: `${capitalize(range.label)}, a categoria que mais consome dinheiro é **${cats[0].label.toLowerCase()}**, com **${formatBRL(cats[0].total)}** (${formatPercent(cats[0].share)} das despesas).${
          cats[1] ? ` Em seguida vêm ${cats[1].label.toLowerCase()} (${formatBRL(cats[1].total)})${cats[2] ? ` e ${cats[2].label.toLowerCase()} (${formatBRL(cats[2].total)})` : ""}.` : ""
        }`,
        blocks: [
          {
            type: "chart",
            title: "Distribuição das despesas",
            kind: "pie",
            data: cats.slice(0, 7).map((c) => ({ label: c.label, value: c.total, color: categoryColor(c.category) })),
          },
          {
            type: "table",
            columns: [
              { key: "cat", label: "Categoria" },
              { key: "qtd", label: "Lançamentos", align: "right" },
              { key: "total", label: "Total", align: "right" },
              { key: "share", label: "%", align: "right" },
            ],
            rows: cats.map((c) => ({ cat: c.label, qtd: String(c.count), total: formatBRL(c.total), share: formatPercent(c.share, 1) })),
          },
          source(snapshot, range),
        ],
      };
    }

    case "top": {
      const range = resolvePeriod(question, today) ?? currentMonthRange(today);
      const top = topTransactions(filterRange(txs, range), 8);
      if (!top.length) return { content: `Não há despesas ${range.label}.`, blocks: [source(snapshot, range)] };
      return {
        content: `Estas foram suas maiores despesas ${range.label}. A maior foi **${top[0].description}**, de **${formatBRL(top[0].amount)}**.`,
        blocks: [
          {
            type: "table",
            columns: [
              { key: "data", label: "Data" },
              { key: "desc", label: "Descrição" },
              { key: "cat", label: "Categoria" },
              { key: "valor", label: "Valor", align: "right" },
            ],
            rows: top.map((x) => ({ data: formatDate(x.date), desc: x.description, cat: categoryLabel(x.category), valor: formatBRL(x.amount) })),
          },
          source(snapshot, range),
        ],
      };
    }

    case "compare": {
      const explicit = resolvePeriod(question, today);
      const useMtd = !explicit || /este mes|neste mes|mes atual|anterior/.test(t);
      const { current, previous } = useMtd
        ? monthToDateRanges(today)
        : { current: explicit!, previous: previousMonthRange(today) };
      const cmp = comparePeriods(txs, current, previous);
      const pct = cmp.expenseChangePct;
      return {
        content: `Até hoje você gastou **${formatBRL(cmp.a.expense)}** neste mês, contra **${formatBRL(cmp.b.expense)}** no mesmo período do mês anterior${
          pct !== null ? ` — ${pct >= 0 ? "um aumento" : "uma redução"} de **${formatPercent(Math.abs(pct), 1)}**` : ""
        }.\n\nPara a comparação ser justa, considerei os mesmos dias: ${periodLine(current)} contra ${periodLine(previous)}.`,
        blocks: [
          {
            type: "chart",
            title: "Despesas por categoria",
            kind: "compare",
            seriesLabels: ["Mês anterior", "Este mês"],
            data: cmp.byCategory.slice(0, 6).map((c) => ({ label: c.label, value: c.b, value2: c.a })),
          },
          {
            type: "table",
            columns: [
              { key: "cat", label: "Categoria" },
              { key: "b", label: "Anterior", align: "right" },
              { key: "a", label: "Atual", align: "right" },
              { key: "d", label: "Variação", align: "right" },
            ],
            rows: cmp.byCategory.slice(0, 8).map((c) => ({
              cat: c.label,
              b: formatBRL(c.b),
              a: formatBRL(c.a),
              d: c.pct === null ? "novo" : `${c.pct >= 0 ? "+" : "−"}${formatPercent(Math.abs(c.pct))}`,
            })),
          },
          source(snapshot, current),
        ],
      };
    }

    case "recurring": {
      const rec = detectRecurring(txs);
      if (!rec.length) return { content: "Não identifiquei despesas recorrentes no histórico disponível.", blocks: [source(snapshot)] };
      const total = rec.reduce((s, r) => s + r.averageAmount, 0);
      const subs = rec.filter((r) => r.isSubscription);
      return {
        content: `Identifiquei **${rec.length} despesas recorrentes**, somando cerca de **${formatBRL(total)} por mês**.${
          subs.length ? ` Dessas, ${subs.length} são assinaturas (${formatBRL(subs.reduce((s, r) => s + r.averageAmount, 0))}/mês).` : ""
        }\n\n*Critério: mesma descrição em pelo menos 3 meses, com variação de valor de até 15%. A "próxima" data é uma estimativa.*`,
        blocks: [
          {
            type: "table",
            columns: [
              { key: "desc", label: "Descrição" },
              { key: "cat", label: "Categoria" },
              { key: "media", label: "Valor médio", align: "right" },
              { key: "prox", label: "Próxima (est.)", align: "right" },
            ],
            rows: rec.map((r) => ({ desc: r.description, cat: categoryLabel(r.category), media: formatBRL(r.averageAmount), prox: formatDate(r.nextExpected) })),
          },
          source(snapshot),
        ],
      };
    }

    case "over-income": {
      const range = resolvePeriod(question, today) ?? currentMonthRange(today);
      const s = summarize(filterRange(txs, range));
      const series = monthlySeries(txs, today, 6);
      const deficitMonths = series.filter((m) => m.net < 0).length;
      return {
        content:
          s.expense > s.income
            ? `Sim. ${capitalize(range.label)}, suas despesas (**${formatBRL(s.expense)}**) superam suas receitas (**${formatBRL(s.income)}**) em **${formatBRL(s.expense - s.income)}**.`
            : `Não. ${capitalize(range.label)} você recebeu **${formatBRL(s.income)}** e gastou **${formatBRL(s.expense)}**, com sobra de **${formatBRL(s.net)}**.` +
              (deficitMonths ? `\n\nNos últimos 6 meses, porém, ${deficitMonths} ${deficitMonths === 1 ? "mês fechou" : "meses fecharam"} no negativo.` : ""),
        blocks: [
          {
            type: "chart",
            title: "Receitas × despesas (6 meses)",
            kind: "compare",
            seriesLabels: ["Receitas", "Despesas"],
            data: series.map((m) => ({ label: monthShort(m.month), value: m.income, value2: m.expense })),
          },
          source(snapshot, range),
        ],
      };
    }

    case "savings": {
      const n = /seis|6/.test(t) ? 6 : /dois|2/.test(t) ? 2 : 3;
      const sav = savingsEstimate(txs, today, n);
      return {
        content: `Nos últimos ${n} meses completos, a diferença entre o que entrou e o que saiu foi de **${formatBRL(sav.totalNet)}**, em média **${formatBRL(sav.averageNet)} por mês**${
          sav.savingsRate !== null ? ` (${formatPercent(sav.savingsRate, 1)} da renda)` : ""
        }.\n\n*Isso é uma estimativa da sua capacidade de economia, calculada como receitas menos despesas. Não é o valor efetivamente aplicado.*`,
        blocks: [
          {
            type: "chart",
            title: "Resultado mensal",
            kind: "bar",
            data: sav.months.map((m) => ({ label: monthLong(m.month), value: m.net, color: m.net >= 0 ? "var(--income)" : "var(--expense)" })),
          },
          source(snapshot, undefined, `Meses: ${sav.months.map((m) => monthShort(m.month)).join(", ")}`),
        ],
      };
    }

    case "unusual": {
      const range = resolvePeriod(question, today) ?? { from: addMonths(startOfMonth(today), -2), to: today, label: "nos últimos 3 meses" };
      const list = unusualExpenses(txs).filter((x) => x.date >= range.from && x.date <= range.to);
      if (!list.length) return { content: `Não encontrei gastos fora do padrão ${range.label}.`, blocks: [source(snapshot, range)] };
      return {
        content: `Encontrei **${list.length}** ${list.length === 1 ? "gasto fora do padrão" : "gastos fora do padrão"} ${range.label}.\n\n*Critério: acima de R$ 150,00 e mais que o dobro do maior valor já pago no mesmo estabelecimento — ou, se o estabelecimento for novo, 2,5× a mediana da categoria.*`,
        blocks: [
          {
            type: "table",
            columns: [
              { key: "data", label: "Data" },
              { key: "desc", label: "Descrição" },
              { key: "cat", label: "Categoria" },
              { key: "valor", label: "Valor", align: "right" },
            ],
            rows: list.slice(0, 8).map((x) => ({ data: formatDate(x.date), desc: x.description, cat: categoryLabel(x.category), valor: formatBRL(x.amount) })),
          },
          source(snapshot, range),
        ],
      };
    }

    case "methodology":
      return {
        content: [
          "Veja como calculo os números:",
          "- **Saldo disponível**: soma dos saldos de conta corrente e poupança. A fatura do cartão aparece à parte.",
          "- **Despesas e receitas**: soma das movimentações do período. Pagamentos de fatura e transferências entre suas próprias contas são ignorados, para não contar a mesma despesa duas vezes.",
          "- **Comparações mensais**: uso os mesmos dias nos dois meses (ex.: dia 1 ao 11 contra dia 1 ao 11).",
          "- **Recorrentes**: mesma descrição em 3 ou mais meses, com variação de valor de até 15%.",
          "- **Economia**: receitas menos despesas dos últimos meses completos — é uma estimativa.",
        ].join("\n"),
        blocks: [source(snapshot)],
      };

    default:
      return {
        content:
          "Ainda não consigo responder a essa pergunta no modo demonstração. Posso ajudar com saldos, gastos por período ou categoria, maiores despesas, comparação entre meses, despesas recorrentes, gastos fora do padrão e estimativa de economia.\n\nO agente com inteligência artificial completa será ativado em uma próxima etapa.",
        blocks: [],
      };
  }
}
