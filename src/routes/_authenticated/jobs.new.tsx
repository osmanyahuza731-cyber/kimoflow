import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, pricingRulesQuery, servicesQuery, staffQuery, unwrap } from "@/lib/queries";
import { ACCEPT, errMsg, uploadFile } from "@/lib/actions";
import { money } from "@/lib/format";
import { PRIORITIES } from "@/lib/workflow";
import { RequirePermission } from "@/components/access-denied";
import { Btn, Field, Input, Select, Textarea } from "@/components/forms";
import { ErrorNote, PageHeader, Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/jobs/new")({
  validateSearch: (s: Record<string, unknown>): { customer?: string } => (typeof s.customer === "string" ? { customer: s.customer } : {}),
  head: () => ({
    meta: [
      { title: "New job — KIMO GRAPHYX" },
      { name: "description", content: "Create a production job for a customer." },
      { property: "og:title", content: "New job — KIMO GRAPHYX" },
      { property: "og:description", content: "Create a production job." },
    ],
  }),
  component: () => (
    <RequirePermission perm="jobs.manage">
      <NewJob />
    </RequirePermission>
  ),
});

type Line = { service_id: string; quantity: number; description: string };

function NewJob() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState(search.customer ?? "");
  const [term, setTerm] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ service_id: "", quantity: 1, description: "" }]);
  const [discount, setDiscount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cats = useQuery(categoriesQuery);
  const services = useQuery(servicesQuery);
  const rules = useQuery(pricingRulesQuery);
  const staff = useQuery(staffQuery);
  const machines = useQuery({ queryKey: ["machines-lite"], queryFn: () => unwrap(supabase.from("machines").select("id, name, status").eq("is_active", true).order("name")) });
  const customer = useQuery({
    queryKey: ["customer-lite", customerId],
    enabled: !!customerId,
    queryFn: () => unwrap(supabase.from("customers").select("id, name, business_name, phone, customer_code, customer_type_id, credit_hold, customer_types(name, default_discount_percent)").eq("id", customerId).single()),
  });
  const results = useQuery({
    queryKey: ["customer-search", term],
    enabled: term.trim().length >= 2 && !customerId,
    queryFn: () => {
      const t = term.trim().replace(/[%,]/g, "");
      return unwrap(supabase.from("customers").select("id, name, business_name, phone, customer_code").or(`name.ilike.%${t}%,business_name.ilike.%${t}%,phone.ilike.%${t}%,customer_code.ilike.%${t}%`).limit(8));
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const priceFor = (serviceId: string) => {
    const svc = services.data?.find((s) => s.id === serviceId);
    if (!svc) return 0;
    const typeId = customer.data?.customer_type_id;
    const rule = rules.data?.find((r) => r.service_id === serviceId && r.customer_type_id === typeId && r.is_active && (!r.valid_from || r.valid_from <= today) && (!r.valid_to || r.valid_to >= today))
      ?? rules.data?.find((r) => r.service_id === serviceId && !r.customer_type_id && r.is_active);
    let price = Number(rule?.promo_price ?? rule?.price ?? svc.base_price);
    const pct = Number(rule?.discount_percent ?? customer.data?.customer_types?.default_discount_percent ?? 0);
    price = price * (1 - pct / 100);
    if (rule?.minimum_price != null) price = Math.max(price, Number(rule.minimum_price));
    return Math.round(price * 100) / 100;
  };

  const priced = useMemo(() => lines.map((l) => ({ ...l, unit: priceFor(l.service_id), total: priceFor(l.service_id) * l.quantity })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, services.data, rules.data, customer.data]);
  const subtotal = priced.reduce((s, l) => s + l.total, 0);
  const total = Math.max(0, subtotal - discount);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (!customerId) return setError("Select a customer first.");
    const valid = priced.filter((l) => l.service_id && l.quantity > 0);
    if (!valid.length) return setError("Add at least one service with a quantity.");
    setBusy(true);
    try {
      const { data: num, error: nErr } = await supabase.rpc("next_document_number", { _kind: "job" });
      if (nErr) throw nErr;
      const { data: u } = await supabase.auth.getUser();
      const specs = { size: f.size, material: f.material, color: f.color, finishing: f.finishing, design: f.design };
      const { data: job, error: jErr } = await supabase.from("jobs").insert({
        job_number: num as string,
        customer_id: customerId,
        category_id: categoryId || null,
        title: f.title || services.data?.find((s) => s.id === valid[0]!.service_id)?.name || null,
        status: "draft",
        priority: f.priority || "normal",
        specifications: specs,
        instructions: f.instructions || null,
        machine_id: f.machine_id || null,
        assigned_staff_id: f.assigned_staff_id || null,
        due_date: f.due_date || null,
        subtotal,
        discount,
        total,
        labour_cost: valid.reduce((s, l) => s + Number(services.data?.find((x) => x.id === l.service_id)?.labour_cost ?? 0) * l.quantity, 0),
        created_by: u.user?.id ?? null,
      }).select("id").single();
      if (jErr) throw jErr;
      const { error: iErr } = await supabase.from("job_items").insert(valid.map((l) => ({ job_id: job.id, service_id: l.service_id, description: l.description || null, quantity: l.quantity, unit_price: l.unit, discount: 0, line_total: l.total })));
      if (iErr) throw iErr;
      // Material requirements from each service's recipe
      const { data: recipe } = await supabase.from("service_materials").select("service_id, inventory_item_id, quantity_per_unit, inventory_items(cost_per_unit)").in("service_id", valid.map((l) => l.service_id));
      const mats = new Map<string, { q: number; c: number }>();
      recipe?.forEach((r) => {
        const qty = valid.filter((l) => l.service_id === r.service_id).reduce((s, l) => s + l.quantity, 0) * Number(r.quantity_per_unit);
        const prev = mats.get(r.inventory_item_id) ?? { q: 0, c: Number(r.inventory_items?.cost_per_unit ?? 0) };
        mats.set(r.inventory_item_id, { q: prev.q + qty, c: prev.c });
      });
      if (mats.size) await supabase.from("job_materials").insert([...mats].map(([id, m]) => ({ job_id: job.id, inventory_item_id: id, quantity_required: m.q, unit_cost: m.c, total_cost: 0 })));
      await supabase.from("job_status_history").insert({ job_id: job.id, to_status: "draft", reason: "Job created", changed_by: u.user?.id ?? null });
      if (file) {
        try { await uploadFile("job", job.id, file, "Artwork"); } catch (err) { toast.error(`Job saved, but artwork upload failed: ${errMsg(err)}`); }
      }
      toast.success(`Job ${num} created`);
      qc.invalidateQueries({ queryKey: ["jobs"] });
      navigate({ to: "/jobs/$id", params: { id: job.id } });
    } catch (err) {
      setError(errMsg(err));
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  const catServices = services.data?.filter((s) => s.is_active && (!categoryId || s.category_id === categoryId)) ?? [];

  return (
    <>
      <PageHeader title="New job" description="Prices come from the service list and the customer's pricing group — they can't be typed in freely." />
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
          <Panel title="1. Customer">
            {customer.data ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <div><p className="font-medium">{customer.data.business_name || customer.data.name}</p><p className="text-muted-foreground">{customer.data.customer_code} · {customer.data.phone} · {customer.data.customer_types?.name}</p></div>
                <Btn variant="secondary" size="sm" onClick={() => setCustomerId("")}>Change</Btn>
              </div>
            ) : (
              <>
                <Input placeholder="Search name, phone or customer ID" aria-label="Search customer" value={term} onChange={(e) => setTerm(e.target.value)} />
                <ul className="mt-2 divide-y divide-border">{results.data?.map((c) => (
                  <li key={c.id}><button type="button" className="w-full px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => setCustomerId(c.id)}>{c.business_name || c.name} <span className="text-muted-foreground">· {c.phone} · {c.customer_code}</span></button></li>))}</ul>
                <p className="mt-2 text-xs text-muted-foreground">New customer? Register them first under Registrations.</p>
              </>
            )}
            {customer.data?.credit_hold ? <div className="mt-2"><ErrorNote message="This customer is on credit hold — collect payment before production." /></div> : null}
          </Panel>

          <Panel title="2. Services">
            <Field label="Category" className="mb-3">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">All categories</option>
                {cats.data?.filter((c) => c.is_active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <div className="grid gap-2">
              {priced.map((l, i) => (
                <div key={i} className="grid gap-2 rounded-sm border border-border p-2 sm:grid-cols-[1fr_90px_1fr_auto] sm:items-end">
                  <Field label="Service" required>
                    <Select value={l.service_id} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, service_id: e.target.value } : x)))}>
                      <option value="">Select…</option>
                      {catServices.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                    </Select>
                  </Field>
                  <Field label="Qty" required><Input type="number" min={0.01} step="0.01" value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} /></Field>
                  <Field label="Line note"><Input value={l.description} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} /></Field>
                  <div className="flex items-center gap-2 pb-1 text-sm">
                    <span className="tabular whitespace-nowrap">{money(l.total)}</span>
                    {lines.length > 1 ? <Btn size="sm" variant="ghost" onClick={() => setLines(lines.filter((_, j) => j !== i))}>Remove</Btn> : null}
                  </div>
                </div>
              ))}
              <Btn variant="secondary" size="sm" className="justify-self-start" onClick={() => setLines([...lines, { service_id: "", quantity: 1, description: "" }])}>Add service</Btn>
            </div>
          </Panel>

          <Panel title="3. Requirements">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Job title"><Input name="title" placeholder="" /></Field>
              <Field label="Size / dimensions"><Input name="size" /></Field>
              <Field label="Material"><Input name="material" /></Field>
              <Field label="Colour"><Input name="color" /></Field>
              <Field label="Finishing"><Input name="finishing" /></Field>
              <Field label="Machine"><Select name="machine_id" defaultValue=""><option value="">—</option>{machines.data?.map((m) => <option key={m.id} value={m.id} disabled={m.status === "out_of_service"}>{m.name}{m.status !== "operational" ? ` (${m.status.replace(/_/g, " ")})` : ""}</option>)}</Select></Field>
              <Field label="Design requirements" className="sm:col-span-2"><Textarea name="design" /></Field>
              <Field label="Customer instructions" className="sm:col-span-2"><Textarea name="instructions" /></Field>
              <Field label="Deadline"><Input type="date" name="due_date" min={today} /></Field>
              <Field label="Priority"><Select name="priority" defaultValue="normal">{PRIORITIES.map((p) => <option key={p} value={p}>{p[0]!.toUpperCase() + p.slice(1)}</option>)}</Select></Field>
              <Field label="Assigned artist / operator"><Select name="assigned_staff_id" defaultValue=""><option value="">—</option>{staff.data?.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</Select></Field>
              <Field label="Artwork file" hint="JPG, PNG, PDF, DOC or XLS up to 10 MB"><input type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" /></Field>
            </div>
          </Panel>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Panel title="Summary">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular">{money(subtotal)}</dd></div>
              <div className="flex items-center justify-between gap-2"><dt>Discount (GHS)</dt><dd><Input type="number" min={0} step="0.01" className="h-8 w-28 text-right" value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} /></dd></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>Total</dt><dd className="tabular">{money(total)}</dd></div>
            </dl>
            {error ? <div className="mt-3"><ErrorNote message={error} /></div> : null}
            <Btn type="submit" loading={busy} className="mt-4 w-full">Create job (draft)</Btn>
          </Panel>
        </div>
      </form>
    </>
  );
}
