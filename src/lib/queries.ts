import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

type UnwrapData<P> = P extends PromiseLike<{ data: infer D }> ? NonNullable<D> : never;

async function unwrap<P extends PromiseLike<{ data: unknown; error: unknown }>>(p: P): Promise<UnwrapData<P>> {
  const { data, error } = await p as { data: unknown; error: unknown };
  if (error) throw error;
  return data as UnwrapData<P>;
}

export const customerTypesQuery = queryOptions({
  queryKey: ["customer_types"],
  queryFn: () => unwrap(supabase.from("customer_types").select("*").order("sort_order")),
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => unwrap(supabase.from("categories").select("*").order("sort_order")),
});

export const servicesQuery = queryOptions({
  queryKey: ["services"],
  queryFn: () => unwrap(supabase.from("services").select("*, categories(name)").order("name")),
});

export const storesQuery = queryOptions({
  queryKey: ["stores"],
  queryFn: () => unwrap(supabase.from("stores").select("*").order("name")),
});

export const staffQuery = queryOptions({
  queryKey: ["profiles"],
  queryFn: () => unwrap(supabase.from("profiles").select("id, full_name, position").order("full_name")),
});

export const pricingRulesQuery = queryOptions({
  queryKey: ["pricing_rules"],
  queryFn: () => unwrap(supabase.from("pricing_rules").select("*").order("created_at")),
});

export const companyQuery = queryOptions({
  queryKey: ["settings", "company"],
  queryFn: async () => {
    const { data, error } = await supabase.from("settings").select("*").eq("key", "company").maybeSingle();
    if (error) throw error;
    return ((data?.value as Record<string, string> | undefined) ?? {}) as Record<string, string>;
  },
});

export { unwrap };
