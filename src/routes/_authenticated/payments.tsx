import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { unwrap } from "@/lib/queries";
import { downloadCsv, openFile } from "@/lib/actions";
import { daysBetween, dateTime, money, shortDate, titleCase } from "@/lib/format";
import { RequirePermission } from "@/components/access-denied";
import { Btn, ConfirmAction, Input, Tabs } from "@/components/forms";
import { RecordPaymentButton } from "@/components/payment-dialog";
import { EmptyState, LoadingRow, MetricTile, PageHeader, Panel, StatusBadge, TableShell, Td, Th } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — KIMO GRAPHYX" },
      { name: "description", content: "Record, confirm and track payments and debtors." },
      { property: "og:title", content: "Payments — KIMO GRAPHYX" },
      { property: "og:description", content: "Payments, receipts and debtors." },
    ],
  }),
  component: () => (
    <RequirePermission perm="payments.view">
      <Payments />
    </RequirePermission>
  ),
});

type Tab = "collect" | "pending" | "history" | "debtors";

function Payments() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("pending");
  return (
    <>
      <PageHeader title="Payments" description="Payments are saved as pending, then confirmed by an authorised cashier. Receipts are issued on confirmation." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: "pending", label: "Awaiting confirmation" },
        { value: "collect", label: "Collect payment" },
        { value: "history", label: "Payment history" },
        { value: "debtors", label: "Debtors" },
      ]} />
      {tab === "pending" ? <Pending canConfirm={!!user?.can("payments.confirm")} canReverse={!!user?.isAdmin || !!user?.roles.includes("accountant")} /> : null}
      {tab === "collect" ? <Collect canRecord={!!user?.can("payments.record")} /> : null}
      {tab === "history" ? <History canReverse={!!user?.isAdmin || !!user?.roles.includes("accountant")} /> : null}
      {tab === "debtors" ? <Debtors /> : null}
    </>
  );
}

const PAY_SELECT = "*, customers(name, business_name, phone), jobs(job_number), payment_accounts(name)";

function Pending({ canConfirm, canReverse }: { canConfirm: boolean; canReverse: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["payments", "pending"], queryFn: () => unwrap(supabase.from("payments").select(PAY_SELECT).eq("status", "pending").order("paid_at")) });
  if (q.isLoading) return <LoadingRow />;
  if (!q.data?.length) return <Panel><EmptyState title="Nothing awaiting confirmation" message="New payments recorded against jobs will appear here for verification." /></Panel>;
  return (
    <Panel bodyClassName="p-0">
      <TableShell>
        <thead><tr><Th>Recorded</Th><Th>Customer</Th><Th>Job</Th><Th>Method</Th><Th>Details</Th><Th className="text-right">Amount</Th><Th /></tr></thead>
        <tbody>{q.data.map((p) => (
          <tr key={p.id}>
            <Td>{dateTime(p.paid_at)}</Td>
            <Td>{p.customers?.business_name || p.customers?.name}<span className="block text-xs text-muted-foreground">{p.customers?.phone}</span></Td>
            <Td>{p.job_id ? <Link to="/jobs/$id" params={{ id: p.job_id }} className="hover:underline">{p.jobs?.job_number}</Link> : "—"}</Td>
            <Td>{titleCase(p.method)}<span className="block text-xs text-muted-foreground">{p.payment_accounts?.name}</span></Td>
            <Td className="text-xs">{p.reference ? `Ref ${p.reference}` : ""}{p.momo_sender_phone ? ` · from ${p.momo_sender_phone}` : ""}{p.cheque_number ? ` · Chq ${p.cheque_number}` : ""}{p.proof_path ? <button className="ml-1 underline" onClick={() => openFile(p.proof_path!)}>View proof</button> : null}</Td>
            <Td className="tabular text-right font-medium">{money(p.amount)}</Td>
            <Td className="whitespace-nowrap text-right">
              {canConfirm ? <ConfirmAction title="Confirm this payment?" message={`Only confirm after verifying ${money(p.amount)} has actually been received${p.method === "momo" ? " on the MoMo account" : p.method === "cash" ? "" : " in the bank"}.`} confirmLabel="Confirm & issue receipt"
                onConfirm={async () => { const { data, error } = await supabase.rpc("confirm_payment", { _payment_id: p.id }); if (error) { toast.error(error.message); throw error; } toast.success(`Confirmed — receipt ${data}`); qc.invalidateQueries(); }}
                trigger={(o) => <Btn size="sm" variant="accent" onClick={o}>Confirm</Btn>} /> : null}
              {canReverse ? <ConfirmAction title="Reject this payment?" message="The payment will be marked reversed. This is kept in the audit log." requireReason danger confirmLabel="Reject"
                onConfirm={async (r) => { const { error } = await supabase.rpc("reverse_payment", { _payment_id: p.id, _reason: r }); if (error) { toast.error(error.message); throw error; } toast.success("Payment rejected"); qc.invalidateQueries(); }}
                trigger={(o) => <Btn size="sm" variant="ghost" className="ml-1" onClick={o}>Reject</Btn>} /> : null}
            </Td>
          </tr>))}</tbody>
      </TableShell>
    </Panel>
  );
}

