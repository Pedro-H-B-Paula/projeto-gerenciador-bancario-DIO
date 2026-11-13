import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LogoMark } from "@/components/brand/Logo";
import { ChatThread } from "@/components/chat/ChatThread";
import { useFinanceSnapshot } from "@/hooks/use-finance-data";
import { SUGGESTED_QUESTIONS } from "@/lib/agent/demo-agent";
import { createConversation, sendMessage } from "@/lib/chat/conversations";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({
    meta: [
      { title: "Nova conversa — Finance AI" },
      { name: "description", content: "Faça uma pergunta ao seu agente financeiro." },
      { property: "og:title", content: "Nova conversa — Finance AI" },
      { property: "og:description", content: "Faça uma pergunta ao seu agente financeiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewChatPage,
});

function NewChatPage() {
  const { snapshot, today } = useFinanceSnapshot();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  async function send(q: string) {
    if (pending !== null) return;
    setPending(q);
    try {
      const id = await createConversation(q, snapshot.origin);
      await sendMessage(id, q, snapshot, today);
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      await navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
    } catch {
      toast.error("Não foi possível enviar sua pergunta. Tente novamente.");
      setPending(null);
    }
  }

  return (
    <ChatThread
      messages={[]}
      pending={pending}
      onSend={(q) => void send(q)}
      empty={
        <div className="animate-fade-up">
          <LogoMark className="size-10" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">Como posso ajudar com suas finanças?</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Pergunte sobre saldos, gastos por período ou categoria, despesas recorrentes e comparações entre meses. Cada resposta mostra de onde vêm os
            dados.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-demo-soft px-2 py-1 text-xs font-medium text-demo">
            <FlaskConical className="size-3.5" /> Usando dados de demonstração
          </div>
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => void send(q)}
                className="rounded-xl border bg-surface/50 px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-surface"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
