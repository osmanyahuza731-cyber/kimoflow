CREATE OR REPLACE FUNCTION public.notify_roles(_roles app_role[], _title text, _body text, _kind text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  SELECT user_id, _title, _body, _kind, _link FROM public.user_roles WHERE role = ANY(_roles);
END $$;

CREATE OR REPLACE FUNCTION public.notify_payment_pending()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM public.notify_roles(ARRAY['super_admin','admin','cashier','accountant']::app_role[],
      'Payment awaiting confirmation',
      'GHS ' || to_char(NEW.amount,'FM999,999,990.00') || ' (' || NEW.method || ') on job ' || (SELECT job_number FROM public.jobs WHERE id=NEW.job_id),
      'payment_pending', '/payments');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_payment_pending AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.notify_payment_pending();

CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.quantity <= COALESCE(NEW.min_quantity,0) AND OLD.quantity > COALESCE(OLD.min_quantity,0) THEN
    PERFORM public.notify_roles(ARRAY['super_admin','admin','storekeeper']::app_role[],
      'Low stock: ' || NEW.name,
      NEW.name || ' is down to ' || NEW.quantity || ' ' || NEW.unit || ' (minimum ' || COALESCE(NEW.min_quantity,0) || ').',
      'low_stock', '/assets');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_low_stock AFTER UPDATE OF quantity ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.notify_low_stock();

CREATE OR REPLACE FUNCTION public.notify_job_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_roles(ARRAY['super_admin','admin','manager']::app_role[],
      'Job ' || NEW.job_number || ' is now ' || replace(NEW.status,'_',' '),
      NEW.title,
      'job_status', '/jobs/' || NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_job_status AFTER UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.notify_job_status();