import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { unwrap } from "@/lib/queries";
import { ACCEPT, downloadCsv, errMsg } from "@/lib/actions";
import { money, shortDate, titleCase } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/workflow";
import { RequirePermission } from "@/components/access-denied";
import { Btn, Field, Input, Modal, Select, Tabs, Textarea } from "@/components/forms";
import { EmptyState, ErrorNote, LoadingRow, MetricTile, PageHeader, Panel, TableShell, Td, Th } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/ledger")({
  head: () => ({
    meta: [
      { title: "Ledger — KIMO GRAPHYX" },
      { name: "description", content: "Cash book, expenses and profit & loss from recorded transactions." },
      { property: "og:title", content: "Ledger — KIMO GRAPHYX" },
      { property: "og:description", content: "Ledger, expenses and P&L." },
    ],
  }),
  component: () => (
    <RequirePermission perm="ledger.view">
      <Ledger />
    </RequirePermission>
  ),
});

type Tab = "pl" | "cashbook" | "expenses";
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

function Ledger() {
  const [tab, setTab] = useState<Tab>("pl");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  return (
    <>
      <PageHeader title="Ledger" description="Built only from confirmed payments, recorded expenses and actual job costs." actions={
        <div className="flex items-center gap-2 text-sm"><Input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} /><span>to</span><Input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} /></div>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "pl", label: "Profit & loss" }, { value: "cashbook", label: "Cash book" }, { value: "expenses", label: "Expenses" }]} />
      {tab === "pl" ? <ProfitLoss from={from} to={to} /> : null}
      {tab === "cashbook" ? <CashBook from={from} to={to} /> : null}
      {tab === "expenses" ? <Expenses from={from} to={to} /> : null}
    </>
  );
}

export function usePL(from: string, to: string) {
  return useQuery({
    queryKey: ["pl", from, to],
    queryFn: async () => {
      const [pays, jobs, exps] = await Promise.all([
        unwrap(supabase.from("payments").select("amount").eq("status", "confirmed").gte("confirmed_at", from).lte("confirmed_at", to + "T23:59:59")),
        unwrap(supabase.from("jobs").select("id, job_number, total, material_cost, labour_cost, machine_cost, outsourcing_cost, other_cost, category_id, categories(name)").eq("status", "completed").gte("completed_at", from).lte("completed_at", to + "T23:59:59")),
        unwrap(supabase.from("expenses").select("amount, category").gte("expense_date", from).lte("expense_date", to)),
      ]);
      const sum = (a: Record<string, unknown>[], k: string) => a.reduce((s, r) => s + Number(r[k] ?? 0), 0);
      return {
        cashIn: sum(pays, "amount"),
        revenue: sum(jobs, "total"),
        materials: sum(jobs, "material_cost"),
        labour: sum(jobs, "labour_cost"),
        machine: sum(jobs, "machine_cost"),
        other: sum(jobs, "outsourcing_cost") + sum(jobs, "other_cost"),
        opex: sum(exps, "amount"),
        expByCat: Object.entries(exps.reduce<Record<string, number>>((m, e) => ({ ...m, [e.category]: (m[e.category] ?? 0) + Number(e.amount) }), {})),
        jobs,
      };
    },
  });
}

