import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ChatThread } from "@/components/chat/ChatThread";
import { EmptyState } from "@/components/finance/EmptyState";
import { Button } from "@/components/ui/button";
import { useFinanceSnapshot } from "@/hooks/use-finance-data";
import { sendMessage, threadQuery } from "@/lib/chat/conversations";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(threadQuery(params.conversationId)),
  head: () => ({
    meta: [
      { title: "Conversa — Finance AI" },
      { name: "description", content: "Conversa com o agente financeiro." },
      { property: "og:title", content: "Conversa — Finance AI" },
      { property: "og:description", content: "Conversa com o agente financeiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { data } = useSuspenseQuery(threadQuery(conversationId));
  const { snapshot, today } = useFinanceSnapshot();
  const qc = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  if (!data.conversation) {
    return (
      <EmptyState
        className="flex-1"
        icon={MessageSquareOff}
        title="Conversa não encontrada"
        description="Ela pode ter sido excluída ou pertencer a outra conta."
        action={
          <Button asChild>
            <Link to="/chat">Começar nova conversa</Link>
          </Button>
        }
      />
    );
  }

  async function send(q: string) {
    if (pending !== null) return;
    setPending(q);
    try {
      await sendMessage(conversationId, q, snapshot, today);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["thread", conversationId] }),
        qc.invalidateQueries({ queryKey: ["conversations"] }),
      ]);
    } catch {
      toast.error("Não foi possível enviar sua pergunta. Tente novamente.");
    } finally {
      setPending(null);
    }
  }

  return <ChatThread messages={data.messages} pending={pending} onSend={(q) => void send(q)} />;
}
