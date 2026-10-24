import { BrandMark } from "@/components/brand-logo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { companyQuery, unwrap } from "@/lib/queries";
import { dateTime, money, titleCase } from "@/lib/format";
import { Btn } from "@/components/forms";
import { ErrorNote, LoadingRow } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/receipts/$id")({
  head: () => ({
    meta: [
      { title: "Receipt — KIMO GRAPHYX" },
      { name: "description", content: "Official payment receipt." },
      { property: "og:title", content: "Receipt — KIMO GRAPHYX" },
      { property: "og:description", content: "Official payment receipt." },
    ],
  }),
  component: Receipt,
});

function Receipt() {
  const { id } = Route.useParams();
  const company = useQuery(companyQuery);
  const q = useQuery({
    queryKey: ["receipt", id],
    queryFn: async () => {
      const p = await unwrap(supabase.from("payments").select("*, customers(name, business_name, phone), jobs(id, job_number, total), invoices(invoice_number), payment_accounts(name)").eq("id", id).single());
      const [earlier, confirmer] = await Promise.all([
        p.job_id ? unwrap(supabase.from("payments").select("amount").eq("job_id", p.job_id).eq("status", "confirmed").lt("confirmed_at", p.confirmed_at ?? p.paid_at)) : Promise.resolve([]),
        p.confirmed_by ? unwrap(supabase.from("profiles").select("full_name").eq("id", p.confirmed_by).maybeSingle()) : Promise.resolve(null),
      ]);
      return { p, before: earlier.reduce((s, x) => s + Number(x.amount), 0), confirmer: confirmer?.full_name ?? null };
    },
  });
  if (q.isLoading) return <LoadingRow />;
  if (q.error || !q.data) return <ErrorNote message="Receipt not found." />;
  const { p, before, confirmer } = q.data;
  if (p.status !== "confirmed") return <ErrorNote message="Receipts are only issued for confirmed payments." />;
  const c = company.data ?? {};
  const total = Number(p.jobs?.total ?? 0);
  const prevBal = total - before;
  const remaining = prevBal - Number(p.amount);
  return (
    <div>
      <div className="mb-4 flex gap-2 print:hidden">
        {p.jobs ? <Link to="/jobs/$id" params={{ id: p.jobs.id }}><Btn variant="secondary">Back to job</Btn></Link> : null}
        <Btn onClick={() => window.print()}>Print / save as PDF</Btn>
      </div>
      <article className="print-area mx-auto max-w-md border border-border bg-surface p-6 text-sm">
        <header className="border-b-2 border-primary pb-3 text-center">
          <BrandMark className="mx-auto mb-1 h-10" />
          <p className="font-display text-lg font-bold tracking-wider">{c.name || "KIMO GRAPHYX"}</p>
          <p className="text-xs text-muted-foreground">{[c.address, c.phone, c.email].filter(Boolean).join(" · ")}</p>
          <p className="mt-2 font-display font-semibold">OFFICIAL RECEIPT</p>
          <p className="tabular">{p.receipt_number}</p>
        </header>
        <dl className="mt-3 grid grid-cols-[130px_1fr] gap-y-1">
          <dt className="text-muted-foreground">Date</dt><dd>{dateTime(p.confirmed_at)}</dd>
          <dt className="text-muted-foreground">Received from</dt><dd>{p.customers?.business_name || p.customers?.name} ({p.customers?.phone})</dd>
          <dt className="text-muted-foreground">Job</dt><dd>{p.jobs?.job_number ?? "—"}</dd>
          <dt className="text-muted-foreground">Invoice</dt><dd>{p.invoices?.invoice_number ?? "—"}</dd>
          <dt className="text-muted-foreground">Method</dt><dd>{titleCase(p.method)}{p.payment_accounts?.name ? ` · ${p.payment_accounts.name}` : ""}</dd>
          <dt className="text-muted-foreground">Reference</dt><dd>{p.reference ?? p.cheque_number ?? "—"}{p.momo_sender_phone ? ` · from ${p.momo_sender_phone}` : ""}</dd>
          <dt className="text-muted-foreground">Previous balance</dt><dd className="tabular">{money(prevBal)}</dd>
          <dt className="font-semibold">Amount paid</dt><dd className="tabular font-semibold">{money(p.amount)}</dd>
          <dt className="text-muted-foreground">Remaining balance</dt><dd className="tabular">{money(remaining)}</dd>
          <dt className="text-muted-foreground">Confirmed by</dt><dd>{confirmer ?? "—"}</dd>
        </dl>
        <footer className="mt-4 border-t border-border pt-2 text-center text-xs text-muted-foreground">{c.receipt_footer || "Thank you for your business."}</footer>
      </article>
    </div>
  );
}
