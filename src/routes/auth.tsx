import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNote } from "@/components/ui-kit";
import { BrandLockup } from "@/components/brand-logo";
import printFloor from "@/assets/print-floor.jpg";

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
    <div className="dark grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_480px]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={printFloor} alt="" width={1280} height={1440} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-background/80" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <BrandLockup />
          <div className="max-w-xl">
            <span className="inline-block rounded-full border border-brand-purple/50 bg-brand-purple/15 px-3 py-1 text-sm font-medium text-brand-purple">
              #1 Printing Press in Buipe, Ghana
            </span>
            <p className="mt-5 font-display text-sm font-bold tracking-[0.12em] text-primary">✦ YOUR BEST CHOICE ✦</p>
            <p className="mt-3 font-display text-4xl font-bold leading-[1.1] xl:text-5xl">
              Designs That <span className="text-primary">Sell.</span>
              <br />
              Prints That <span className="text-brand-purple">Impress.</span>
            </p>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              The KIMO GRAPHYX workspace — jobs, payments, stock and machines in one record for the whole shop floor.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Authorised staff only. All activity is logged.</p>
        </div>
      </aside>

      <main className="flex items-center justify-center border-l border-border bg-surface px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <BrandLockup className="mb-8 lg:hidden" />
          <div>
            <h1 className="font-display text-2xl font-bold">
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
          <Button type="submit" className="h-11 w-full rounded-full font-display text-base font-semibold" disabled={busy}>
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
