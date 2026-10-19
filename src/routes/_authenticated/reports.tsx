import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/queries";
import { downloadCsv } from "@/lib/actions";
import { money, number, titleCase } from "@/lib/format";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/workflow";
import { RequirePermission } from "@/components/access-denied";
import { Btn, Input, Tabs } from "@/components/forms";
import { EmptyState, LoadingRow, MetricTile, PageHeader, Panel, TableShell, Td, Th } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — KIMO GRAPHYX" },
      { name: "description", content: "Sales, jobs, payments, inventory, profitability and staff reports." },
      { property: "og:title", content: "Reports — KIMO GRAPHYX" },
      { property: "og:description", content: "Business reports with export." },
    ],
  }),
  component: () => (
    <RequirePermission perm="reports.view">
      <Reports />
    </RequirePermission>
  ),
});

type Tab = "sales" | "jobs" | "payments" | "inventory" | "profit" | "staff";
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function group<T extends Row>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
  const m = new Map<string, { count: number; total: number }>();
  rows.forEach((r) => { const k = key(r) || "—"; const e = m.get(k) ?? { count: 0, total: 0 }; e.count++; e.total += val(r); m.set(k, e); });
  return [...m].map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.total - a.total);
}

function Reports() {
  const [tab, setTab] = useState<Tab>("sales");
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const q = useQuery({
    queryKey: ["reports", from, to],
    queryFn: async () => {
      const end = to + "T23:59:59";
      const [jobs, pays, items, cons] = await Promise.all([
        unwrap(supabase.from("jobs").select("id, job_number, status, total, amount_paid, material_cost, labour_cost, machine_cost, outsourcing_cost, other_cost, created_at, completed_at, categories(name), customers(customer_types(name)), profiles:assigned_staff_id(full_name), job_items(line_total, services(name))").gte("created_at", from).lte("created_at", end)),
        unwrap(supabase.from("payments").select("amount, method, status, confirmed_at").eq("status", "confirmed").gte("confirmed_at", from).lte("confirmed_at", end)),
        unwrap(supabase.from("inventory_items").select("name, quantity, reorder_level, cost_per_unit, unit, stores(name)").eq("is_active", true)),
        unwrap(supabase.from("inventory_transactions").select("quantity, unit_cost, transaction_type, inventory_items(name, unit)").eq("transaction_type", "consumption").gte("created_at", from).lte("created_at", end)),
      ]);
      return { jobs, pays, items, cons };
    },
  });

  const d = q.data;
  const live = d?.jobs.filter((j) => j.status !== "cancelled") ?? [];
  const cost = (j: Row) => Number(j.material_cost) + Number(j.labour_cost) + Number(j.machine_cost) + Number(j.outsourcing_cost) + Number(j.other_cost);

  let table: { title: string; cols: string[]; rows: (string | number)[][] } = { title: "", cols: [], rows: [] };
  if (d) {
    if (tab === "sales") {
      const bySvc = group(live.flatMap((j) => ((j.job_items ?? []) as Row[]).map((i) => ({ ...i, j }))), (r) => r.services?.name, (r) => Number(r.line_total));
      table = { title: "Sales by service", cols: ["Service", "Lines", "Sales"], rows: bySvc.map((r) => [r.key, r.count, money(r.total)]) };
    } else if (tab === "jobs") {
      const bySt = group(d.jobs, (j) => JOB_STATUS_LABELS[j.status as JobStatus] ?? j.status, (j) => Number(j.total));
      table = { title: "Jobs by status", cols: ["Status", "Jobs", "Value"], rows: bySt.map((r) => [r.key, r.count, money(r.total)]) };
    } else if (tab === "payments") {
      const byM = group(d.pays, (p) => titleCase(p.method), (p) => Number(p.amount));
      table = { title: "Confirmed payments by method", cols: ["Method", "Payments", "Amount"], rows: byM.map((r) => [r.key, r.count, money(r.total)]) };
    } else if (tab === "inventory") {
      table = { title: "Stock valuation", cols: ["Item", "Store", "Qty", "Value", "Status"], rows: d.items.map((i) => [i.name, i.stores?.name ?? "", `${number(i.quantity, 2)} ${i.unit}`, money(Number(i.quantity) * Number(i.cost_per_unit)), Number(i.quantity) <= 0 ? "Out" : Number(i.quantity) <= Number(i.reorder_level) ? "Low" : "OK"]) };
    } else if (tab === "profit") {
      const done = live.filter((j) => j.status === "completed");
      table = { title: "Profitability by completed job", cols: ["Job", "Category", "Revenue", "Cost", "Profit", "Margin"], rows: done.map((j) => { const c = cost(j); const p = Number(j.total) - c; return [j.job_number, j.categories?.name ?? "", money(j.total), money(c), money(p), Number(j.total) ? `${((p / Number(j.total)) * 100).toFixed(1)}%` : "—"]; }) };
    } else {
      const bySt = group(live, (j) => j.profiles?.full_name ?? "Unassigned", (j) => (j.status === "completed" ? 1 : 0));
      table = { title: "Jobs handled by staff", cols: ["Staff", "Jobs assigned", "Completed"], rows: bySt.map((r) => [r.key, r.count, r.total]) };
    }
  }

  const sales = live.reduce((s, j) => s + Number(j.total), 0);
  const collected = d?.pays.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const consumed = d?.cons.reduce((s, c) => s + Number(c.quantity) * Number(c.unit_cost), 0) ?? 0;

  return (
    <>
      <PageHeader title="Reports" description="All figures come from recorded transactions in the selected period." actions={
        <div className="flex flex-wrap items-center gap-2 text-sm print:hidden"><Input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} /><span>to</span><Input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} /></div>} />
      <div className="panel mb-5 grid grid-cols-2 md:grid-cols-4">
        <MetricTile label="Job sales" value={money(sales)} hint={`${live.length} jobs`} />
        <MetricTile label="Cash collected" value={money(collected)} tone="success" />
        <MetricTile label="Outstanding" value={money(live.reduce((s, j) => s + Number(j.total) - Number(j.amount_paid), 0))} tone="danger" />
        <MetricTile label="Materials consumed" value={money(consumed)} />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "sales", label: "Sales" }, { value: "jobs", label: "Jobs" }, { value: "payments", label: "Payments" }, { value: "inventory", label: "Inventory" }, { value: "profit", label: "Profitability" }, { value: "staff", label: "Staff" }]} />
      <Panel title={table.title} bodyClassName="p-0 print-area" actions={
        <div className="flex gap-2 print:hidden"><Btn size="sm" variant="secondary" onClick={() => downloadCsv(`${tab}-report.csv`, table.rows.map((r) => Object.fromEntries(table.cols.map((c, i) => [c, r[i]]))))}>Export CSV</Btn><Btn size="sm" variant="secondary" onClick={() => window.print()}>Print / PDF</Btn></div>}>
        {q.isLoading ? <LoadingRow /> : !table.rows.length ? <EmptyState title="No data in this period" /> : (
          <TableShell>
            <thead><tr>{table.cols.map((c) => <Th key={c}>{c}</Th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <Td key={j} className={j > 0 ? "tabular" : ""}>{v}</Td>)}</tr>)}</tbody>
          </TableShell>
        )}
      </Panel>
    </>
  );
}
