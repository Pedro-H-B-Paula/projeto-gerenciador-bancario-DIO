import { Outlet, createFileRoute, Link } from "@tanstack/react-router";
import { History, Plus } from "lucide-react";
import { useState } from "react";

import { ConversationList } from "@/components/chat/ConversationList";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Agente — Finance AI" },
      { name: "description", content: "Converse com o agente financeiro sobre saldos, gastos e padrões de consumo." },
      { property: "og:title", content: "Agente — Finance AI" },
      { property: "og:description", content: "Converse com o agente financeiro sobre saldos, gastos e padrões de consumo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatLayout,
});

function ChatLayout() {
  const [open, setOpen] = useState(false);
  return (
    <AppShell fullBleed>
      <div className="flex h-[calc(100dvh-8.5rem)] min-h-0 lg:h-dvh">
        <aside className="hidden w-72 shrink-0 flex-col border-r bg-sidebar/40 lg:flex">
          <ConversationList />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b px-3 py-1.5 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <History /> Histórico
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Histórico de conversas</SheetTitle>
                </SheetHeader>
                <ConversationList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <Link to="/chat">
                <Plus /> Nova conversa
              </Link>
            </Button>
          </div>
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
