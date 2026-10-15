import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { storesQuery, unwrap } from "@/lib/queries";
import { downloadCsv, errMsg, run } from "@/lib/actions";
import { dateTime, money, number, shortDate, titleCase } from "@/lib/format";
import { RequirePermission } from "@/components/access-denied";
import { Btn, Field, Input, Modal, Select, Tabs, Textarea } from "@/components/forms";
import { EmptyState, ErrorNote, LoadingRow, PageHeader, Panel, StatusBadge, TableShell, Td, Th } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({
    meta: [
      { title: "Assets & Stock — KIMO GRAPHYX" },
      { name: "description", content: "Stores, stock, machines, maintenance and company assets." },
      { property: "og:title", content: "Assets & Stock — KIMO GRAPHYX" },
      { property: "og:description", content: "Inventory, machines and assets." },
    ],
  }),
  component: () => (
    <RequirePermission perm="assets.view">
      <Assets />
    </RequirePermission>
  ),
});

type Tab = "stock" | "movements" | "machines" | "assets";

function Assets() {
  const [tab, setTab] = useState<Tab>("stock");
  return (
    <>
      <PageHeader title="Assets & stock" description="Materials across all stores, stock movements, machines with counters and maintenance, and other company assets." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: "stock", label: "Stock" },
        { value: "movements", label: "Stock movements" },
        { value: "machines", label: "Machines" },
        { value: "assets", label: "Other assets" },
      ]} />
      {tab === "stock" ? <Stock /> : null}
      {tab === "movements" ? <Movements /> : null}
      {tab === "machines" ? <Machines /> : null}
      {tab === "assets" ? <OtherAssets /> : null}
    </>
  );
}