function ProfitLoss({ from, to }: { from: string; to: string }) {
  const q = usePL(from, to);
  if (q.isLoading) return <LoadingRow />;
  if (!q.data) return <ErrorNote message="Could not load figures" />;
  const d = q.data;
  const direct = d.materials + d.labour + d.machine + d.other;
  const gross = d.revenue - direct;
  const net = gross - d.opex;
  const line = (l: string, v: number, strong = false, neg = false) => (
    <div className={`flex justify-between py-1.5 ${strong ? "border-t border-border font-semibold" : ""}`}><span className={neg ? "pl-4 text-muted-foreground" : ""}>{l}</span><span className={`tabular ${strong && v < 0 ? "text-destructive" : ""}`}>{neg ? `(${money(v)})` : money(v)}</span></div>
  );
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Profit & loss" description="Revenue from jobs completed in the period, less their actual costs and period expenses." actions={<Btn size="sm" variant="secondary" onClick={() => window.print()}>Print</Btn>}>
        <div className="print-area text-sm">
          {line("Revenue (completed jobs)", d.revenue)}
          {line("Materials (actual consumed)", d.materials, false, true)}
          {line("Labour", d.labour, false, true)}
          {line("Machine / production", d.machine, false, true)}
          {line("Outsourcing & other direct", d.other, false, true)}
          {line("Gross profit", gross, true)}
          {d.expByCat.map(([c, v]) => <div key={c}>{line(titleCase(c), v, false, true)}</div>)}
          {line("Operating expenses", d.opex, false, true)}
          {line("Net profit", net, true)}
        </div>
      </Panel>
      <div className="panel grid h-fit grid-cols-2">
        <MetricTile label="Cash received" value={money(d.cashIn)} tone="success" hint="Confirmed payments in period" />
        <MetricTile label="Expenses paid" value={money(d.opex)} />
        <MetricTile label="Gross margin" value={d.revenue ? `${((gross / d.revenue) * 100).toFixed(1)}%` : "—"} />
        <MetricTile label="Net position" value={money(d.cashIn - d.opex)} tone={d.cashIn - d.opex >= 0 ? "success" : "danger"} />
      </div>
    </div>
  );
}

function CashBook({ from, to }: { from: string; to: string }) {
  const q = useQuery({ queryKey: ["ledger", from, to], queryFn: () => unwrap(supabase.from("ledger_entries").select("*, jobs(job_number)").gte("entry_date", from).lte("entry_date", to).order("entry_date").order("created_at")) });
  if (q.isLoading) return <LoadingRow />;
  let bal = 0;
  const rows = q.data ?? [];
  return (
    <Panel bodyClassName="p-0" title="Cash book" actions={<Btn size="sm" variant="secondary" onClick={() => downloadCsv("cashbook.csv", rows.map((r) => ({ date: r.entry_date, type: r.entry_type, account: r.account, description: r.description, ref: r.reference, in: r.debit, out: r.credit })))}>Export CSV</Btn>}>
      {!rows.length ? <EmptyState title="No ledger entries in this period" message="Entries are created automatically when payments are confirmed and expenses recorded." /> : (
        <TableShell>
          <thead><tr><Th>Date</Th><Th>Type</Th><Th>Account</Th><Th>Description</Th><Th>Ref</Th><Th className="text-right">In</Th><Th className="text-right">Out</Th><Th className="text-right">Balance</Th></tr></thead>
          <tbody>{rows.map((r) => { bal += Number(r.debit) - Number(r.credit); return (
            <tr key={r.id}><Td>{shortDate(r.entry_date)}</Td><Td>{titleCase(r.entry_type)}</Td><Td>{titleCase(r.account)}</Td><Td>{r.description}{r.jobs ? ` · ${r.jobs.job_number}` : ""}</Td><Td className="text-xs">{r.reference}</Td><Td className="tabular text-right">{Number(r.debit) ? money(r.debit) : ""}</Td><Td className="tabular text-right">{Number(r.credit) ? money(r.credit) : ""}</Td><Td className="tabular text-right font-medium">{money(bal)}</Td></tr>); })}</tbody>
        </TableShell>
      )}
    </Panel>
  );
}

