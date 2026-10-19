import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, customerTypesQuery, staffQuery, unwrap } from "@/lib/queries";
import { run } from "@/lib/actions";
import { RequirePermission } from "@/components/access-denied";
import { Btn, Field, Input, Select, Tabs, Textarea } from "@/components/forms";
import { PageHeader, Panel, StatusBadge } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/registrations")({
  head: () => ({
    meta: [
      { title: "Registrations — KIMO GRAPHYX" },
      { name: "description", content: "Register walk-in customers, artists and organisations." },
      { property: "og:title", content: "Registrations — KIMO GRAPHYX" },
      { property: "og:description", content: "Register walk-in customers, artists and organisations." },
    ],
  }),
  component: () => (
    <RequirePermission perm="customers.manage">
      <Registrations />
    </RequirePermission>
  ),
});

type Kind = "walk_in" | "artist" | "organisation";
const PHONE = /^(\+?233|0)[235][0-9]{8}$/;

function Registrations() {
  const [kind, setKind] = useState<Kind>("walk_in");
  return (
    <>
      <PageHeader
        title="Registrations"
        description="Search first — if the customer already exists, open their account instead of registering again."
      />
      <QuickSearch />
      <Tabs
        value={kind}
        onChange={setKind}
        tabs={[
          { value: "walk_in", label: "Walk-in customer" },
          { value: "artist", label: "Artist" },
          { value: "organisation", label: "Organisation / NGO" },
        ]}
      />
      <RegistrationForm key={kind} kind={kind} />
    </>
  );
}

function QuickSearch() {
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["customer-search", term],
    enabled: term.trim().length >= 2,
    queryFn: () => {
      const t = term.trim().replace(/[%,]/g, "");
      return unwrap(
        supabase
          .from("customers")
          .select("id, customer_code, name, business_name, phone, customer_types(name)")
          .or(`name.ilike.%${t}%,business_name.ilike.%${t}%,phone.ilike.%${t}%,customer_code.ilike.%${t}%`)
          .limit(8),
      );
    },
  });
  return (
    <Panel className="mb-5" bodyClassName="p-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
        <Input
          aria-label="Search existing customers"
          placeholder="Search by name, phone or customer ID"
          className="pl-8"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      {q.data?.length ? (
        <ul className="mt-2 divide-y divide-border rounded-sm border border-border">
          {q.data.map((c) => (
            <li key={c.id}>
              <Link
                to="/customers/$id"
                params={{ id: c.id }}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                <span>
                  <span className="font-medium">{c.business_name || c.name}</span>{" "}
                  <span className="text-muted-foreground">· {c.phone}</span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge label={c.customer_types?.name ?? ""} />
                  <span className="tabular text-xs text-muted-foreground">{c.customer_code}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : term.trim().length >= 2 && q.isSuccess ? (
        <p className="mt-2 text-sm text-muted-foreground">No existing customer matches — register them below.</p>
      ) : null}
    </Panel>
  );
}

function RegistrationForm({ kind }: { kind: Kind }) {
  const types = useQuery(customerTypesQuery);
  const cats = useQuery(categoriesQuery);
  const staff = useQuery(staffQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeId = types.data?.find((t) => t.code === kind)?.id;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const errs: Record<string, string> = {};
    if (!f.name?.trim()) errs.name = "Name is required";
    const phone = (f.phone ?? "").replace(/\s/g, "");
    if (!PHONE.test(phone)) errs.phone = "Enter a valid Ghana number, e.g. 024 123 4567";
    if (f.alt_phone && !PHONE.test(f.alt_phone.replace(/\s/g, ""))) errs.alt_phone = "Invalid phone number";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) errs.email = "Invalid email";
    setErrors(errs);
    if (Object.keys(errs).length || !typeId) return;
    setBusy(true);
    try {
      const row = await run(
        () =>
          supabase
            .from("customers")
            .insert({
              customer_code: "",
              customer_type_id: typeId,
              name: f.name!.trim(),
              business_name: f.business_name || null,
              contact_person: f.contact_person || null,
              contact_position: f.contact_position || null,
              phone,
              alt_phone: f.alt_phone || null,
              email: f.email || null,
              address: f.address || null,
              location: f.location || null,
              preferred_contact: f.preferred_contact || "phone",
              service_category_id: f.service_category_id || null,
              assigned_staff_id: f.assigned_staff_id || null,
              notes: f.notes || null,
            })
            .select("id, customer_code")
            .single(),
        "Customer registered",
      );
      qc.invalidateQueries({ queryKey: ["customers"] });
      if (!row) throw new Error("Registration returned no record.");
      navigate({ to: "/customers/$id", params: { id: row.id } });
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => errors[k];
  return (
    <Panel title={kind === "organisation" ? "Organisation details" : kind === "artist" ? "Artist details" : "Customer details"}>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label={kind === "organisation" ? "Organisation name" : "Full name"} required hint={err("name")}>
          <Input name="name" aria-invalid={!!err("name")} />
        </Field>
        {kind === "artist" ? (
          <Field label="Stage / business name">
            <Input name="business_name" />
          </Field>
        ) : null}
        {kind === "organisation" ? (
          <>
            <Field label="Contact person">
              <Input name="contact_person" />
            </Field>
            <Field label="Contact position">
              <Input name="contact_position" />
            </Field>
          </>
        ) : null}
        <Field label="Phone" required hint={err("phone")}>
          <Input name="phone" type="tel" inputMode="tel" aria-invalid={!!err("phone")} />
        </Field>
        <Field label="Alternative phone" hint={err("alt_phone")}>
          <Input name="alt_phone" type="tel" />
        </Field>
        <Field label="Email" hint={err("email")}>
          <Input name="email" type="email" />
        </Field>
        {kind !== "artist" ? (
          <Field label="Address">
            <Input name="address" />
          </Field>
        ) : null}
        <Field label="Location / area">
          <Input name="location" />
        </Field>
        <Field label="Preferred contact">
          <Select name="preferred_contact" defaultValue="phone">
            <option value="phone">Phone call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </Select>
        </Field>
        {kind === "artist" ? (
          <Field label="Main service category">
            <Select name="service_category_id" defaultValue="">
              <option value="">—</option>
              {cats.data?.filter((c) => c.is_active).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Assigned staff">
          <Select name="assigned_staff_id" defaultValue="">
            <option value="">—</option>
            {staff.data?.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name || "Unnamed"}</option>
            ))}
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" />
        </Field>
        <div className="flex items-center justify-between gap-2 sm:col-span-2">
          <p className="text-xs text-muted-foreground">
            Pricing group: <strong>{types.data?.find((t) => t.id === typeId)?.name ?? "—"}</strong>. Customer ID is assigned automatically.
          </p>
          <Btn type="submit" loading={busy}>Register customer</Btn>
        </div>
      </form>
    </Panel>
  );
}