function Stock() {
  const { user } = useCurrentUser();
  const canMove = !!(user?.isAdmin || user?.roles.includes("storekeeper"));
  const [store, setStore] = useState("");
  const [term, setTerm] = useState("");
  const [low, setLow] = useState(false);
  const stores = useQuery(storesQuery);
  const q = useQuery({
    queryKey: ["inventory", store, term],
    queryFn: () => {
      let s = supabase.from("inventory_items").select("*, stores(name)").eq("is_active", true).order("name");
      if (store) s = s.eq("store_id", store);
      const t = term.trim().replace(/[%,()]/g, "");
      if (t) s = s.or(`name.ilike.%${t}%,item_code.ilike.%${t}%,category.ilike.%${t}%`);
      return unwrap(s);
    },
  });
  const rows = (q.data ?? []).filter((i) => !low || Number(i.quantity) <= Number(i.reorder_level));
  const value = rows.reduce((s, i) => s + Number(i.quantity) * Number(i.cost_per_unit), 0);
  return (
    <Panel bodyClassName="p-0" title={`Stock value ${money(value)}`} actions={
      <div className="flex gap-2">
        <Btn size="sm" variant="secondary" onClick={() => downloadCsv("stock.csv", rows.map((i) => ({ code: i.item_code, name: i.name, store: i.stores?.name, qty: i.quantity, unit: i.unit, reorder: i.reorder_level, cost: i.cost_per_unit, value: Number(i.quantity) * Number(i.cost_per_unit) })))}>Export CSV</Btn>
        {canMove ? <NewItem /> : null}
      </div>}>
      <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
        <Input placeholder="Search item name, code or category" aria-label="Search" value={term} onChange={(e) => setTerm(e.target.value)} />
        <Select className="sm:w-56" aria-label="Store" value={store} onChange={(e) => setStore(e.target.value)}><option value="">All stores</option>{stores.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
        <label className="flex items-center gap-2 whitespace-nowrap text-sm"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> Low stock only</label>
      </div>
      {q.isLoading ? <LoadingRow /> : !rows.length ? <EmptyState title="No stock items found" /> : (
        <TableShell>
          <thead><tr><Th>Code</Th><Th>Item</Th><Th className="hidden md:table-cell">Store</Th><Th className="text-right">Qty</Th><Th className="hidden md:table-cell text-right">Reorder at</Th><Th className="hidden md:table-cell text-right">Unit cost</Th><Th>Status</Th>{canMove ? <Th /> : null}</tr></thead>
          <tbody>{rows.map((i) => {
            const qty = Number(i.quantity);
            return (
              <tr key={i.id}><Td className="tabular text-xs">{i.item_code}</Td><Td>{i.name}<span className="block text-xs text-muted-foreground">{i.category}</span></Td><Td className="hidden md:table-cell">{i.stores?.name}</Td><Td className="tabular text-right">{number(qty, 2)} {i.unit}</Td><Td className="hidden md:table-cell tabular text-right">{number(i.reorder_level, 2)}</Td><Td className="hidden md:table-cell tabular text-right">{money(i.cost_per_unit)}</Td>
                <Td>{qty <= 0 ? <StatusBadge label="Out of stock" tone="danger" /> : qty <= Number(i.reorder_level) ? <StatusBadge label="Low" tone="warning" /> : <StatusBadge label="OK" tone="success" />}</Td>
                {canMove ? <Td className="text-right"><MoveStock item={i} /></Td> : null}</tr>);
          })}</tbody>
        </TableShell>
      )}
    </Panel>
  );
}

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const MOVES = [
  { value: "stock_in", label: "Stock in (purchase)" },
  { value: "stock_out", label: "Stock out (issue)" },
  { value: "transfer", label: "Transfer to another store" },
  { value: "adjustment_in", label: "Adjustment + (count correction)" },
  { value: "adjustment_out", label: "Adjustment − (count correction)" },
  { value: "damaged", label: "Damaged / write-off" },
  { value: "return", label: "Return to stock" },
];

function MoveStock({ item }: { item: Row }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("stock_in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const stores = useQuery(storesQuery);
  const qc = useQueryClient();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    const { error: err } = await supabase.rpc("stock_move", { _item: item.id, _type: type, _qty: Number(f.qty), _to_store: (f.to_store || null) as string, _unit_cost: Number(f.unit_cost || 0), _reference: f.reference ?? "", _reason: f.reason ?? "" });
    setBusy(false);
    if (err) return setError(err.message);
    toast.success("Stock updated");
    qc.invalidateQueries();
    setOpen(false);
  }
  return (
    <>
      <Btn size="sm" variant="secondary" onClick={() => setOpen(true)}>Move stock</Btn>
      <Modal open={open} onOpenChange={setOpen} title={`Move stock — ${item.name}`} description={`Current: ${number(item.quantity, 2)} ${item.unit} in ${item.stores?.name}. Stock can never go below zero.`}>
        <form onSubmit={submit} className="grid gap-3">
          <Field label="Movement" required><Select value={type} onChange={(e) => setType(e.target.value)}>{MOVES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select></Field>
          <Field label={`Quantity (${item.unit})`} required><Input name="qty" type="number" min={0.01} step="0.01" required /></Field>
          {type === "stock_in" ? <Field label="Unit cost (GHS)" hint="Updates the weighted average cost"><Input name="unit_cost" type="number" min={0} step="0.01" /></Field> : null}
          {type === "transfer" ? <Field label="Destination store" required><Select name="to_store" required defaultValue=""><option value="">Select…</option>{stores.data?.filter((s) => s.id !== item.store_id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field> : null}
          <Field label="Reference (invoice / waybill)"><Input name="reference" /></Field>
          <Field label="Reason" required={!["stock_in", "return", "adjustment_in"].includes(type)}><Textarea name="reason" rows={2} /></Field>
          {error ? <ErrorNote message={error} /> : null}
          <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={() => setOpen(false)}>Cancel</Btn><Btn type="submit" loading={busy}>Save movement</Btn></div>
        </form>
      </Modal>
    </>
  );
}

function NewItem() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const stores = useQuery(storesQuery);
  const qc = useQueryClient();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      await run(() => supabase.from("inventory_items").insert({ item_code: f.item_code!, name: f.name!, category: f.category || null, unit: f.unit!, store_id: f.store_id!, quantity: 0, min_quantity: Number(f.reorder_level || 0), reorder_level: Number(f.reorder_level || 0), cost_per_unit: Number(f.cost || 0), supplier: f.supplier || null }), "Item created — use Move stock to receive quantity");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setOpen(false);
    } catch { /* shown */ } finally { setBusy(false); }
  }
  return (
    <>
      <Btn size="sm" onClick={() => setOpen(true)}>New item</Btn>
      <Modal open={open} onOpenChange={setOpen} title="New stock item" description="Items start at zero. Receive quantity with a stock-in movement so it's recorded.">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Item code" required><Input name="item_code" required /></Field>
          <Field label="Name" required><Input name="name" required /></Field>
          <Field label="Category"><Input name="category" /></Field>
          <Field label="Unit" required><Input name="unit" placeholder="" required /></Field>
          <Field label="Store" required><Select name="store_id" required defaultValue="">{[<option key="" value="">Select…</option>, ...(stores.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)]}</Select></Field>
          <Field label="Reorder level"><Input name="reorder_level" type="number" min={0} step="0.01" /></Field>
          <Field label="Cost per unit (GHS)"><Input name="cost" type="number" min={0} step="0.01" /></Field>
          <Field label="Supplier"><Input name="supplier" /></Field>
          <div className="sm:col-span-2 flex justify-end"><Btn type="submit" loading={busy}>Create item</Btn></div>
        </form>
      </Modal>
    </>
  );
}

function Movements() {
  const q = useQuery({ queryKey: ["inventory_transactions"], queryFn: () => unwrap(supabase.from("inventory_transactions").select("*, inventory_items(name, unit, item_code), jobs(job_number), profiles:created_by(full_name)").order("created_at", { ascending: false }).limit(200)) });
  if (q.isLoading) return <LoadingRow />;
  return (
    <Panel bodyClassName="p-0" actions={<Btn size="sm" variant="secondary" onClick={() => downloadCsv("stock-movements.csv", (q.data ?? []).map((t) => ({ date: t.created_at, item: t.inventory_items?.name, type: t.transaction_type, qty: t.quantity, balance: t.balance_after, job: t.jobs?.job_number, reason: t.reason })))}>Export CSV</Btn>} title="Recent movements">
      {!q.data?.length ? <EmptyState title="No stock movements yet" message="Receiving, issuing and job consumption will be listed here." /> : (
        <TableShell>
          <thead><tr><Th>Date</Th><Th>Item</Th><Th>Type</Th><Th className="text-right">Qty</Th><Th className="text-right">Balance</Th><Th>Job / ref</Th><Th>By</Th><Th>Reason</Th></tr></thead>
          <tbody>{q.data.map((t) => (
            <tr key={t.id}><Td>{dateTime(t.created_at)}</Td><Td>{t.inventory_items?.name}</Td><Td>{titleCase(t.transaction_type)}</Td><Td className="tabular text-right">{number(t.quantity, 2)} {t.inventory_items?.unit}</Td><Td className="tabular text-right">{number(t.balance_after, 2)}</Td><Td>{t.jobs?.job_number ?? t.reference ?? "—"}</Td><Td>{t.profiles?.full_name ?? "—"}</Td><Td className="text-xs">{t.reason}</Td></tr>))}</tbody>
        </TableShell>
      )}
    </Panel>
  );
}

function Machines() {
  const { user } = useCurrentUser();
  const canManage = !!user?.can("assets.manage");
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["machines"], queryFn: () => unwrap(supabase.from("machines").select("*, machine_readings(reading, reading_date), maintenance_records(maintenance_date, maintenance_type, cost, service_provider)").order("name")) });
  const [sel, setSel] = useState<Row | null>(null);
  if (q.isLoading) return <LoadingRow />;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <Panel bodyClassName="p-0">
        {!q.data?.length ? <EmptyState title="No machines registered" /> : (
          <TableShell>
            <thead><tr><Th>Machine</Th><Th className="hidden md:table-cell">Serial</Th><Th>Status</Th><Th className="text-right">Counter</Th><Th>Last service</Th><Th>Next service</Th><Th /></tr></thead>
            <tbody>{q.data.map((m) => {
              const due = m.next_maintenance && m.next_maintenance <= today;
              return (
                <tr key={m.id}><Td className="font-medium">{m.name}<span className="block text-xs text-muted-foreground">{[m.manufacturer, m.model].filter(Boolean).join(" ")}</span></Td><Td className="hidden md:table-cell text-xs">{m.serial_number ?? "—"}</Td><Td><StatusBadge label={titleCase(m.status)} tone={m.status === "operational" ? "success" : m.status === "out_of_service" ? "danger" : "warning"} /></Td><Td className="tabular text-right">{number(m.current_counter)}</Td><Td>{shortDate(m.last_maintenance)}</Td><Td className={due ? "font-medium text-destructive" : ""}>{shortDate(m.next_maintenance)}{due ? " · due" : ""}</Td><Td className="text-right"><Btn size="sm" variant="secondary" onClick={() => setSel(m)}>Open</Btn></Td></tr>);
            })}</tbody>
          </TableShell>
        )}
      </Panel>
      {sel ? <MachineDialog m={sel} canManage={canManage} onClose={() => setSel(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ["machines"] }); setSel(null); }} /> : null}
    </>
  );
}

