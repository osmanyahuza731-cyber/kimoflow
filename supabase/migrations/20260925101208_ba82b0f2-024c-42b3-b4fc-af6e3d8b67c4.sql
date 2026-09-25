CREATE OR REPLACE FUNCTION public.audit_row_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb := CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
BEGIN
  INSERT INTO public.audit_logs(user_id, action, record_type, record_id, before_value, after_value)
  VALUES (auth.uid(), TG_TABLE_NAME || '.' || lower(TG_OP), TG_TABLE_NAME,
    CASE WHEN (r->>'id') ~ '^[0-9a-f-]{36}$' THEN (r->>'id')::uuid ELSE NULL END,
    CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END $$;
REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;