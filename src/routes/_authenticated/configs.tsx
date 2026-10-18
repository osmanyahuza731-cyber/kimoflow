import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { categoriesQuery, companyQuery, customerTypesQuery, servicesQuery, unwrap } from "@/lib/queries";
import { ALL_ROLES, ROLE_LABELS, type AppRole } from "@/lib/access";
import { run } from "@/lib/actions";
import { dateTime, money, titleCase } from "@/lib/format";
import { RequirePermission } from "@/components/access-denied";
import { Btn, Field, Input, Modal, Select, Tabs, Textarea } from "@/components/forms";
import { EmptyState, LoadingRow, PageHeader, Panel, StatusBadge, TableShell, Td, Th } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/configs")({
  head: () => ({
    meta: [
      { title: "Configs — KIMO GRAPHYX" },
      { name: "description", content: "Categories, services, pricing, stores, accounts, users and company settings." },
      { property: "og:title", content: "Configs — KIMO GRAPHYX" },
      { property: "og:description", content: "System configuration." },
    ],
  }),
  component: () => (
    <RequirePermission perm="config.manage">
      <Configs />
    </RequirePermission>
  ),
});

type Tab = "categories" | "services" | "types" | "pricing" | "stores" | "accounts" | "company" | "users" | "audit";
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function Configs() {
  const [tab, setTab] = useState<Tab>("categories");
  return (
    <>
      <PageHeader title="Configs" description="Everything the business runs on — nothing here is hard-coded in the screens." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: "categories", label: "Categories" }, { value: "services", label: "Services" }, { value: "types", label: "Customer types" },
        { value: "pricing", label: "Pricing" }, { value: "stores", label: "Stores" }, { value: "accounts", label: "Payment accounts" },
        { value: "company", label: "Company profile" }, { value: "users", label: "Users & roles" }, { value: "audit", label: "Audit log" },
      ]} />
      {tab === "categories" ? <Crud table="categories" queryKey={["categories"]} order="sort_order" fields={[{ k: "name", label: "Name", req: true }, { k: "description", label: "Description" }, { k: "sort_order", label: "Order", type: "number" }, { k: "is_active", label: "Active", type: "bool" }]} /> : null}
      {tab === "services" ? <Services /> : null}
      {tab === "types" ? <Crud table="customer_types" queryKey={["customer_types"]} order="sort_order" fields={[{ k: "code", label: "Code", req: true }, { k: "name", label: "Name", req: true }, { k: "default_discount_percent", label: "Default discount %", type: "number" }, { k: "sort_order", label: "Order", type: "number" }, { k: "is_active", label: "Active", type: "bool" }]} /> : null}
      {tab === "pricing" ? <Pricing /> : null}
      {tab === "stores" ? <Crud table="stores" queryKey={["stores"]} order="name" fields={[{ k: "name", label: "Name", req: true }, { k: "location", label: "Location" }, { k: "description", label: "Description" }, { k: "is_active", label: "Active", type: "bool" }]} /> : null}
      {tab === "accounts" ? <Crud table="payment_accounts" queryKey={["payment_accounts"]} order="name" fields={[{ k: "name", label: "Name", req: true }, { k: "account_type", label: "Type", type: "select", options: ["cash", "momo", "bank"], req: true }, { k: "account_number", label: "Account / wallet no." }, { k: "provider", label: "Provider" }, { k: "is_active", label: "Active", type: "bool" }]} /> : null}
      {tab === "company" ? <Company /> : null}
      {tab === "users" ? <Users /> : null}
      {tab === "audit" ? <Audit /> : null}
    </>
  );
}

type FieldDef = { k: string; label: string; req?: boolean; type?: "text" | "number" | "bool" | "select" | "ref"; options?: string[]; refOptions?: { value: string; label: string }[] };

