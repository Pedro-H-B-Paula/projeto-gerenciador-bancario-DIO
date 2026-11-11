import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Mode = "signin" | "signup" | "forgot";

function safeRedirect(r: unknown): string {
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; redirect?: string } => ({
    mode: s.mode === "signup" || s.mode === "forgot" ? s.mode : s.mode === "signin" ? "signin" : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Finance AI" },
      { name: "description", content: "Acesse sua conta Finance AI ou crie uma nova para conversar com seu agente financeiro." },
      { property: "og:title", content: "Entrar — Finance AI" },
      { property: "og:description", content: "Acesse sua conta Finance AI ou crie uma nova." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (m.includes("already registered") || m.includes("already exists")) return "Já existe uma conta com este e-mail.";
  if (m.includes("password") && m.includes("characters")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("weak") || m.includes("pwned")) return "Essa senha é fraca ou já apareceu em vazamentos. Escolha outra.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return "Não foi possível concluir. Tente novamente.";
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const mode: Mode = search.mode ?? "signin";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<{ kind: "confirm" | "reset"; email: string } | null>(null);
  const target = safeRedirect(search.redirect);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: target, replace: true });
    });
  }, [navigate, target]);

  const setMode = (m: Mode) => {
    setSentTo(null);
    navigate({ to: "/auth", search: { mode: m, redirect: search.redirect }, replace: true });
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: target, replace: true });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard", replace: true });
        else setSentTo({ kind: "confirm", email });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSentTo({ kind: "reset", email });
      }
    } catch (err) {
      toast.error(translateError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Mode, { h: string; p: string; cta: string }> = {
    signin: { h: "Bem-vindo de volta", p: "Entre para conversar com seu agente financeiro.", cta: "Entrar" },
    signup: { h: "Crie sua conta", p: "Comece com dados de demonstração — sem conectar nenhum banco.", cta: "Criar conta" },
    forgot: { h: "Recuperar senha", p: "Enviaremos um link para você definir uma nova senha.", cta: "Enviar link" },
  };
  const t = titles[mode];

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="bg-hero-glow pointer-events-none absolute inset-0" />
      <div className="grid-pattern pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" aria-label="Página inicial">
            <Logo />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Voltar
          </Link>
        </div>

        <div className="surface-card p-6 sm:p-7">
          {sentTo ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <MailCheck className="size-5" />
              </div>
              <h1 className="text-lg font-semibold">Verifique seu e-mail</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {sentTo.kind === "confirm"
                  ? `Enviamos um link de confirmação para ${sentTo.email}. Depois de confirmar, você entra direto no painel.`
                  : `Se existir uma conta para ${sentTo.email}, você receberá um link para redefinir a senha.`}
              </p>
              <Button variant="secondary" className="mt-6 w-full" onClick={() => setMode("signin")}>
                Voltar para o login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">{t.h}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t.p}</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te chamar?" autoComplete="name" required maxLength={80} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      {mode === "signin" && (
                        <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground">
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      minLength={6}
                      required
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading && <Loader2 className="animate-spin" />}
                  {t.cta}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    Não tem conta?{" "}
                    <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                      Criar agora
                    </button>
                  </>
                ) : (
                  <>
                    Já tem conta?{" "}
                    <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                      Entrar
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Suas credenciais bancárias nunca passam pelo navegador. Nesta versão, apenas dados de demonstração.
        </p>
      </div>
    </div>
  );
}
