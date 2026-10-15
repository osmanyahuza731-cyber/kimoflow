import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong";
}

/** Run a mutation with consistent success/error feedback. Re-throws so callers can keep dialogs open. */
export async function run<T>(fn: () => PromiseLike<{ data: T; error: unknown }>, success: string): Promise<T> {
  const { data, error } = await fn();
  if (error) {
    toast.error(errMsg(error));
    throw error;
  }
  toast.success(success);
  return data;
}

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
export const ACCEPT = ".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx";

/** Upload to the private documents store and register it as an attachment on a record. */
export async function uploadFile(recordType: string, recordId: string, file: File, label?: string) {
  if (!ALLOWED.includes(file.type)) throw new Error("File type not allowed (JPG, PNG, PDF, DOC, XLS only)");
  if (file.size > 10 * 1024 * 1024) throw new Error("File is larger than 10 MB");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${recordType}/${recordId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("attachments").insert({
    record_type: recordType,
    record_id: recordId,
    file_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    label: label ?? null,
    uploaded_by: u.user?.id ?? null,
  });
  return path;
}

export async function openFile(path: string) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 120);
  if (error || !data) { toast.error("Could not open file"); return; }
  window.open(data.signedUrl, "_blank", "noopener");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) { toast.error("Nothing to export"); return; }
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
