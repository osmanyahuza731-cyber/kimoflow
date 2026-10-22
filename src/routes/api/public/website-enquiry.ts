import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(30),
  email: z.string().email().max(200).optional().or(z.literal("")),
  service_interest: z.string().max(200).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  source: z.string().max(100).optional().or(z.literal("")),
});

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/website-enquiry")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Signature",
          },
        }),
      POST: async ({ request }) => {
        const secret = process.env["WEBSITE_ENQUIRY_SECRET"];
        if (!secret) return Response.json({ error: "Webhook not configured" }, { status: 503 });

        const raw = await request.text();
        const signature = request.headers.get("x-webhook-signature") ?? "";
        const expected = await hmacHex(secret, raw);
        if (!signature || !timingSafeEqualStr(signature, expected)) {
          return Response.json({ error: "Invalid signature" }, { status: 401 });
        }

        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json({ error: "Invalid enquiry", issues: parsed.error.issues.map((i) => i.message) }, { status: 422 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const d = parsed.data;
        const { data, error } = await supabaseAdmin
          .from("website_enquiries")
          .insert({
            source: d.source || "kimographyxgh.com",
            name: d.name,
            phone: d.phone,
            email: d.email || null,
            service_interest: d.service_interest || null,
            message: d.message || null,
            status: "new",
          })
          .select("id")
          .single();
        if (error) return Response.json({ error: "Could not save enquiry" }, { status: 500 });

        // Notify front desk and admins.
        const { data: staff } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .in("role", ["super_admin", "admin", "secretary", "manager"]);
        if (staff?.length) {
          await supabaseAdmin.from("notifications").insert(
            staff.map((s) => ({
              user_id: s.user_id,
              title: "New website enquiry",
              body: `${d.name} (${d.phone})${d.service_interest ? ` — ${d.service_interest}` : ""}`,
              kind: "website_enquiry",
              link: "/registrations",
            })),
          );
        }

        return Response.json({ ok: true, id: data.id });
      },
    },
  },
});
