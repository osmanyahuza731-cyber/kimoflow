import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { unwrap } from "@/lib/queries";
import { ACCEPT, errMsg } from "@/lib/actions";
import { money } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/workflow";
import { Btn, Field, Input, Modal, Select, Textarea } from "@/components/forms";
import { ErrorNote } from "@/components/ui-kit";

/** Records a payment as PENDING. Confirmation is a separate, authorised step. */
export function RecordPaymentButton({ jobId, jobNumber, balance }: { jobId: string; jobNumber: string; balance: number }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const accounts = useQuery({ queryKey: ["payment_accounts"], queryFn: () => unwrap(supabase.from("payment_accounts").select("*").eq("is_active", true).order("name")) });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const f = Object.fromEntries(fd) as Record<string, string>;
    const amount = Number(f.amount);
    if (!(amount > 0)) return setError("Enter an amount greater than zero.");
    if (amount > balance + 0.001) return setError(`Amount exceeds balance of ${money(balance)}.`);
    setBusy(true);
    try {
      let proof = "";
      const file = fd.get("proof") as File | null;
      if (file && file.size) {
        if (file.size > 10 * 1024 * 1024) throw new Error("Proof file is larger than 10 MB");
        proof = `payment/${jobId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(proof, file, { contentType: file.type });
        if (upErr) throw upErr;
      }
      const { error: rErr } = await supabase.rpc("record_payment", {
        _job_id: jobId, _amount: amount, _method: method, _account: (f.account || null) as string,
        _reference: f.reference ?? "", _sender_phone: f.sender_phone ?? "", _cheque: f.cheque ?? "", _proof: proof, _notes: f.notes ?? "",
      });
      if (rErr) throw rErr;
      toast.success("Payment recorded — awaiting confirmation");
      qc.invalidateQueries();
      setOpen(false);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  const acctTypes = method === "momo" ? ["momo"] : method === "cash" ? ["cash"] : ["bank"];
  return (
    <>
      <Btn onClick={() => setOpen(true)} disabled={balance <= 0}>Record payment</Btn>
      <Modal open={open} onOpenChange={setOpen} title={`Record payment — ${jobNumber}`} description={`Outstanding balance ${money(balance)}. Payments stay pending until an authorised cashier confirms them.`}>
        <form onSubmit={submit} className="grid gap-3">
          <Field label="Method" required>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select>
          </Field>
          <Field label="Amount (GHS)" required><Input name="amount" type="number" step="0.01" min={0.01} max={balance} defaultValue={balance} /></Field>
          <Field label={method === "momo" ? "MoMo account" : method === "cash" ? "Cash box" : "Bank account"} required={method !== "cash"}>
            <Select name="account" defaultValue="">
              <option value="">—</option>
              {accounts.data?.filter((a) => acctTypes.includes(a.account_type)).map((a) => <option key={a.id} value={a.id}>{a.name}{a.account_number ? ` · ${a.account_number}` : ""}</option>)}
            </Select>
          </Field>
          {method === "momo" ? <Field label="Sender's phone number" required><Input name="sender_phone" type="tel" /></Field> : null}
          <Field label={method === "momo" ? "Transaction ID / reference" : "Reference"} required={method === "momo"}><Input name="reference" /></Field>
          {method === "cheque" ? <Field label="Cheque number" required><Input name="cheque" /></Field> : null}
          {method === "bank" || method === "cheque" ? <Field label="Proof of payment" required hint="JPG, PNG or PDF"><input name="proof" type="file" accept={ACCEPT} required className="text-sm" /></Field> : null}
          <Field label="Notes"><Textarea name="notes" rows={2} /></Field>
          {error ? <ErrorNote message={error} /> : null}
          <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={() => setOpen(false)}>Cancel</Btn><Btn type="submit" loading={busy}>Save as pending</Btn></div>
        </form>
      </Modal>
    </>
  );
}
