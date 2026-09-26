import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { customerTypesQuery } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import { RequirePermission } from "@/components/access-denied";
import { Btn, Input, Select } from "@/components/forms";
import { EmptyState, ErrorNote, LoadingRow, PageHeader, Panel, StatusBadge, TableShell, Td, Th } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — KIMO GRAPHYX" },
      { name: "description", content: "All KIMO GRAPHYX customers, artists and organisations." },
      { property: "og:title", content: "Customers — KIMO GRAPHYX" },
      { property: "og:description", content: "Customer directory and accounts." },
    ],
  }),
  component: () => (
    <RequirePermission perm="customers.view">
      <Customers />
    </RequirePermission>
  ),
});

const PAGE = 25;

function Customers() {
  const [term, setTerm] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);
  const types = useQuery(customerTypesQuery);
  const q = useQuery({
    queryKey: ["customers", term, type, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let s = supabase
        .from("customers")
        .select("id, customer_code, name, business_name, phone, email, status, credit_hold, registration_date, customer_types(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      const t = term.trim().replace(/[%,]/g, "");
      if (t) s = s.or(`name.ilike.%${t}%,business_name.ilike.%${t}%,phone.ilike.%${t}%,customer_code.ilike.%${t}%`);
      if (type) s = s.eq("customer_type_id", type);
      const { data, error, count } = await s;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  return (
    <>
      <PageHeader
        title="Customers"
        description="Search by name, phone or customer ID. Open a customer to see jobs, invoices, payments and balance."
        actions={
          <Link to="/registrations">
            <Btn>Register customer</Btn>
          </Link>
        }
      />
      <Panel bodyClassName="p-0">
        <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row">
          <Input aria-label="Search" placeholder="Search customers" value={term} onChange={(e) => { setTerm(e.target.value); setPage(0); }} />
          <Select aria-label="Customer type" className="sm:w-56" value={type} onChange={(e) => { setType(e.target.value); setPage(0); }}>
            <option value="">All types</option>
            {types.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
        {q.isLoading ? <LoadingRow /> : q.error ? <div className="p-4"><ErrorNote message="Could not load customers" /></div> : !q.data?.rows.length ? (
          <EmptyState title="No customers found" message="Try another search or register a new customer." />
        ) : (
          <TableShell>
            <thead><tr><Th>ID</Th><Th>Name</Th><Th>Type</Th><Th>Phone</Th><Th className="hidden md:table-cell">Email</Th><Th className="hidden md:table-cell">Registered</Th><Th>Status</Th></tr></thead>
            <tbody>
              {q.data.rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/50">
                  <Td className="tabular text-xs">{c.customer_code}</Td>
                  <Td><Link to="/customers/$id" params={{ id: c.id }} className="font-medium hover:underline">{c.business_name || c.name}</Link>{c.business_name ? <span className="block text-xs text-muted-foreground">{c.name}</span> : null}</Td>
                  <Td>{c.customer_types?.name}</Td>
                  <Td className="tabular">{c.phone}</Td>
                  <Td className="hidden md:table-cell">{c.email ?? "—"}</Td>
                  <Td className="hidden md:table-cell">{shortDate(c.registration_date)}</Td>
                  <Td>{c.credit_hold ? <StatusBadge label="Credit hold" tone="danger" /> : <StatusBadge label={c.status} tone={c.status === "active" ? "success" : "neutral"} />}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
        <Pager page={page} setPage={setPage} count={q.data?.count ?? 0} size={PAGE} />
      </Panel>
    </>
  );
}

export function Pager({ page, setPage, count, size }: { page: number; setPage: (n: number) => void; count: number; size: number }) {
  const pages = Math.max(1, Math.ceil(count / size));
  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
      <span>{count} record{count === 1 ? "" : "s"}</span>
      <div className="flex items-center gap-2">
        <Btn size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Btn>
        <span>Page {page + 1} of {pages}</span>
        <Btn size="sm" variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Btn>
      </div>
    </div>
  );
}
