import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquare, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { conversationsQuery, deleteConversation, type ConversationSummary } from "@/lib/chat/conversations";

function relativeDay(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  const { data, isLoading, isError } = useQuery(conversationsQuery);
  const params = useParams({ strict: false }) as { conversationId?: string };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState<ConversationSummary | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    try {
      await deleteConversation(id);
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.removeQueries({ queryKey: ["thread", id] });
      toast.success("Conversa excluída");
      if (params.conversationId === id) navigate({ to: "/chat" });
    } catch {
      toast.error("Não foi possível excluir a conversa.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-sm font-medium text-foreground">Conversas</h2>
        <Button asChild size="sm" variant="secondary">
          <Link to="/chat" onClick={onNavigate}>
            <Plus /> Nova
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {isLoading && (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {isError && <p className="p-3 text-xs text-muted-foreground">Não foi possível carregar o histórico.</p>}
        {data && data.length === 0 && (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <MessageSquare className="mb-2 size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Suas conversas aparecem aqui.</p>
          </div>
        )}
        <ul className="space-y-0.5">
          {data?.map((c) => (
            <li key={c.id} className="group relative">
              <Link
                to="/chat/$conversationId"
                params={{ conversationId: c.id }}
                onClick={onNavigate}
                className="flex flex-col gap-0.5 rounded-lg py-2 pl-3 pr-9 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                activeProps={{ className: "bg-sidebar-accent !text-foreground" }}
              >
                <span className="truncate">{c.title}</span>
                <span className="text-[0.7rem] text-muted-foreground">{relativeDay(c.updated_at)}</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={`Opções da conversa ${c.title}`}
                    className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground opacity-100 hover:bg-surface-raised hover:text-foreground lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setToDelete(c)} className="text-destructive focus:text-destructive">
                    <Trash2 className="size-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </div>

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>“{toDelete?.title}” e todas as mensagens serão apagadas. Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
