import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { companyQuery, unwrap } from "@/lib/queries";
import { ACCEPT, errMsg, openFile, uploadFile } from "@/lib/actions";
import { dateTime, money, number, shortDate, titleCase } from "@/lib/format";
import { JOB_STATUS_LABELS, JOB_STATUS_TONE, JOB_TRANSITIONS, PAYMENT_STATUS_TONE, type JobStatus } from "@/lib/workflow";
import { Btn, ConfirmAction, Field, Input, Tabs } from "@/components/forms";
import { RecordPaymentButton } from "@/components/payment-dialog";
import { ErrorNote, LoadingRow, PageHeader, Panel, StatusBadge, TableShell, Td, Th } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Job — KIMO GRAPHYX" },
      { name: "description", content: "Job details, workflow, materials, costing and payments." },
      { property: "og:title", content: "Job — KIMO GRAPHYX" },
      { property: "og:description", content: "Job details and workflow." },
    ],
  }),
  component: JobPage,
});

type Tab = "overview" | "materials" | "costing" | "payments" | "history";
type Doc = null | "sheet" | "quotation" | "invoice";

function JobPage() {
  const { id } = Route.useParams();
  const { user } = useCurrentUser();
  const canMoney = !!user?.can("payments.view");
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [doc, setDoc] = useState<Doc>(null);
  const company = useQuery(companyQuery);

  const q = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const [job, items, mats, history, files, payments] = await Promise.all([
        unwrap(supabase.from("jobs").select("*, customers(id, name, business_name, phone, customer_code), categories(name), machines(name), profiles:assigned_staff_id(full_name)").eq("id", id).single()),
        unwrap(supabase.from("job_items").select("*, services(name, unit)").eq("job_id", id)),
        unwrap(supabase.from("job_materials").select("*, inventory_items(name, unit, quantity, item_code)").eq("job_id", id)),
        unwrap(supabase.from("job_status_history").select("*, profiles:changed_by(full_name)").eq("job_id", id).order("created_at", { ascending: false })),
        unwrap(supabase.from("attachments").select("*").eq("record_type", "job").eq("record_id", id)),
        canMoney ? unwrap(supabase.from("payments").select("*").eq("job_id", id).order("paid_at", { ascending: false })) : Promise.resolve([]),
      ]);
      return { job, items, mats, history, files, payments };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["job", id] });

  if (q.isLoading) return <LoadingRow />;
  if (q.error || !q.data) return <ErrorNote message="Job not found or you don't have access." />;
  const { job, items, mats, history, files, payments } = q.data;
  const status = job.status as JobStatus;
  const balance = Number(job.total) - Number(job.amount_paid);
  const pendingPaid = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const shortages = mats.filter((m) => m.quantity_consumed === 0 && Number(m.inventory_items?.quantity ?? 0) < Number(m.quantity_required));

  async function move(to: JobStatus, reason = "") {
    const { error } = await supabase.rpc("change_job_status", { _job_id: id, _to: to, _reason: reason });
    if (error) { toast.error(error.message); throw error; }
    toast.success(`Moved to ${JOB_STATUS_LABELS[to]}`);
    qc.invalidateQueries();
  }

  if (doc) return <PrintDoc kind={doc} job={job} items={items} mats={mats} company={company.data ?? {}} onClose={() => setDoc(null)} />;

  const totalCost = Number(job.material_cost) + Number(job.labour_cost) + Number(job.machine_cost) + Number(job.outsourcing_cost) + Number(job.other_cost);
  const profit = Number(job.total) - totalCost;

  return (
    <>
      <PageHeader
        title={`${job.job_number}${job.title ? ` · ${job.title}` : ""}`}
        description={`${job.customers?.business_name || job.customers?.name} · ${job.customers?.phone} · created ${shortDate(job.created_at)}`}
        actions={
          <>
            <StatusBadge label={JOB_STATUS_LABELS[status]} tone={JOB_STATUS_TONE[status]} />
            <Btn variant="secondary" onClick={() => setDoc("sheet")}>Job sheet</Btn>
            {canMoney ? <><Btn variant="secondary" onClick={() => setDoc("quotation")}>Quotation</Btn><Btn variant="secondary" onClick={() => setDoc("invoice")}>Invoice</Btn></> : null}
          </>
        }
      />

      {user?.can("jobs.manage") && JOB_TRANSITIONS[status].length ? (
        <Panel className="mb-5" title="Next step" description="Only allowed moves are shown. The system checks your role and stock before accepting.">
          {status === "ready_for_production" && shortages.length ? (
            <div className="mb-3"><ErrorNote message={`Production blocked — insufficient stock: ${shortages.map((m) => `${m.inventory_items?.name} (need ${number(m.quantity_required, 2)} ${m.inventory_items?.unit}, have ${number(m.inventory_items?.quantity, 2)})`).join("; ")}. A storekeeper must add or transfer stock.`} /></div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {JOB_TRANSITIONS[status].map((to) =>
              to === "cancelled" || to === "on_hold" ? (
                <ConfirmAction key={to} title={`${JOB_STATUS_LABELS[to]} this job?`} message="A reason is required and will be kept in the audit trail." requireReason danger={to === "cancelled"} confirmLabel={JOB_STATUS_LABELS[to]} onConfirm={(r) => move(to, r)}
                  trigger={(o) => <Btn variant={to === "cancelled" ? "danger" : "secondary"} onClick={o}>{JOB_STATUS_LABELS[to]}</Btn>} />
              ) : (
                <ConfirmAction key={to} title={`Move to ${JOB_STATUS_LABELS[to]}?`} message={to === "in_production" ? "Required materials will be deducted from stock." : "This change is recorded in the job history."} confirmLabel="Move" onConfirm={() => move(to)}
                  trigger={(o) => <Btn variant={to === "approved" || to === "completed" ? "accent" : "primary"} onClick={o}>{JOB_STATUS_LABELS[to]}</Btn>} />
              ),
            )}
          </div>
        </Panel>
      ) : null}

      <Tabs value={tab} onChange={setTab} tabs={[
        { value: "overview", label: "Overview" },
        { value: "materials", label: "Materials" },
        ...(canMoney ? [{ value: "costing" as Tab, label: "Costing" }, { value: "payments" as Tab, label: "Payments" }] : []),
        { value: "history", label: "History" },
      ]} />

      {tab === "overview" ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Panel title="Services" bodyClassName="p-0">
            <TableShell>
              <thead><tr><Th>Service</Th><Th className="text-right">Qty</Th>{canMoney ? <><Th className="text-right">Unit price</Th><Th className="text-right">Total</Th></> : null}</tr></thead>
              <tbody>{items.map((i) => (
                <tr key={i.id}><Td>{i.services?.name}{i.description ? <span className="block text-xs text-muted-foreground">{i.description}</span> : null}</Td><Td className="tabular text-right">{number(i.quantity, 2)} {i.services?.unit}</Td>{canMoney ? <><Td className="tabular text-right">{money(i.unit_price)}</Td><Td className="tabular text-right">{money(i.line_total)}</Td></> : null}</tr>))}</tbody>
              {canMoney ? <tfoot><tr><Td colSpan={3} className="text-right text-muted-foreground">Discount</Td><Td className="tabular text-right">{money(job.discount)}</Td></tr><tr><Td colSpan={3} className="text-right font-semibold">Total</Td><Td className="tabular text-right font-semibold">{money(job.total)}</Td></tr></tfoot> : null}
            </TableShell>
          </Panel>
          <div className="grid gap-5">
            <Panel title="Details">
              <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Customer</dt><dd>{job.customers ? <Link to="/customers/$id" params={{ id: job.customers.id }} className="hover:underline">{job.customers.business_name || job.customers.name}</Link> : "—"}</dd>
                <dt className="text-muted-foreground">Category</dt><dd>{job.categories?.name ?? "—"}</dd>
                <dt className="text-muted-foreground">Machine</dt><dd>{job.machines?.name ?? "—"}</dd>
                <dt className="text-muted-foreground">Assigned</dt><dd>{job.profiles?.full_name ?? "—"}</dd>
                <dt className="text-muted-foreground">Priority</dt><dd>{titleCase(job.priority)}</dd>
                <dt className="text-muted-foreground">Deadline</dt><dd>{shortDate(job.due_date)}</dd>
                {Object.entries((job.specifications ?? {}) as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (<><dt key={k} className="text-muted-foreground">{titleCase(k)}</dt><dd key={k + "v"}>{v}</dd></>))}
                {canMoney ? <><dt className="text-muted-foreground">Payment</dt><dd><StatusBadge label={titleCase(job.payment_status)} tone={PAYMENT_STATUS_TONE[job.payment_status]} /> <span className="tabular">{money(balance)} due</span></dd></> : null}
              </dl>
              {job.instructions ? <p className="mt-3 border-t border-border pt-3 text-sm">{job.instructions}</p> : null}
            </Panel>
            <Panel title="Artwork & files" actions={user?.can("jobs.manage") ? <UploadLink onFile={async (f) => { await uploadFile("job", id, f, "Artwork"); refresh(); }} /> : null}>
              {files.length ? <ul className="grid gap-1 text-sm">{files.map((f) => <li key={f.id}><button className="hover:underline" onClick={() => openFile(f.file_path)}>{f.file_name}</button></li>)}</ul> : <p className="text-sm text-muted-foreground">No artwork uploaded.</p>}
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "materials" ? (
        <Panel title="Material requirements" description="Deducted automatically when the job enters production." bodyClassName="p-0">
          {!mats.length ? <p className="p-4 text-sm text-muted-foreground">No materials linked to these services. Admins can set material recipes per service in Configs.</p> : (
            <TableShell>
              <thead><tr><Th>Item</Th><Th className="text-right">Required</Th><Th className="text-right">In stock</Th><Th className="text-right">Consumed</Th>{canMoney ? <Th className="text-right">Cost</Th> : null}<Th>Status</Th></tr></thead>
              <tbody>{mats.map((m) => {
                const short = m.quantity_consumed === 0 && Number(m.inventory_items?.quantity) < Number(m.quantity_required);
                return (<tr key={m.id}><Td>{m.inventory_items?.name}</Td><Td className="tabular text-right">{number(m.quantity_required, 2)} {m.inventory_items?.unit}</Td><Td className="tabular text-right">{number(m.inventory_items?.quantity, 2)}</Td><Td className="tabular text-right">{number(m.quantity_consumed, 2)}</Td>{canMoney ? <Td className="tabular text-right">{money(m.total_cost)}</Td> : null}<Td>{Number(m.quantity_consumed) > 0 ? <StatusBadge label="Consumed" tone="success" /> : short ? <StatusBadge label="Insufficient" tone="danger" /> : <StatusBadge label="Available" tone="info" />}</Td></tr>);
              })}</tbody>
            </TableShell>
          )}
        </Panel>
      ) : null}

      {tab === "costing" ? <Costing job={job} totalCost={totalCost} profit={profit} canEdit={!!user?.can("jobs.approve")} onSaved={refresh} /> : null}

      {tab === "payments" ? (
        <Panel title="Payments" description={pendingPaid ? `${money(pendingPaid)} awaiting confirmation` : undefined} actions={user?.can("payments.record") ? <RecordPaymentButton jobId={id} jobNumber={job.job_number} balance={balance - pendingPaid} /> : null} bodyClassName="p-0">
          {!payments.length ? <p className="p-4 text-sm text-muted-foreground">No payments yet.</p> : (
            <TableShell>
              <thead><tr><Th>Date</Th><Th>Receipt</Th><Th>Method</Th><Th>Reference</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
              <tbody>{payments.map((p) => (
                <tr key={p.id}><Td>{dateTime(p.paid_at)}</Td><Td>{p.receipt_number ? <Link to="/receipts/$id" params={{ id: p.id }} className="hover:underline">{p.receipt_number}</Link> : "—"}</Td><Td>{titleCase(p.method)}{p.momo_sender_phone ? <span className="block text-xs text-muted-foreground">from {p.momo_sender_phone}</span> : null}</Td><Td>{p.reference ?? p.cheque_number ?? "—"}</Td><Td className="tabular text-right">{money(p.amount)}</Td><Td><StatusBadge label={titleCase(p.status)} tone={p.status === "confirmed" ? "success" : p.status === "pending" ? "warning" : "neutral"} /></Td></tr>))}</tbody>
            </TableShell>
          )}
        </Panel>
      ) : null}

      {tab === "history" ? (
        <Panel title="Status history">
          <ol className="grid gap-3 text-sm">{history.map((h) => (
            <li key={h.id} className="border-l-2 border-accent pl-3"><p className="font-medium">{h.from_status ? `${JOB_STATUS_LABELS[h.from_status as JobStatus] ?? h.from_status} → ` : ""}{JOB_STATUS_LABELS[h.to_status as JobStatus] ?? h.to_status}</p><p className="text-xs text-muted-foreground">{dateTime(h.created_at)} · {h.profiles?.full_name ?? "System"}{h.reason ? ` · ${h.reason}` : ""}</p></li>))}</ol>
        </Panel>
      ) : null}
    </>
  );
}

function UploadLink({ onFile }: { onFile: (f: File) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="cursor-pointer text-sm font-medium underline">
      {busy ? "Uploading…" : "Upload"}
      <input type="file" accept={ACCEPT} className="sr-only" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return; setBusy(true);
        try { await onFile(f); toast.success("File uploaded"); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); e.target.value = ""; }
      }} />
    </label>
  );
}

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function Costing({ job, totalCost, profit, canEdit, onSaved }: { job: Row; totalCost: number; profit: number; canEdit: boolean; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    const { error } = await supabase.from("jobs").update({ labour_cost: Number(f.labour_cost), machine_cost: Number(f.machine_cost), outsourcing_cost: Number(f.outsourcing_cost), other_cost: Number(f.other_cost) }).eq("id", job.id as string);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Costs updated");
    onSaved();
  }
  const margin = Number(job.total) ? (profit / Number(job.total)) * 100 : 0;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Actual costs" description="Material cost comes from actual stock consumed; other costs are entered by a manager.">
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Materials (actual)"><Input value={money(job.material_cost)} disabled /></Field>
          <Field label="Labour"><Input name="labour_cost" type="number" min={0} step="0.01" defaultValue={job.labour_cost} disabled={!canEdit} /></Field>
          <Field label="Machine"><Input name="machine_cost" type="number" min={0} step="0.01" defaultValue={job.machine_cost} disabled={!canEdit} /></Field>
          <Field label="Outsourcing"><Input name="outsourcing_cost" type="number" min={0} step="0.01" defaultValue={job.outsourcing_cost} disabled={!canEdit} /></Field>
          <Field label="Other"><Input name="other_cost" type="number" min={0} step="0.01" defaultValue={job.other_cost} disabled={!canEdit} /></Field>
          {canEdit ? <div className="self-end"><Btn type="submit" loading={busy}>Save costs</Btn></div> : null}
        </form>
      </Panel>
      <Panel title="Profitability">
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between"><dt>Selling price</dt><dd className="tabular">{money(job.total)}</dd></div>
          <div className="flex justify-between"><dt>Total cost</dt><dd className="tabular">{money(totalCost)}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>Gross profit</dt><dd className={profit >= 0 ? "tabular text-success" : "tabular text-destructive"}>{money(profit)}</dd></div>
          <div className="flex justify-between"><dt>Margin</dt><dd className="tabular">{margin.toFixed(1)}%</dd></div>
        </dl>
      </Panel>
    </div>
  );
}