function FormFields({ fields, row }: { fields: FieldDef[]; row: Row | null }) {
  return (
    <>
      {fields.map((f) => f.type === "bool" ? (
        <label key={f.k} className="flex items-center gap-2 text-sm"><input type="checkbox" name={f.k} defaultChecked={row ? !!row[f.k] : true} /> {f.label}</label>
      ) : f.type === "select" || f.type === "ref" ? (
        <Field key={f.k} label={f.label} required={!!f.req}><Select name={f.k} defaultValue={row?.[f.k] ?? ""} required={f.req}><option value="">—</option>{(f.refOptions ?? f.options?.map((o) => ({ value: o, label: titleCase(o) })) ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
      ) : (
        <Field key={f.k} label={f.label} required={!!f.req}><Input name={f.k} type={f.type === "number" ? "number" : "text"} step="any" min={f.type === "number" ? 0 : undefined} defaultValue={row?.[f.k] ?? ""} required={f.req} /></Field>
      ))}
    </>
  );
}

function readForm(e: React.FormEvent<HTMLFormElement>, fields: FieldDef[]) {
  const fd = new FormData(e.currentTarget);
  const out: Row = {};
  fields.forEach((f) => {
    const v = fd.get(f.k);
    out[f.k] = f.type === "bool" ? v === "on" : f.type === "number" ? (v === "" || v == null ? null : Number(v)) : v === "" ? null : v;
  });
  return out;
}

function Crud({ table, queryKey, order, fields, extra }: { table: string; queryKey: string[]; order: string; fields: FieldDef[]; extra?: (r: Row) => React.ReactNode }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Row | null | "new">(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = () => supabase.from(table as any) as any;
  const q = useQuery({ queryKey, queryFn: () => unwrap(t().select("*").order(order)) });
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = readForm(e, fields);
    try {
      if (edit === "new") await run(() => t().insert(data), "Saved");
      else await run(() => t().update(data).eq("id", (edit as Row).id), "Updated");
      qc.invalidateQueries({ queryKey });
      setEdit(null);
    } catch { /* shown */ }
  }
  return (
    <Panel bodyClassName="p-0" actions={<Btn size="sm" onClick={() => setEdit("new")}>Add</Btn>}>
      {q.isLoading ? <LoadingRow /> : !q.data?.length ? <EmptyState title="Nothing configured yet" /> : (
        <TableShell>
          <thead><tr>{fields.map((f) => <Th key={f.k}>{f.label}</Th>)}<Th /></tr></thead>
          <tbody>{q.data.map((r) => (
            <tr key={r.id}>{fields.map((f) => <Td key={f.k}>{f.type === "bool" ? <StatusBadge label={r[f.k] ? "Yes" : "No"} tone={r[f.k] ? "success" : "neutral"} /> : f.type === "ref" ? f.refOptions?.find((o) => o.value === r[f.k])?.label ?? "—" : f.type === "select" ? titleCase(r[f.k]) : String(r[f.k] ?? "—")}</Td>)}
              <Td className="whitespace-nowrap text-right">{extra?.(r)}<Btn size="sm" variant="ghost" onClick={() => setEdit(r)}>Edit</Btn></Td></tr>))}</tbody>
        </TableShell>
      )}
      <Modal open={edit !== null} onOpenChange={(v) => !v && setEdit(null)} title={edit === "new" ? "Add" : "Edit"}>
        <form onSubmit={save} className="grid gap-3">
          <FormFields fields={fields} row={edit === "new" ? null : edit} />
          <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={() => setEdit(null)}>Cancel</Btn><Btn type="submit">Save</Btn></div>
        </form>
      </Modal>
    </Panel>
  );
}

function Services() {
  const cats = useQuery(categoriesQuery);
  const machines = useQuery({ queryKey: ["machines-lite"], queryFn: () => unwrap(supabase.from("machines").select("id, name, status").order("name")) });
  const [recipe, setRecipe] = useState<Row | null>(null);
  if (!cats.data || !machines.data) return <LoadingRow />;
  return (
    <>
      <Crud table="services" queryKey={["services"]} order="name" fields={[
        { k: "name", label: "Service", req: true },
        { k: "category_id", label: "Category", type: "ref", req: true, refOptions: cats.data.map((c) => ({ value: c.id, label: c.name })) },
        { k: "unit", label: "Unit", req: true },
        { k: "base_price", label: "Base price", type: "number", req: true },
        { k: "min_quantity", label: "Min qty", type: "number" },
        { k: "labour_cost", label: "Labour / unit", type: "number" },
        { k: "machine_id", label: "Machine", type: "ref", refOptions: machines.data.map((m) => ({ value: m.id, label: m.name })) },
        { k: "production_minutes", label: "Prod. minutes", type: "number" },
        { k: "default_margin_percent", label: "Margin %", type: "number" },
        { k: "is_active", label: "Active", type: "bool" },
      ]} extra={(r) => <Btn size="sm" variant="ghost" onClick={() => setRecipe(r)}>Materials</Btn>} />
      {recipe ? <Recipe service={recipe} onClose={() => setRecipe(null)} /> : null}
    </>
  );
}

function Recipe({ service, onClose }: { service: Row; onClose: () => void }) {
  const qc = useQueryClient();
  const items = useQuery({ queryKey: ["inventory-lite"], queryFn: () => unwrap(supabase.from("inventory_items").select("id, name, unit, stores(name)").eq("is_active", true).order("name")) });
  const q = useQuery({ queryKey: ["recipe", service.id], queryFn: () => unwrap(supabase.from("service_materials").select("*, inventory_items(name, unit)").eq("service_id", service.id)) });
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try { await run(() => supabase.from("service_materials").insert({ service_id: service.id, inventory_item_id: f.item!, quantity_per_unit: Number(f.qty) }), "Material added"); qc.invalidateQueries({ queryKey: ["recipe", service.id] }); } catch { /* shown */ }
  }
  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title={`Materials per ${service.unit} — ${service.name}`} description="Used to calculate material requirements and block production when stock is short.">
      <ul className="text-sm">{q.data?.map((m) => (
        <li key={m.id} className="flex items-center justify-between border-b border-border py-1.5"><span>{m.inventory_items?.name}: {m.quantity_per_unit} {m.inventory_items?.unit}</span><Btn size="sm" variant="ghost" onClick={async () => { await run(() => supabase.from("service_materials").delete().eq("id", m.id), "Removed").catch(() => {}); qc.invalidateQueries({ queryKey: ["recipe", service.id] }); }}>Remove</Btn></li>))}</ul>
      <form onSubmit={add} className="mt-2 grid grid-cols-[1fr_100px_auto] items-end gap-2">
        <Field label="Material"><Select name="item" required defaultValue="">{[<option key="" value="">Select…</option>, ...(items.data ?? []).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.stores?.name})</option>)]}</Select></Field>
        <Field label="Qty / unit"><Input name="qty" type="number" step="any" min={0.0001} required /></Field>
        <Btn type="submit">Add</Btn>
      </form>
    </Modal>
  );
}