function MachineDialog({ m, canManage, onClose, onSaved }: { m: Row; canManage: boolean; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  async function reading(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = Number(f.reading);
    if (m.current_counter != null && r < Number(m.current_counter)) { toast.error("Counter cannot go backwards"); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      await run(() => supabase.from("machine_readings").insert({ machine_id: m.id, reading: r, reading_date: f.date!, recorded_by: u.user?.id ?? null }), "Reading recorded");
      await supabase.from("machines").update({ current_counter: r }).eq("id", m.id);
      onSaved();
    } catch { /* shown */ } finally { setBusy(false); }
  }
  async function maint(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      await run(() => supabase.from("maintenance_records").insert({ machine_id: m.id, maintenance_date: f.date!, maintenance_type: f.type!, description: f.description || null, cost: Number(f.cost || 0), service_provider: f.provider || null, parts_replaced: f.parts || null, next_maintenance: f.next || null, created_by: u.user?.id ?? null }), "Maintenance logged");
      await supabase.from("machines").update({ last_maintenance: f.date!, next_maintenance: f.next || null, status: f.status! }).eq("id", m.id);
      onSaved();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  }
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title={m.name} description={`Purchased ${shortDate(m.purchase_date)} · ${money(m.purchase_price)} · warranty to ${shortDate(m.warranty_expiry)}`} wide>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Counter history</h3>
          <ul className="max-h-40 overflow-y-auto text-sm">{(m.machine_readings ?? []).sort((a: Row, b: Row) => b.reading_date.localeCompare(a.reading_date)).map((r: Row, i: number) => <li key={i} className="flex justify-between border-b border-border py-1"><span>{shortDate(r.reading_date)}</span><span className="tabular">{number(r.reading)}</span></li>)}</ul>
          {canManage ? <form onSubmit={reading} className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2"><Field label="New reading"><Input name="reading" type="number" min={0} required /></Field><Field label="Date"><Input name="date" type="date" defaultValue={today} required /></Field><Btn type="submit" loading={busy}>Save</Btn></form> : null}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Maintenance history</h3>
          <ul className="max-h-40 overflow-y-auto text-sm">{(m.maintenance_records ?? []).map((r: Row, i: number) => <li key={i} className="border-b border-border py-1">{shortDate(r.maintenance_date)} · {titleCase(r.maintenance_type)} · {money(r.cost)}{r.service_provider ? ` · ${r.service_provider}` : ""}</li>)}</ul>
        </div>
      </div>
      {canManage ? (
        <form onSubmit={maint} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <Field label="Date" required><Input name="date" type="date" defaultValue={today} required /></Field>
          <Field label="Type" required><Select name="type" defaultValue="preventive"><option value="preventive">Preventive</option><option value="repair">Repair</option><option value="inspection">Inspection</option></Select></Field>
          <Field label="Cost (GHS)"><Input name="cost" type="number" min={0} step="0.01" /></Field>
          <Field label="Service provider"><Input name="provider" /></Field>
          <Field label="Parts replaced"><Input name="parts" /></Field>
          <Field label="Next service"><Input name="next" type="date" /></Field>
          <Field label="Machine status after" required><Select name="status" defaultValue="operational"><option value="operational">Operational</option><option value="maintenance_due">Maintenance due</option><option value="out_of_service">Out of service</option></Select></Field>
          <Field label="Description" className="sm:col-span-2"><Input name="description" /></Field>
          <div className="sm:col-span-3 flex justify-end"><Btn type="submit" loading={busy}>Log maintenance</Btn></div>
        </form>
      ) : null}
    </Modal>
  );
}

function OtherAssets() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["assets"], queryFn: () => unwrap(supabase.from("assets").select("*").order("name")) });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      await run(() => supabase.from("assets").insert({ asset_code: f.code!, name: f.name!, category: f.category || null, purchase_date: f.date || null, purchase_price: f.price ? Number(f.price) : null, supplier: f.supplier || null, condition: f.condition || "good", location: f.location || null }), "Asset added");
      qc.invalidateQueries({ queryKey: ["assets"] });
      setOpen(false);
    } catch { /* shown */ }
  }
  return (
    <Panel bodyClassName="p-0" actions={user?.can("assets.manage") ? <Btn size="sm" onClick={() => setOpen(true)}>Add asset</Btn> : null} title="Equipment & furniture">
      {q.isLoading ? <LoadingRow /> : !q.data?.length ? <EmptyState title="No assets recorded" message="Add computers, furniture, vehicles and other equipment." /> : (
        <TableShell>
          <thead><tr><Th>Code</Th><Th>Name</Th><Th>Category</Th><Th>Purchased</Th><Th className="text-right">Price</Th><Th>Condition</Th><Th>Location</Th></tr></thead>
          <tbody>{q.data.map((a) => <tr key={a.id}><Td className="tabular text-xs">{a.asset_code}</Td><Td>{a.name}</Td><Td>{a.category ?? "—"}</Td><Td>{shortDate(a.purchase_date)}</Td><Td className="tabular text-right">{money(a.purchase_price)}</Td><Td>{titleCase(a.condition)}</Td><Td>{a.location ?? "—"}</Td></tr>)}</tbody>
        </TableShell>
      )}
      <Modal open={open} onOpenChange={setOpen} title="Add asset">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Asset code" required><Input name="code" required /></Field>
          <Field label="Name" required><Input name="name" required /></Field>
          <Field label="Category"><Input name="category" /></Field>
          <Field label="Purchase date"><Input name="date" type="date" /></Field>
          <Field label="Price (GHS)"><Input name="price" type="number" min={0} step="0.01" /></Field>
          <Field label="Supplier"><Input name="supplier" /></Field>
          <Field label="Condition"><Select name="condition" defaultValue="good"><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></Select></Field>
          <Field label="Location"><Input name="location" /></Field>
          <div className="sm:col-span-2 flex justify-end"><Btn type="submit">Save asset</Btn></div>
        </form>
      </Modal>
    </Panel>
  );
}
