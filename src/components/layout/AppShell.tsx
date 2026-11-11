import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, Building2, FlaskConical, LayoutDashboard, LineChart, LogOut, MessageSquare } from "lucide-react";
import type { ReactNode } from "react";

import { Logo, LogoMark } from "@/components/brand/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser, useSignOut } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Visão geral", short: "Início", icon: LayoutDashboard },
  { to: "/chat", label: "Agente", short: "Agente", icon: MessageSquare },
  { to: "/accounts", label: "Contas", short: "Contas", icon: Building2 },
  { to: "/transactions", label: "Transações", short: "Extrato", icon: ArrowLeftRight },
  { to: "/analytics", label: "Análises", short: "Análises", icon: LineChart },
] as const;

function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const name = (user?.user_metadata?.display_name as string | undefined) || user?.email || "";
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent",
            compact && "w-auto",
          )}
          aria-label="Menu da conta"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-raised text-xs font-semibold text-foreground">
            {initial}
          </span>
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-foreground">{name || "Carregando…"}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children, fullBleed = false }: { children: ReactNode; fullBleed?: boolean }) {
  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
        <Link to="/dashboard" className="mb-6 px-2">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-foreground" }}
            >
              <n.icon className="size-4 transition-colors group-[.active]:text-primary" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-demo/20 bg-demo-soft p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-demo">
              <FlaskConical className="size-3.5" /> Modo demonstração
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Instituições e valores fictícios. Nenhum banco real está conectado.
            </p>
          </div>
          <UserMenu />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur lg:hidden">
          <Link to="/dashboard" aria-label="Início">
            <LogoMark />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-demo-soft px-2 py-1 text-[0.7rem] font-medium text-demo">
            <FlaskConical className="size-3" /> Demonstração
          </span>
          <UserMenu compact />
        </header>

        <main className={cn("flex-1 pb-20 lg:pb-0", fullBleed ? "flex min-h-0 flex-col" : "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10")}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur lg:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[0.68rem] text-muted-foreground"
              activeProps={{ className: "!text-primary" }}
            >
              <n.icon className="size-[1.1rem]" />
              {n.short}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
