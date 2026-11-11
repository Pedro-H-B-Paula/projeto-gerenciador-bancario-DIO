import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Finance AI" },
      { name: "description", content: "Defina uma nova senha para sua conta Finance AI." },
      { property: "og:title", content: "Nova senha — Finance AI" },
      { property: "og:description", content: "Defina uma nova senha para sua conta Finance AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session && isRecovery) setReady(true);
      else if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível alterar a senha. O link pode ter expirado.");
      return;
    }
    toast.success("Senha alterada com sucesso.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative grid min-h-dvh place-items-center px-4">
      <div className="bg-hero-glow pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="surface-card p-6">
          <div className="mb-4 grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
            <KeyRound className="size-4" />
          </div>
          <h1 className="text-xl font-semibold">Defina uma nova senha</h1>
          {ready ? (
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="np">Nova senha</Label>
                <Input id="np" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />} Salvar nova senha
              </Button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Abra esta página pelo link enviado ao seu e-mail. Se o link expirou, solicite um novo na tela de login.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