function Pricing() {
  const services = useQuery(servicesQuery);
  const types = useQuery(customerTypesQuery);
  if (!services.data || !types.data) return <LoadingRow />;
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">Rules override the base price for a customer group. Who changed a price, and when, is recorded in the audit log.</p>
      <Crud table="pricing_rules" queryKey={["pricing_rules"]} order="created_at" fields={[
        { k: "service_id", label: "Service", type: "ref", req: true, refOptions: services.data.map((s) => ({ value: s.id, label: s.name })) },
        { k: "customer_type_id", label: "Customer group", type: "ref", refOptions: types.data.map((t) => ({ value: t.id, label: t.name })) },
        { k: "price", label: "Group price", type: "number" },
        { k: "discount_percent", label: "Discount %", type: "number" },
        { k: "promo_price", label: "Promo price", type: "number" },
        { k: "minimum_price", label: "Minimum price", type: "number" },
        { k: "valid_from", label: "Valid from (YYYY-MM-DD)" },
        { k: "valid_to", label: "Valid to (YYYY-MM-DD)" },
        { k: "is_active", label: "Active", type: "bool" },
      ]} />
    </>
  );
}

function Company() {
  const q = useQuery(companyQuery);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  if (q.isLoading) return <LoadingRow />;
  const c = q.data ?? {};
  const keys: [string, string][] = [["name", "Company name"], ["address", "Address"], ["phone", "Phone"], ["email", "Email"], ["website", "Website"], ["social", "Social handles"], ["tin", "Tax ID (TIN)"]];
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      await run(() => supabase.from("settings").upsert({ key: "company", value, updated_by: u.user?.id ?? null }), "Company profile saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch { /* shown */ } finally { setBusy(false); }
  }
  return (
    <Panel title="Company profile" description="Appears on quotations, invoices, receipts, statements and job sheets.">
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        {keys.map(([k, l]) => <Field key={k} label={l}><Input name={k} defaultValue={c[k] ?? ""} /></Field>)}
        <Field label="Quotation terms" className="sm:col-span-2"><Textarea name="quotation_terms" defaultValue={c.quotation_terms ?? ""} /></Field>
        <Field label="Invoice footer" className="sm:col-span-2"><Textarea name="invoice_footer" defaultValue={c.invoice_footer ?? ""} /></Field>
        <Field label="Receipt footer" className="sm:col-span-2"><Textarea name="receipt_footer" defaultValue={c.receipt_footer ?? ""} /></Field>
        <div className="sm:col-span-2"><Btn type="submit" loading={busy}>Save profile</Btn></div>
      </form>
    </Panel>
  );
}