function Collect({ canRecord }: { canRecord: boolean }) {
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["jobs-unpaid", term],
    queryFn: async () => {
      let s = supabase.from("jobs").select("id, job_number, title, total, amount_paid, payment_status, status, customers!inner(name, business_name, phone)").neq("payment_status", "paid").neq("status", "cancelled").gt("total", 0).order("created_at", { ascending: false }).limit(50);
      const t = term.trim().replace(/[%,()]/g, "");
      if (t) s = s.or(`name.ilike.%${t}%,phone.ilike.%${t}%,business_name.ilike.%${t}%`, { referencedTable: "customers" });
      return unwrap(s);
    },
  });
  return (
    <Panel bodyClassName="p-0">
      <div className="border-b border-border p-3"><Input placeholder="Search customer name or phone" aria-label="Search" value={term} onChange={(e) => setTerm(e.target.value)} /></div>
      {q.isLoading ? <LoadingRow /> : !q.data?.length ? <EmptyState title="No unpaid jobs" /> : (
        <TableShell>
          <thead><tr><Th>Job</Th><Th>Customer</Th><Th className="text-right">Total</Th><Th className="text-right">Paid</Th><Th className="text-right">Balance</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>{q.data.map((j) => (
            <tr key={j.id}><Td><Link to="/jobs/$id" params={{ id: j.id }} className="tabular hover:underline">{j.job_number}</Link></Td><Td>{j.customers?.business_name || j.customers?.name}<span className="block text-xs text-muted-foreground">{j.customers?.phone}</span></Td><Td className="tabular text-right">{money(j.total)}</Td><Td className="tabular text-right">{money(j.amount_paid)}</Td><Td className="tabular text-right font-medium">{money(Number(j.total) - Number(j.amount_paid))}</Td><Td><StatusBadge label={titleCase(j.payment_status)} tone={j.payment_status === "partial" ? "warning" : "danger"} /></Td><Td className="text-right">{canRecord ? <RecordPaymentButton jobId={j.id} jobNumber={j.job_number} balance={Number(j.total) - Number(j.amount_paid)} /> : null}</Td></tr>))}</tbody>
        </TableShell>
      )}
    </Panel>
  );
}

function History({ canReverse }: { canReverse: boolean }) {
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["payments", "history", term],
    queryFn: () => {
      let s = supabase.from("payments").select(PAY_SELECT).neq("status", "pending").order("paid_at", { ascending: false }).limit(200);
      const t = term.trim().replace(/[%,()]/g, "");
      if (t) s = s.or(`receipt_number.ilike.%${t}%,reference.ilike.%${t}%`);
      return unwrap(s);
    },
  });
  return (
    <Panel bodyClassName="p-0">
      <div className="flex gap-2 border-b border-border p-3"><Input placeholder="Search receipt no. or reference" aria-label="Search" value={term} onChange={(e) => setTerm(e.target.value)} /><Btn variant="secondary" onClick={() => downloadCsv("payments.csv", (q.data ?? []).map((p) => ({ date: p.paid_at, receipt: p.receipt_number, customer: p.customers?.business_name || p.customers?.name, job: p.jobs?.job_number, method: p.method, reference: p.reference, amount: p.amount, status: p.status })))}>Export CSV</Btn></div>
      {q.isLoading ? <LoadingRow /> : !q.data?.length ? <EmptyState title="No payments found" /> : (
        <TableShell>
          <thead><tr><Th>Date</Th><Th>Receipt</Th><Th>Customer</Th><Th>Job</Th><Th>Method</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>{q.data.map((p) => (
            <tr key={p.id}><Td>{shortDate(p.paid_at)}</Td><Td>{p.receipt_number ? <Link to="/receipts/$id" params={{ id: p.id }} className="hover:underline">{p.receipt_number}</Link> : "—"}</Td><Td>{p.customers?.business_name || p.customers?.name}</Td><Td>{p.jobs?.job_number ?? "—"}</Td><Td>{titleCase(p.method)}</Td><Td className="tabular text-right">{money(p.amount)}</Td><Td><StatusBadge label={titleCase(p.status)} tone={p.status === "confirmed" ? "success" : "neutral"} />{p.reversal_reason ? <span className="block text-xs text-muted-foreground">{p.reversal_reason}</span> : null}</Td>
              <Td>{canReverse && p.status === "confirmed" ? <ConfirmAction title="Reverse this payment?" message="A reversing ledger entry is posted and the job balance is restored. Confirmed payments are never deleted." requireReason danger confirmLabel="Reverse payment"
                onConfirm={async (r) => { const { error } = await supabase.rpc("reverse_payment", { _payment_id: p.id, _reason: r }); if (error) { toast.error(error.message); throw error; } toast.success("Payment reversed"); qc.invalidateQueries(); }}
                trigger={(o) => <Btn size="sm" variant="ghost" onClick={o}>Reverse</Btn>} /> : null}</Td></tr>))}</tbody>
        </TableShell>
      )}
    </Panel>
  );
}

