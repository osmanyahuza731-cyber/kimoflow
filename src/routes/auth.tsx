import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNote } from "@/components/ui-kit";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — KIMO GRAPHYX" },
      { name: "description", content: "Staff sign-in for the KIMO GRAPHYX business management system." },
      { property: "og:title", content: "Sign in — KIMO GRAPHYX" },
      { property: "og:description", content: "Staff sign-in for the KIMO GRAPHYX business management system." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
      <aside className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-sm bg-accent font-display font-bold text-accent-foreground">
            KG
          </div>
          <span className="font-display text-lg font-semibold tracking-wide">KIMO GRAPHYX</span>
        </div>
        <div className="max-w-md">
          <p className="font-display text-2xl font-semibold leading-snug">
            Jobs, payments, stock and machines — one record for the whole shop floor.
          </p>
          <p className="mt-3 text-sm opacity-70">Printing • Branding • Creative Production</p>
        </div>
        <p className="text-xs opacity-50">Authorised staff only. All activity is logged.</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div>
            <h1 className="font-display text-xl font-semibold">
              {mode === "signin" ? "Staff sign in" : "Create staff account"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Use the email and password issued to you."
                : "New accounts get no module access until an administrator assigns a role. The very first account becomes Super Admin."}
            </p>
          </div>
          {error ? <ErrorNote message={error} /> : null}
          {mode === "signup" ? (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name *</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setError(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
          >
            {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}