function Expenses({ from, to }: { from: string; to: string }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const q = useQuery({ queryKey: ["expenses", from, to], queryFn: () => unwrap(supabase.from("expenses").select("*, payment_accounts(name), profiles:staff_id(full_name)").gte("expense_date", from).lte("expense_date", to).order("expense_date", { ascending: false })) });
  const accounts = useQuery({ queryKey: ["payment_accounts"], queryFn: () => unwrap(supabase.from("payment_accounts").select("*").eq("is_active", true).order("name")) });
  const canRecord = !!(user?.isAdmin || user?.roles.some((r) => r === "cashier" || r === "accountant"));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const f = Object.fromEntries(fd) as Record<string, string>;
    setBusy(true);
    try {
      let receipt: string | null = null;
      const file = fd.get("receipt") as File | null;
      if (file && file.size) {
        receipt = `expense/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(receipt, file, { contentType: file.type });
        if (upErr) throw upErr;
      }
      const { error: rErr } = await supabase.rpc("record_expense", { _date: f.date!, _purpose: f.purpose!, _category: f.category!, _amount: Number(f.amount), _method: f.method!, _account: (f.account || null) as string, _receipt: receipt as string, _notes: f.notes ?? "" });
      if (rErr) throw rErr;
      toast.success("Expense recorded and posted to the ledger");
      qc.invalidateQueries();
      setOpen(false);
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  }
  const rows = q.data ?? [];
  return (
    <Panel bodyClassName="p-0" title={`Expenses · ${money(rows.reduce((s, r) => s + Number(r.amount), 0))}`} actions={
      <div className="flex gap-2"><Btn size="sm" variant="secondary" onClick={() => downloadCsv("expenses.csv", rows.map((r) => ({ number: r.expense_number, date: r.expense_date, purpose: r.purpose, category: r.category, amount: r.amount, method: r.method })))}>Export CSV</Btn>{canRecord ? <Btn size="sm" onClick={() => setOpen(true)}>Record expense</Btn> : null}</div>}>
      {q.isLoading ? <LoadingRow /> : !rows.length ? <EmptyState title="No expenses in this period" /> : (
        <TableShell>
          <thead><tr><Th>No.</Th><Th>Date</Th><Th>Purpose</Th><Th>Category</Th><Th>Method</Th><Th>Staff</Th><Th className="text-right">Amount</Th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><Td className="tabular text-xs">{r.expense_number}</Td><Td>{shortDate(r.expense_date)}</Td><Td>{r.purpose}</Td><Td>{titleCase(r.category)}</Td><Td>{titleCase(r.method)}{r.payment_accounts ? ` · ${r.payment_accounts.name}` : ""}</Td><Td>{r.profiles?.full_name ?? "—"}</Td><Td className="tabular text-right">{money(r.amount)}</Td></tr>)}</tbody>
        </TableShell>
      )}
      <Modal open={open} onOpenChange={setOpen} title="Record expense" description="Expenses are numbered automatically and posted to the cash book.">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" required><Input name="date" type="date" defaultValue={today()} required /></Field>
          <Field label="Amount (GHS)" required><Input name="amount" type="number" min={0.01} step="0.01" required /></Field>
          <Field label="Purpose" required className="sm:col-span-2"><Input name="purpose" required /></Field>
          <Field label="Category" required><Select name="category" required defaultValue="">{[<option key="" value="">Select…</option>, ...["rent", "utilities", "transport", "salaries", "materials", "maintenance", "marketing", "office", "other"].map((c) => <option key={c} value={c}>{titleCase(c)}</option>)]}</Select></Field>
          <Field label="Payment method" required><Select name="method" defaultValue="cash">{PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select></Field>
          <Field label="Paid from account"><Select name="account" defaultValue="">{[<option key="" value="">—</option>, ...(accounts.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)]}</Select></Field>
          <Field label="Receipt"><input name="receipt" type="file" accept={ACCEPT} className="text-sm" /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" rows={2} /></Field>
          {error ? <div className="sm:col-span-2"><ErrorNote message={error} /></div> : null}
          <div className="sm:col-span-2 flex justify-end"><Btn type="submit" loading={busy}>Save expense</Btn></div>
        </form>
      </Modal>
    </Panel>
  );
}
