import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpenText,
  Briefcase,
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Users,
  UserPlus,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { ROLE_LABELS, type Permission } from "@/lib/access";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LoadingRow } from "@/components/ui-kit";

type NavItem = { to: string; label: string; icon: typeof Users; perm?: Permission };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/registrations", label: "Registrations", icon: UserPlus, perm: "customers.manage" },
  { to: "/jobs", label: "Jobs", icon: Briefcase, perm: "jobs.view" },
  { to: "/payments", label: "Payments", icon: Wallet, perm: "payments.view" },
  { to: "/customers", label: "Customers", icon: Users, perm: "customers.view" },
  { to: "/assets", label: "Assets", icon: Wrench, perm: "assets.view" },
  { to: "/configs", label: "Configs", icon: Settings2, perm: "config.manage" },
  { to: "/ledger", label: "Ledger", icon: BookOpenText, perm: "ledger.view" },
  { to: "/reports", label: "Reports", icon: ChartColumn, perm: "reports.view" },
];

export function AppShell() {
  const { user, loading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  }

  const items = NAV.filter((n) => !n.perm || user?.can(n.perm));

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Main">
      {items.map((n) => {
        const active = pathname === n.to || pathname.startsWith(n.to + "/");
        return (
          <Link
            key={n.to}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={n.to as any}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--accent)]"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <n.icon className="size-4" aria-hidden />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
      <div className="grid size-7 place-items-center rounded-sm bg-accent font-display text-xs font-bold text-accent-foreground">
        KG
      </div>
      <span className="font-display text-sm font-semibold tracking-wider">KIMO GRAPHYX</span>
    </div>
  );

  const footer = user ? (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2.5">
        <div className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold">
          {initials(user.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-sidebar-foreground/60">
            {user.roles.map((r) => ROLE_LABELS[r]).join(", ") || "No role assigned"}
          </p>
        </div>
        <button
          onClick={signOut}
          className="rounded-sm p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar text-sidebar-foreground lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-foreground/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground shadow-raised">
            <button
              className="absolute right-2 top-3 rounded-sm p-2"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
            {brand}
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-sm p-2 hover:bg-muted" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <span className="font-display text-sm font-semibold tracking-wider">KIMO GRAPHYX</span>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:py-7">
          {loading ? <LoadingRow label="Loading your workspace…" /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
