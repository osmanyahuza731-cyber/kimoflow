SELECT setval('public.seq_customer_code', GREATEST(1001,(SELECT COALESCE(max(substring(customer_code from 5)::int),1000) FROM public.customers WHERE customer_code ~ '^CUS-\d+$')));
SELECT setval('public.seq_job_number', GREATEST(124,(SELECT COALESCE(max(substring(job_number from 4)::int),123) FROM public.jobs WHERE job_number ~ '^KG-\d+$')));

CREATE OR REPLACE FUNCTION public.set_customer_code() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    NEW.customer_code := public.next_document_number('customer');
  END IF;
  NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_customer_code() FROM PUBLIC, anon, authenticated;
ALTER TABLE public.customers ALTER COLUMN customer_code SET DEFAULT '';
CREATE TRIGGER trg_customers_code BEFORE INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_customer_code();

CREATE OR REPLACE FUNCTION public.audit_row_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs(user_id, action, entity, entity_id, before_value, after_value)
  VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME,
    COALESCE((CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END)->>'id',(CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END)->>'key'),
    CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END $$;
REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_audit_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_services AFTER INSERT OR UPDATE OR DELETE ON public.services FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_categories AFTER INSERT OR UPDATE OR DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_customer_types AFTER INSERT OR UPDATE OR DELETE ON public.customer_types FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_stores AFTER INSERT OR UPDATE OR DELETE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_audit_settings AFTER INSERT OR UPDATE OR DELETE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();