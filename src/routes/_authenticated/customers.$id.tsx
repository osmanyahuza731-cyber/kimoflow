import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { unwrap } from "@/lib/queries";
import { ACCEPT, errMsg, openFile, run, uploadFile } from "@/lib/actions";
import { money, shortDate, titleCase } from "@/lib/format";
import { JOB_STATUS_LABELS, JOB_STATUS_TONE, PAYMENT_STATUS_TONE, type JobStatus } from "@/lib/workflow";
import { Btn, Field, Input, Select, Tabs, Textarea } from "@/components/forms";
import { EmptyState, ErrorNote, LoadingRow, MetricTile, PageHeader, Panel, StatusBadge, TableShell, Td, Th } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  head: () => ({
    meta: [
      { title: "Customer account — KIMO GRAPHYX" },
      { name: "description", content: "Customer profile, jobs, invoices, payments and balance." },
      { property: "og:title", content: "Customer account — KIMO GRAPHYX" },
      { property: "og:description", content: "Customer profile and account statement." },
    ],
  }),
  component: CustomerPage,
});

type Tab = "jobs" | "payments" | "statement" | "files" | "messages" | "profile";

function CustomerPage() {
  const { id } = Route.useParams();
  const { user } = useCurrentUser();
  const canMoney = !!user?.can("payments.view");
  const [tab, setTab] = useState<Tab>("jobs");
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const [c, jobs, payments, files, messages] = await Promise.all([
        unwrap(supabase.from("customers").select("*, customer_types(name)").eq("id", id).single()),
        unwrap(supabase.from("jobs").select("id, job_number, title, status, payment_status, total, amount_paid, due_date, created_at").eq("customer_id", id).order("created_at", { ascending: false })),
        canMoney ? unwrap(supabase.from("payments").select("id, receipt_number, amount, method, status, paid_at, reference, jobs(job_number)").eq("customer_id", id).order("paid_at", { ascending: false })) : Promise.resolve([]),
        unwrap(supabase.from("attachments").select("*").eq("record_type", "customer").eq("record_id", id).order("created_at", { ascending: false })),
        unwrap(supabase.from("customer_messages").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(50)),
      ]);
      return { c, jobs, payments, files, messages };
    },
  });

  if (q.isLoading) return <LoadingRow />;
  if (q.error || !q.data) return <ErrorNote message="Customer not found or you don't have access." />;
  const { c, jobs, payments, files, messages } = q.data;
  const live = jobs.filter((j) => j.status !== "cancelled");
  const billed = live.reduce((s, j) => s + Number(j.total), 0);
  const paid = live.reduce((s, j) => s + Number(j.amount_paid), 0);

  return (
    <>
      <PageHeader
        title={c.business_name || c.name}
        description={`${c.customer_code} · ${c.customer_types?.name ?? ""} · ${c.phone}`}
        actions={
          <>
            {c.credit_hold ? <StatusBadge label="Credit hold" tone="danger" /> : null}
            {user?.can("jobs.manage") ? (
              <Link to="/jobs/new" search={{ customer: c.id }}><Btn>New job</Btn></Link>
            ) : null}
          </>
        }
      />
      {canMoney ? (
        <div className="panel mb-5 grid grid-cols-2 md:grid-cols-4">
          <MetricTile label="Jobs" value={String(jobs.length)} />
          <MetricTile label="Total billed" value={money(billed)} />
          <MetricTile label="Total paid" value={money(paid)} tone="success" />
          <MetricTile label="Outstanding" value={money(billed - paid)} tone={billed - paid > 0 ? "danger" : "neutral"} hint={`Credit limit ${money(c.credit_limit)}`} />
        </div>
      ) : null}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "jobs", label: "Jobs" },
          ...(canMoney ? [{ value: "payments" as Tab, label: "Payments" }, { value: "statement" as Tab, label: "Statement" }] : []),
          { value: "files", label: "Files & notes" },
          { value: "messages", label: "Messages" },
          { value: "profile", label: "Profile" },
        ]}
      />
      {tab === "jobs" ? (
        <Panel bodyClassName="p-0">
          {!jobs.length ? <EmptyState title="No jobs yet" message="Create this customer's first job." /> : (
            <TableShell>
              <thead><tr><Th>Job</Th><Th>Title</Th><Th>Status</Th>{canMoney ? <><Th>Total</Th><Th>Balance</Th><Th>Payment</Th></> : null}<Th>Due</Th></tr></thead>
              <tbody>{jobs.map((j) => (
                <tr key={j.id}>
                  <Td><Link to="/jobs/$id" params={{ id: j.id }} className="tabular font-medium hover:underline">{j.job_number}</Link></Td>
                  <Td>{j.title ?? "—"}</Td>
                  <Td><StatusBadge label={JOB_STATUS_LABELS[j.status as JobStatus] ?? j.status} tone={JOB_STATUS_TONE[j.status as JobStatus]} /></Td>
                  {canMoney ? <><Td className="tabular">{money(j.total)}</Td><Td className="tabular">{money(Number(j.total) - Number(j.amount_paid))}</Td><Td><StatusBadge label={titleCase(j.payment_status)} tone={PAYMENT_STATUS_TONE[j.payment_status]} /></Td></> : null}
                  <Td>{shortDate(j.due_date)}</Td>
                </tr>))}</tbody>
            </TableShell>
          )}
        </Panel>
      ) : null}
      {tab === "payments" ? (
        <Panel bodyClassName="p-0">
          {!payments.length ? <EmptyState title="No payments recorded" /> : (
            <TableShell>
              <thead><tr><Th>Date</Th><Th>Receipt</Th><Th>Job</Th><Th>Method</Th><Th>Reference</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
              <tbody>{payments.map((p) => (
                <tr key={p.id}>
                  <Td>{shortDate(p.paid_at)}</Td>
                  <Td>{p.receipt_number ? <Link to="/receipts/$id" params={{ id: p.id }} className="hover:underline">{p.receipt_number}</Link> : "—"}</Td>
                  <Td>{p.jobs?.job_number ?? "—"}</Td>
                  <Td>{titleCase(p.method)}</Td>
                  <Td>{p.reference ?? "—"}</Td>
                  <Td className="tabular">{money(p.amount)}</Td>
                  <Td><StatusBadge label={titleCase(p.status)} tone={p.status === "confirmed" ? "success" : p.status === "pending" ? "warning" : "neutral"} /></Td>
                </tr>))}</tbody>
            </TableShell>
          )}
        </Panel>
      ) : null}
      {tab === "statement" ? <Statement customer={c} jobs={live} payments={payments.filter((p) => p.status === "confirmed")} /> : null}
      {tab === "files" ? <Files id={id} files={files} notes={c.notes} canEdit={!!user?.can("customers.manage")} onChange={() => qc.invalidateQueries({ queryKey: ["customer", id] })} /> : null}
      {tab === "messages" ? <Messages customer={c} messages={messages} canSend={!!user?.can("customers.manage")} onChange={() => qc.invalidateQueries({ queryKey: ["customer", id] })} /> : null}
      {tab === "profile" ? <Profile c={c} canEdit={!!user?.can("customers.manage")} canCredit={!!user?.isAdmin} onChange={() => qc.invalidateQueries({ queryKey: ["customer", id] })} /> : null}
    </>
  );
}

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function Statement({ customer, jobs, payments }: { customer: Row; jobs: Row[]; payments: Row[] }) {
  const lines = [
    ...jobs.map((j) => ({ date: j.created_at, ref: j.job_number, desc: j.title ?? "Job", debit: Number(j.total), credit: 0 })),
    ...payments.map((p) => ({ date: p.paid_at, ref: p.receipt_number ?? "", desc: `Payment (${titleCase(p.method)})`, debit: 0, credit: Number(p.amount) })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  let bal = 0;
  return (
    <Panel title="Account statement" actions={<Btn size="sm" variant="secondary" onClick={() => window.print()}>Print statement</Btn>} bodyClassName="p-0 print-area">
      <p className="hidden px-4 pt-4 font-display font-semibold print:block">KIMO GRAPHYX — Statement for {customer.business_name || customer.name} ({customer.customer_code})</p>
      <TableShell>
        <thead><tr><Th>Date</Th><Th>Reference</Th><Th>Description</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th><Th className="text-right">Balance</Th></tr></thead>
        <tbody>{lines.map((l, i) => { bal += l.debit - l.credit; return (
          <tr key={i}><Td>{shortDate(l.date)}</Td><Td>{l.ref}</Td><Td>{l.desc}</Td><Td className="tabular text-right">{l.debit ? money(l.debit) : ""}</Td><Td className="tabular text-right">{l.credit ? money(l.credit) : ""}</Td><Td className="tabular text-right font-medium">{money(bal)}</Td></tr>); })}</tbody>
      </TableShell>
    </Panel>
  );
}

const MESSAGE_TEMPLATES: Record<string, { label: string; body: (c: Row) => string }> = {
  custom: { label: "Custom message", body: () => "" },
  job_ready: { label: "Job ready for collection", body: (c) => `Dear ${c.name}, your job at KIMO GRAPHYX is ready for collection. Kindly pass by our office or contact us for delivery arrangements. Thank you.` },
  payment_received: { label: "Payment confirmation", body: (c) => `Dear ${c.name}, we confirm receipt of your payment to KIMO GRAPHYX. Thank you for your business.` },
  balance_reminder: { label: "Outstanding balance reminder", body: (c) => `Dear ${c.name}, this is a friendly reminder of the outstanding balance on your account with KIMO GRAPHYX. Kindly settle at your earliest convenience. Thank you.` },
  quotation_ready: { label: "Quotation ready", body: (c) => `Dear ${c.name}, your quotation from KIMO GRAPHYX is ready. Please contact us to review and approve it. Thank you.` },
};

function Messages({ customer, messages, canSend, onChange }: { customer: Row; messages: Row[]; canSend: boolean; onChange: () => void }) {
  const [template, setTemplate] = useState("custom");
  const [channel, setChannel] = useState("sms");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const effective = body || (template !== "custom" ? MESSAGE_TEMPLATES[template].body(customer) : "");

  async function queue() {
    if (!effective.trim()) { toast.error("Write or select a message first."); return; }
    setBusy(true);
    try {
      await run(
        () => supabase.from("customer_messages").insert({
          customer_id: customer.id,
          channel,
          template: template === "custom" ? null : template,
          body: effective,
          status: "queued",
          provider_response: "No SMS/WhatsApp provider is configured. This message is queued only — it has not been sent.",
        }),
        "Message queued (not sent — no provider configured)",
      );
      setBody(""); setTemplate("custom");
      onChange();
    } catch { /* shown */ } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Prepare a message" description="Messages are queued in the system. Nothing is actually sent until an SMS/WhatsApp provider is connected.">
        {canSend ? (
          <div className="grid gap-4">
            <Field label="Template">
              <Select value={template} onChange={(e) => { setTemplate(e.target.value); setBody(""); }}>
                {Object.entries(MESSAGE_TEMPLATES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Channel">
              <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </Select>
            </Field>
            <Field label="Message" required>
              <Textarea rows={5} value={effective} onChange={(e) => setBody(e.target.value)} placeholder="Type a custom message…" />
            </Field>
            <p className="text-xs text-muted-foreground">Recipient: {customer.name} · {customer.phone} · prefers {titleCase(customer.preferred_contact)}</p>
            <div><Btn onClick={queue} loading={busy}>Queue message</Btn></div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You don't have permission to prepare customer messages.</p>
        )}
      </Panel>
      <Panel title="Message history" bodyClassName="p-0">
        {!messages.length ? <EmptyState title="No messages yet" message="Prepared messages will be listed here with their status." /> : (
          <ul className="divide-y divide-border text-sm">
            {messages.map((m) => (
              <li key={m.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{titleCase(m.channel)}{m.template ? ` · ${MESSAGE_TEMPLATES[m.template]?.label ?? m.template}` : ""}</span>
                  <StatusBadge label={m.status === "queued" ? "Queued — not sent" : titleCase(m.status)} tone={m.status === "sent" ? "success" : "warning"} />
                </div>
                <p className="mt-1 text-muted-foreground">{m.body}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">{shortDate(m.created_at)}{m.provider_response ? ` · ${m.provider_response}` : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Files({ id, files, notes, canEdit, onChange }: { id: string; files: Row[]; notes: string | null; canEdit: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState(notes ?? "");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Files" actions={canEdit ? (
        <label className="cursor-pointer text-sm font-medium text-accent-foreground underline">
          {busy ? "Uploading…" : "Upload file"}
          <input type="file" accept={ACCEPT} className="sr-only" disabled={busy} onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return; setBusy(true);
            try { await uploadFile("customer", id, f); toast.success("File uploaded"); onChange(); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); e.target.value = ""; }
          }} />
        </label>) : null}>
        {!files.length ? <p className="text-sm text-muted-foreground">No files yet. Upload ID copies, artwork or agreements (JPG, PNG, PDF, DOC, XLS up to 10 MB).</p> : (
          <ul className="divide-y divide-border text-sm">{files.map((f) => (
            <li key={f.id} className="flex justify-between py-2"><button className="hover:underline" onClick={() => openFile(f.file_path)}>{f.file_name}</button><span className="text-xs text-muted-foreground">{shortDate(f.created_at)}</span></li>))}</ul>
        )}
      </Panel>
      <Panel title="Notes">
        <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} disabled={!canEdit} />
        {canEdit ? <Btn className="mt-2" onClick={() => run(() => supabase.from("customers").update({ notes: text }).eq("id", id), "Notes saved").then(onChange).catch(() => {})}>Save notes</Btn> : null}
      </Panel>
    </div>
  );
}

function Profile({ c, canEdit, canCredit, onChange }: { c: Row; canEdit: boolean; canCredit: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const patch: Row = { name: f.name, business_name: f.business_name || null, phone: f.phone, alt_phone: f.alt_phone || null, email: f.email || null, address: f.address || null, location: f.location || null, status: f.status };
    if (canCredit) { patch.credit_limit = Number(f.credit_limit || 0); patch.credit_hold = f.credit_hold === "on"; }
    setBusy(true);
    try { await run(() => supabase.from("customers").update(patch as never).eq("id", c.id), "Customer updated"); onChange(); } catch { /* shown */ } finally { setBusy(false); }
  }
  return (
    <Panel title="Profile">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required><Input name="name" defaultValue={c.name} required disabled={!canEdit} /></Field>
        <Field label="Business / stage name"><Input name="business_name" defaultValue={c.business_name ?? ""} disabled={!canEdit} /></Field>
        <Field label="Phone" required><Input name="phone" defaultValue={c.phone} required disabled={!canEdit} /></Field>
        <Field label="Alt phone"><Input name="alt_phone" defaultValue={c.alt_phone ?? ""} disabled={!canEdit} /></Field>
        <Field label="Email"><Input name="email" type="email" defaultValue={c.email ?? ""} disabled={!canEdit} /></Field>
        <Field label="Address"><Input name="address" defaultValue={c.address ?? ""} disabled={!canEdit} /></Field>
        <Field label="Location"><Input name="location" defaultValue={c.location ?? ""} disabled={!canEdit} /></Field>
        <Field label="Status"><select name="status" defaultValue={c.status} disabled={!canEdit} className="h-9 rounded-sm border border-input bg-surface px-2 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Field label="Credit limit (GHS)" hint={canCredit ? undefined : "Administrators only"}><Input name="credit_limit" type="number" min={0} step="0.01" defaultValue={c.credit_limit} disabled={!canCredit} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="credit_hold" defaultChecked={c.credit_hold} disabled={!canCredit} /> Credit hold</label>
        <p className="text-xs text-muted-foreground sm:col-span-2">Registered {shortDate(c.registration_date)} · prefers {titleCase(c.preferred_contact)}</p>
        {canEdit ? <div className="sm:col-span-2"><Btn type="submit" loading={busy}>Save changes</Btn></div> : null}
      </form>
    </Panel>
  );
}
