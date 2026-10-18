import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { categoriesQuery, staffQuery } from "@/lib/queries";
import { money, shortDate, titleCase } from "@/lib/format";
import { JOB_STATUSES, JOB_STATUS_LABELS, JOB_STATUS_TONE, PAYMENT_STATUS_TONE, type JobStatus } from "@/lib/workflow";
import { downloadCsv } from "@/lib/actions";
import { RequirePermission } from "@/components/access-denied";
import { Btn, Input, Select } from "@/components/forms";
import { EmptyState, ErrorNote, LoadingRow, PageHeader, Panel, StatusBadge, TableShell, Td, Th } from "@/components/ui-kit";
import { Pager } from "./customers.index";

export const Route = createFileRoute("/_authenticated/jobs/")({
  validateSearch: (s: Record<string, unknown>): { status?: string } => (typeof s.status === "string" ? { status: s.status } : {}),
  head: () => ({
    meta: [
      { title: "Jobs — KIMO GRAPHYX" },
      { name: "description", content: "All production jobs with status, payment and deadlines." },
      { property: "og:title", content: "Jobs — KIMO GRAPHYX" },
      { property: "og:description", content: "Production jobs board." },
    ],
  }),
  component: () => (
    <RequirePermission perm="jobs.view">
      <Jobs />
    </RequirePermission>
  ),
});

const PAGE = 25;

function Jobs() {
  const search = Route.useSearch();
  const { user } = useCurrentUser();
  const canMoney = !!user?.can("payments.view");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState(search.status ?? "");
  const [cat, setCat] = useState("");
  const [staff, setStaff] = useState("");
  const [pay, setPay] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const cats = useQuery(categoriesQuery);
  const people = useQuery(staffQuery);

  const q = useQuery({
    queryKey: ["jobs", term, status, cat, staff, pay, from, to, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const t = term.trim().replace(/[%,()]/g, "");
      let custIds: string[] = [];
      if (t) {
        const { data: cs } = await supabase.from("customers").select("id").or(`name.ilike.%${t}%,business_name.ilike.%${t}%,phone.ilike.%${t}%`).limit(100);
        custIds = (cs ?? []).map((c) => c.id);
      }
      let s = supabase
        .from("jobs")
        .select("id, job_number, title, status, payment_status, priority, due_date, total, amount_paid, created_at, customers!inner(name, business_name, phone), categories(name), profiles:assigned_staff_id(full_name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (t) s = s.or(`job_number.ilike.%${t}%,title.ilike.%${t}%${custIds.length ? `,customer_id.in.(${custIds.join(",")})` : ""}`);
      if (status) s = s.eq("status", status);
      if (cat) s = s.eq("category_id", cat);
      if (staff) s = s.eq("assigned_staff_id", staff);
      if (pay) s = s.eq("payment_status", pay);
      if (from) s = s.gte("created_at", from);
      if (to) s = s.lte("created_at", to + "T23:59:59");
      const { data, error, count } = await s;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Every job from draft to collection. Filter by status, category, staff, payment or date."
        actions={
          <>
            <Btn variant="secondary" onClick={() => downloadCsv("jobs.csv", (q.data?.rows ?? []).map((j) => ({ job: j.job_number, customer: j.customers?.business_name || j.customers?.name, phone: j.customers?.phone, category: j.categories?.name, status: j.status, ...(canMoney ? { total: j.total, paid: j.amount_paid, balance: Number(j.total) - Number(j.amount_paid) } : {}), due: j.due_date })))}>Export CSV</Btn>
            {user?.can("jobs.manage") ? <Link to="/jobs/new" search={{}}><Btn>New job</Btn></Link> : null}
          </>
        }
      />
      <Panel bodyClassName="p-0">
        <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-2 lg:grid-cols-7">
          <Input className="lg:col-span-2" aria-label="Search" placeholder="Search job no., title, customer or phone" value={term} onChange={(e) => { setTerm(e.target.value); setPage(0); }} />
          <Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="">All statuses</option>
            {JOB_STATUSES.map((s) => <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>)}
          </Select>
          <Select aria-label="Category" value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }}>
            <option value="">All categories</option>
            {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select aria-label="Staff" value={staff} onChange={(e) => { setStaff(e.target.value); setPage(0); }}>
            <option value="">All staff</option>
            {people.data?.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </Select>
          <Select aria-label="Payment" value={pay} onChange={(e) => { setPay(e.target.value); setPage(0); }}>
            <option value="">Any payment</option>
            <option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option>
          </Select>
          <div className="flex gap-1">
            <Input type="date" aria-label="From date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} />
            <Input type="date" aria-label="To date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} />
          </div>
        </div>
        {q.isLoading ? <LoadingRow /> : q.error ? <div className="p-4"><ErrorNote message="Could not load jobs" /></div> : !q.data?.rows.length ? (
          <EmptyState title="No jobs found" message="Adjust the filters or create a new job." action={user?.can("jobs.manage") ? <Link to="/jobs/new" search={{}}><Btn>Create new job</Btn></Link> : null} />
        ) : (
          <TableShell>
            <thead><tr><Th>Job</Th><Th>Customer</Th><Th className="hidden lg:table-cell">Category</Th><Th>Status</Th><Th className="hidden md:table-cell">Staff</Th><Th className="hidden md:table-cell">Priority</Th><Th>Due</Th>{canMoney ? <><Th className="text-right">Amount</Th><Th className="text-right">Balance</Th><Th>Payment</Th></> : null}</tr></thead>
            <tbody>
              {q.data.rows.map((j) => {
                const overdue = j.due_date && j.due_date < new Date().toISOString().slice(0, 10) && !["completed", "cancelled"].includes(j.status);
                return (
                  <tr key={j.id} className="hover:bg-muted/50">
                    <Td><Link to="/jobs/$id" params={{ id: j.id }} className="tabular font-medium hover:underline">{j.job_number}</Link><span className="block max-w-[180px] truncate text-xs text-muted-foreground">{j.title}</span></Td>
                    <Td>{j.customers?.business_name || j.customers?.name}<span className="block text-xs text-muted-foreground">{j.customers?.phone}</span></Td>
                    <Td className="hidden lg:table-cell">{j.categories?.name ?? "—"}</Td>
                    <Td><StatusBadge label={JOB_STATUS_LABELS[j.status as JobStatus] ?? j.status} tone={JOB_STATUS_TONE[j.status as JobStatus]} /></Td>
                    <Td className="hidden md:table-cell">{j.profiles?.full_name ?? "—"}</Td>
                    <Td className="hidden md:table-cell">{j.priority === "urgent" || j.priority === "high" ? <StatusBadge label={titleCase(j.priority)} tone="danger" /> : titleCase(j.priority)}</Td>
                    <Td className={overdue ? "font-medium text-destructive" : ""}>{shortDate(j.due_date)}</Td>
                    {canMoney ? <><Td className="tabular text-right">{money(j.total)}</Td><Td className="tabular text-right">{money(Number(j.total) - Number(j.amount_paid))}</Td><Td><StatusBadge label={titleCase(j.payment_status)} tone={PAYMENT_STATUS_TONE[j.payment_status]} /></Td></> : null}
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
        <Pager page={page} setPage={setPage} count={q.data?.count ?? 0} size={PAGE} />
      </Panel>
    </>
  );
}