function PrintDoc({ kind, job, items, mats, company, onClose }: { kind: Exclude<Doc, null>; job: Row; items: Row[]; mats: Row[]; company: Record<string, string>; onClose: () => void }) {
  const title = kind === "sheet" ? "JOB SHEET" : kind === "quotation" ? "QUOTATION" : "INVOICE";
  const showMoney = kind !== "sheet";
  return (
    <div>
      <div className="mb-4 flex gap-2 print:hidden"><Btn variant="secondary" onClick={onClose}>Back to job</Btn><Btn onClick={() => window.print()}>Print / save as PDF</Btn></div>
      <article className="print-area mx-auto max-w-3xl border border-border bg-surface p-8 text-sm">
        <header className="flex items-start justify-between border-b-2 border-foreground pb-4">
          <div><p className="font-display text-xl font-bold tracking-wider">{company.name || "KIMO GRAPHYX"}</p><p className="text-xs text-muted-foreground">{[company.address, company.phone, company.email, company.website].filter(Boolean).join(" · ")}</p></div>
          <div className="text-right"><p className="font-display text-lg font-semibold">{title}</p><p className="tabular">{job.job_number}</p><p className="text-xs">{shortDate(new Date())}</p></div>
        </header>
        <section className="my-4 grid grid-cols-2 gap-4">
          <div><p className="text-xs uppercase text-muted-foreground">Customer</p><p className="font-medium">{job.customers?.business_name || job.customers?.name}</p><p>{job.customers?.phone}</p><p className="text-xs">{job.customers?.customer_code}</p></div>
          <div className="text-right"><p className="text-xs uppercase text-muted-foreground">Deadline</p><p>{shortDate(job.due_date)}</p>{kind === "sheet" ? <><p className="text-xs uppercase text-muted-foreground">Assigned / machine</p><p>{job.profiles?.full_name ?? "—"} · {job.machines?.name ?? "—"}</p></> : null}</div>
        </section>
        <table className="w-full border-collapse">
          <thead><tr className="border-b border-foreground text-left"><th className="py-1">Service</th><th className="py-1 text-right">Qty</th>{showMoney ? <><th className="py-1 text-right">Unit</th><th className="py-1 text-right">Amount</th></> : null}</tr></thead>
          <tbody>{items.map((i) => <tr key={i.id} className="border-b border-border"><td className="py-1">{i.services?.name}{i.description ? ` — ${i.description}` : ""}</td><td className="py-1 text-right">{number(i.quantity, 2)} {i.services?.unit}</td>{showMoney ? <><td className="py-1 text-right">{money(i.unit_price)}</td><td className="py-1 text-right">{money(i.line_total)}</td></> : null}</tr>)}</tbody>
        </table>
        {showMoney ? (
          <div className="ml-auto mt-3 w-60 text-right">
            <p>Subtotal: {money(job.subtotal)}</p><p>Discount: {money(job.discount)}</p><p className="font-semibold">Total: {money(job.total)}</p>
            {kind === "invoice" ? <><p>Paid: {money(job.amount_paid)}</p><p className="font-semibold">Balance: {money(Number(job.total) - Number(job.amount_paid))}</p></> : null}
          </div>
        ) : (
          <>
            <h3 className="mt-4 font-semibold">Specifications</h3>
            <ul>{Object.entries((job.specifications ?? {}) as Record<string, string>).filter(([, v]) => v).map(([k, v]) => <li key={k}><strong>{titleCase(k)}:</strong> {v}</li>)}</ul>
            <h3 className="mt-3 font-semibold">Materials</h3>
            <ul>{mats.map((m) => <li key={m.id}>{m.inventory_items?.name}: {number(m.quantity_required, 2)} {m.inventory_items?.unit}</li>)}</ul>
            {job.instructions ? <><h3 className="mt-3 font-semibold">Instructions</h3><p>{job.instructions}</p></> : null}
            <p className="mt-3">Status: {JOB_STATUS_LABELS[job.status as JobStatus]}</p>
          </>
        )}
        <footer className="mt-8 border-t border-border pt-3 text-xs text-muted-foreground">
          {kind === "quotation" ? company.quotation_terms || "Quotation valid for 14 days. 70% deposit required before production." : company.invoice_footer || "Thank you for choosing KIMO GRAPHYX."}
        </footer>
      </article>
    </div>
  );
}