function Users() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["users-roles"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        unwrap(supabase.from("profiles").select("*").order("full_name")),
        unwrap(supabase.from("user_roles").select("user_id, role")),
      ]);
      return profiles.map((p) => ({ ...p, roles: roles.filter((r) => r.user_id === p.id).map((r) => r.role as AppRole) }));
    },
  });
  const [staff, setStaff] = useState<Row | null>(null);
  async function toggle(uid: string, role: AppRole, grant: boolean) {
    const { error } = await supabase.rpc("set_user_role", { _user: uid, _role: role, _grant: grant });
    if (error) { toast.error(error.message); return; }
    toast.success(grant ? `${ROLE_LABELS[role]} granted` : `${ROLE_LABELS[role]} removed`);
    qc.invalidateQueries({ queryKey: ["users-roles"] });
  }
  if (q.isLoading) return <LoadingRow />;
  return (
    <Panel bodyClassName="p-0" title="Staff accounts" description="New staff sign up on the sign-in page, then an administrator assigns roles here. You can't change your own roles.">
      <TableShell>
        <thead><tr><Th>Name</Th><Th>Position</Th><Th>Roles</Th><Th>Status</Th><Th /></tr></thead>
        <tbody>{q.data?.map((p) => (
          <tr key={p.id}>
            <Td className="font-medium">{p.full_name || "—"}<span className="block text-xs text-muted-foreground">{p.email}</span></Td>
            <Td>{p.position ?? "—"}<span className="block text-xs text-muted-foreground">{p.department}</span></Td>
            <Td><div className="flex max-w-md flex-wrap gap-1">{ALL_ROLES.map((r) => {
              const has = p.roles.includes(r);
              return <button key={r} disabled={p.id === user?.id} onClick={() => toggle(p.id, r, !has)} className={`rounded-sm border px-1.5 py-0.5 text-xs disabled:opacity-50 ${has ? "border-accent bg-accent/15 font-medium" : "border-border text-muted-foreground hover:bg-muted"}`}>{ROLE_LABELS[r]}</button>;
            })}</div></Td>
            <Td><StatusBadge label={p.is_active ? "Active" : "Deactivated"} tone={p.is_active ? "success" : "danger"} /></Td>
            <Td><Btn size="sm" variant="ghost" onClick={() => setStaff(p)}>Profile</Btn></Td>
          </tr>))}</tbody>
      </TableShell>
      {staff ? <StaffProfile p={staff} self={staff.id === user?.id} onClose={() => { setStaff(null); qc.invalidateQueries({ queryKey: ["users-roles"] }); }} /> : null}
    </Panel>
  );
}

function StaffProfile({ p, self, onClose }: { p: Row; self: boolean; onClose: () => void }) {
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      await run(() => supabase.from("profiles").update({ full_name: f.full_name!, phone: f.phone || null, position: f.position || null, department: f.department || null, employment_status: f.employment_status!, start_date: f.start_date || null, emergency_contact: f.emergency_contact || null, notes: f.notes || null, ...(self ? {} : { is_active: f.is_active === "on" }) }).eq("id", p.id), "Staff profile saved");
      onClose();
    } catch { /* shown */ }
  }
  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title={p.full_name || p.email} wide>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required><Input name="full_name" defaultValue={p.full_name} required /></Field>
        <Field label="Phone"><Input name="phone" defaultValue={p.phone ?? ""} /></Field>
        <Field label="Position"><Input name="position" defaultValue={p.position ?? ""} /></Field>
        <Field label="Department"><Input name="department" defaultValue={p.department ?? ""} /></Field>
        <Field label="Employment status"><Select name="employment_status" defaultValue={p.employment_status}><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="intern">Intern</option><option value="terminated">Terminated</option></Select></Field>
        <Field label="Start date"><Input name="start_date" type="date" defaultValue={p.start_date ?? ""} /></Field>
        <Field label="Emergency contact" className="sm:col-span-2"><Input name="emergency_contact" defaultValue={p.emergency_contact ?? ""} /></Field>
        <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" defaultValue={p.notes ?? ""} /></Field>
        {!self ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={p.is_active} /> Account active (untick to deactivate)</label> : null}
        <div className="sm:col-span-2 flex justify-end"><Btn type="submit">Save</Btn></div>
      </form>
    </Modal>
  );
}

function Audit() {
  const q = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const [logs, profiles] = await Promise.all([
        unwrap(supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)),
        unwrap(supabase.from("profiles").select("id, full_name")),
      ]);
      const names = new Map(profiles.map((p) => [p.id, p.full_name]));
      return logs.map((a) => ({ ...a, user_name: a.user_id ? (names.get(a.user_id) ?? null) : null }));
    },
  });
  if (q.isLoading) return <LoadingRow />;
  return (
    <Panel bodyClassName="p-0" title="Audit log" description="Append-only. Nobody — including administrators — can edit or delete these entries.">
      <TableShell>
        <thead><tr><Th>When</Th><Th>User</Th><Th>Action</Th><Th>Reason</Th><Th>Change</Th></tr></thead>
        <tbody>{q.data?.map((a) => (
          <tr key={a.id}><Td className="whitespace-nowrap">{dateTime(a.created_at)}</Td><Td>{a.profiles?.full_name ?? "System"}</Td><Td>{a.action}</Td><Td className="text-xs">{a.reason ?? ""}</Td><Td className="max-w-md truncate text-xs text-muted-foreground" title={JSON.stringify(a.after_value)}>{a.after_value ? JSON.stringify(a.after_value).slice(0, 120) : ""}</Td></tr>))}</tbody>
      </TableShell>
    </Panel>
  );
}

export { money };