function Debtors() {
  const q = useQuery({
    queryKey: ["debtors"],
    queryFn: () => unwrap(supabase.from("jobs").select("id, job_number, total, amount_paid, due_date, created_at, customer_id, customers(name, business_name, phone, credit_limit, credit_hold)").neq("payment_status", "paid").neq("status", "cancelled").gt("total", 0)),
  });
  if (q.isLoading) return <LoadingRow />;
  const rows = (q.data ?? []).map((j) => {
    const bal = Number(j.total) - Number(j.amount_paid);
    const days = Math.max(0, daysBetween(j.due_date ?? j.created_at));
    return { ...j, bal, days, bucket: days === 0 ? "Current" : days <= 30 ? "1–30" : days <= 60 ? "31–60" : days <= 90 ? "61–90" : "90+" };
  }).filter((r) => r.bal > 0).sort((a, b) => b.days - a.days);
  const buckets = ["Current", "1–30", "31–60", "61–90", "90+"];
  const total = rows.reduce((s, r) => s + r.bal, 0);
  return (
    <>
      <div className="panel mb-5 grid grid-cols-2 md:grid-cols-6">
        <MetricTile label="Total owed" value={money(total)} tone="danger" />
        {buckets.map((b) => <MetricTile key={b} label={b === "Current" ? "Current" : `${b} days`} value={money(rows.filter((r) => r.bucket === b).reduce((s, r) => s + r.bal, 0))} />)}
      </div>
      <Panel bodyClassName="p-0" actions={<Btn size="sm" variant="secondary" onClick={() => downloadCsv("debtors.csv", rows.map((r) => ({ job: r.job_number, customer: r.customers?.business_name || r.customers?.name, phone: r.customers?.phone, total: r.total, paid: r.amount_paid, balance: r.bal, due: r.due_date, days_overdue: r.days })))}>Export CSV</Btn>} title="Debtor ageing">
        {!rows.length ? <EmptyState title="No outstanding debtors" /> : (
          <TableShell>
            <thead><tr><Th>Customer</Th><Th>Job</Th><Th className="text-right">Total</Th><Th className="text-right">Paid</Th><Th className="text-right">Balance</Th><Th>Due</Th><Th className="text-right">Days overdue</Th><Th>Age</Th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}><Td><Link to="/customers/$id" params={{ id: r.customer_id }} className="hover:underline">{r.customers?.business_name || r.customers?.name}</Link>{r.customers?.credit_hold ? <StatusBadge label="Hold" tone="danger" className="ml-1" /> : null}<span className="block text-xs text-muted-foreground">{r.customers?.phone}</span></Td><Td><Link to="/jobs/$id" params={{ id: r.id }} className="tabular hover:underline">{r.job_number}</Link></Td><Td className="tabular text-right">{money(r.total)}</Td><Td className="tabular text-right">{money(r.amount_paid)}</Td><Td className="tabular text-right font-medium">{money(r.bal)}</Td><Td>{shortDate(r.due_date)}</Td><Td className="tabular text-right">{r.days}</Td><Td><StatusBadge label={r.bucket} tone={r.days > 60 ? "danger" : r.days > 0 ? "warning" : "neutral"} /></Td></tr>))}</tbody>
          </TableShell>
        )}
      </Panel>
    </>
  );
}
