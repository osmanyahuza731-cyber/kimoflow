import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { unwrap } from "@/lib/queries";
import { money, number, relativeTime } from "@/lib/format";
import { JOB_STATUS_LABELS, JOB_STATUS_TONE, type JobStatus } from "@/lib/workflow";
import { EmptyState, ErrorNote, LoadingRow, MetricTile, PageHeader, Panel, StatusBadge } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — KIMO GRAPHYX" },
      { name: "description", content: "Live overview of sales, jobs, stock and machines at KIMO GRAPHYX." },
      { property: "og:title", content: "Dashboard — KIMO GRAPHYX" },
      { property: "og:description", content: "Live overview of sales, jobs, stock and machines." },
    ],
  }),
  component: Dashboard,
});

function startOf(kind: "day" | "week" | "month") {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (kind === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (kind === "month") d.setDate(1);
  return d;
}

function Dashboard() {
  const { user } = useCurrentUser();
  const canMoney = user?.can("payments.view") || user?.can("ledger.view");

  const q = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const monthStart = startOf("month").toISOString();
      const [payments, jobs, invoices, expenses, items, machines, audit, newCustomers] = await Promise.all([
        canMoney
          ? unwrap(supabase.from("payments").select("amount, status, paid_at").gte("paid_at", monthStart))
          : Promise.resolve([]),
        user?.can("jobs.view")
          ? unwrap(supabase.from("jobs").select("id, status, created_at"))
          : Promise.resolve([]),
        canMoney
          ? unwrap(supabase.from("invoices").select("total, amount_paid, status").neq("status", "paid"))
          : Promise.resolve([]),
        user?.can("ledger.view")
          ? unwrap(supabase.from("expenses").select("amount, expense_date").gte("expense_date", monthStart.slice(0, 10)))
          : Promise.resolve([]),
        user?.can("inventory.view")
          ? unwrap(supabase.from("inventory_items").select("id, name, quantity, reorder_level, unit").eq("is_active", true))
          : Promise.resolve([]),
        user?.can("assets.view")
          ? unwrap(supabase.from("machines").select("id, name, status, next_maintenance").eq("is_active", true))
          : Promise.resolve([]),
        unwrap(supabase.from("audit_logs").select("id, action, record_type, created_at").order("created_at", { ascending: false }).limit(12)),
        user?.can("customers.view")
          ? unwrap(supabase.from("customers").select("id", { count: "exact", head: false }).gte("created_at", monthStart))
          : Promise.resolve([]),
      ]);
      return { payments, jobs, invoices, expenses, items, machines, audit, newCustomers };
    },
    enabled: Boolean(user),
  });

  if (q.isLoading) return <LoadingRow />;
  if (q.error) return <ErrorNote message={(q.error as Error).message} />;
  const d = q.data!;

  const confirmed = d.payments.filter((p) => p.status === "confirmed");
  const sumSince = (from: Date) =>
    confirmed.filter((p) => new Date(p.paid_at) >= from).reduce((s, p) => s + Number(p.amount), 0);
  const today = sumSince(startOf("day"));
  const week = sumSince(startOf("week"));
  const month = sumSince(startOf("month"));
  const pendingConfirm = d.payments.filter((p) => p.status === "pending").length;
  const debtors = d.invoices.reduce((s, i) => s + Number(i.total) - Number(i.amount_paid), 0);
  const expenseTotal = d.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const jobCount = (s: JobStatus) => d.jobs.filter((j) => j.status === s).length;
  const lowStock = d.items.filter((i) => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.reorder_level));
  const outStock = d.items.filter((i) => Number(i.quantity) <= 0);
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);
  const machineAlerts = d.machines.filter(
    (m) => m.status !== "operational" || (m.next_maintenance && new Date(m.next_maintenance) <= soon),
  );

  return (
    <>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${user?.fullName.split(" ")[0]}`}
        description="Live figures from today's records. Select any figure to open the records behind it."
      />

      {user && user.roles.length === 0 ? (
        <Panel className="mb-5">
          <p className="text-sm">
            Your account has no role yet. An administrator needs to assign you a role in Configs → Users before
            you can work in any module.
          </p>
        </Panel>
      ) : null}

      <div className="space-y-5">
        {canMoney ? (
          <Panel title="Money" description="Confirmed payments only. Pending mobile money and bank payments are excluded until verified." bodyClassName="p-0">
            <div className="grid grid-cols-2 border-l border-t border-border md:grid-cols-3 xl:grid-cols-6">
              <MetricTile label="Sales today" value={money(today)} to="/payments" />
              <MetricTile label="This week" value={money(week)} to="/payments" />
              <MetricTile label="This month" value={money(month)} to="/payments" />
              <MetricTile label="Outstanding debtors" value={money(debtors)} tone={debtors > 0 ? "danger" : "neutral"} to="/payments" hint={`${d.invoices.length} open invoices`} />
              <MetricTile label="Expenses (month)" value={money(expenseTotal)} to="/ledger" />
              <MetricTile label="Net cash (month)" value={money(month - expenseTotal)} tone={month - expenseTotal >= 0 ? "success" : "danger"} to="/ledger" hint={pendingConfirm ? `${pendingConfirm} payment(s) awaiting confirmation` : undefined} />
            </div>
          </Panel>
        ) : null}

        {user?.can("jobs.view") ? (
          <Panel title="Production floor" bodyClassName="p-0">
            <div className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-4 xl:grid-cols-7">
              {(["draft", "awaiting_approval", "awaiting_payment", "in_production", "ready_for_collection", "completed", "cancelled"] as JobStatus[]).map((s) => (
                <MetricTile key={s} label={JOB_STATUS_LABELS[s]} value={number(jobCount(s))} to="/jobs" search={{ status: s }} />
              ))}
            </div>
          </Panel>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-3">
          {user?.can("inventory.view") ? (
            <Panel title="Stock alerts" description={`${outStock.length} out of stock · ${lowStock.length} low`} bodyClassName="p-0">
              {outStock.length + lowStock.length === 0 ? (
                <EmptyState title="Stock levels are healthy" />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {[...outStock, ...lowStock].slice(0, 8).map((i) => (
                    <li key={i.id} className="flex items-center justify-between px-4 py-2">
                      <span>{i.name}</span>
                      <StatusBadge tone={Number(i.quantity) <= 0 ? "danger" : "warning"} label={`${number(i.quantity)} ${i.unit}`} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ) : null}

          {user?.can("assets.view") ? (
            <Panel title="Machine alerts" bodyClassName="p-0">
              {machineAlerts.length === 0 ? (
                <EmptyState title="All machines operational" />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {machineAlerts.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-4 py-2">
                      <Link to="/assets" className="hover:underline">{m.name}</Link>
                      <StatusBadge tone={m.status === "out_of_service" ? "danger" : "warning"} label={m.status === "operational" ? "Maintenance due soon" : m.status.replace(/_/g, " ")} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ) : null}

          <Panel title="Recent activity" bodyClassName="p-0">
            {d.audit.length === 0 ? (
              <EmptyState title="No recorded activity yet" message="Changes to customers, services and settings will appear here." />
            ) : (
              <ul className="divide-y divide-border text-sm">
                {d.audit.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2">
                    <span className="truncate">{a.action.replace(".", " · ")}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {user?.can("customers.view") ? (
          <p className="text-xs text-muted-foreground">
            {d.newCustomers.length} new customer(s) registered this month ·{" "}
            <Link to="/customers" className="underline">view customers</Link>
          </p>
        ) : null}
      </div>
      {/* Status tone map kept for linked badges */}
      <span className="hidden">{JOB_STATUS_TONE.draft}</span>
    </>
  );
}
