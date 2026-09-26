
CREATE OR REPLACE FUNCTION public.change_job_status(_job_id uuid, _to text, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.jobs; allowed text[]; m record; short text := ''; mat_cost numeric := 0; bal numeric;
BEGIN
  SELECT * INTO j FROM public.jobs WHERE id=_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF NOT public.has_any_role(auth.uid(), ARRAY['super_admin','admin','manager','secretary','graphic_artist','production_operator']::app_role[]) THEN
    RAISE EXCEPTION 'You are not allowed to change job status'; END IF;
  allowed := CASE j.status
    WHEN 'draft' THEN ARRAY['quoted','cancelled']
    WHEN 'quoted' THEN ARRAY['awaiting_approval','cancelled','on_hold']
    WHEN 'awaiting_approval' THEN ARRAY['approved','cancelled','on_hold']
    WHEN 'approved' THEN ARRAY['awaiting_payment','ready_for_production','cancelled','on_hold']
    WHEN 'awaiting_payment' THEN ARRAY['ready_for_production','cancelled','on_hold']
    WHEN 'ready_for_production' THEN ARRAY['in_production','on_hold','cancelled']
    WHEN 'in_production' THEN ARRAY['quality_check','on_hold']
    WHEN 'quality_check' THEN ARRAY['ready_for_collection','in_production']
    WHEN 'ready_for_collection' THEN ARRAY['completed']
    WHEN 'on_hold' THEN ARRAY['approved','ready_for_production','in_production','cancelled']
    ELSE ARRAY[]::text[] END;
  IF NOT (_to = ANY(allowed)) THEN RAISE EXCEPTION 'Cannot move job from % to %', j.status, _to; END IF;
  IF _to = 'approved' AND NOT public.has_any_role(auth.uid(), ARRAY['super_admin','admin','manager']::app_role[]) THEN
    RAISE EXCEPTION 'Only managers or administrators can approve jobs'; END IF;
  IF _to IN ('cancelled','on_hold') AND coalesce(trim(_reason),'')='' THEN RAISE EXCEPTION 'A reason is required'; END IF;
  IF _to = 'in_production' AND j.status <> 'on_hold' THEN
    FOR m IN SELECT jm.*, i.name, i.unit, i.quantity AS stock, i.cost_per_unit FROM public.job_materials jm JOIN public.inventory_items i ON i.id=jm.inventory_item_id WHERE jm.job_id=_job_id AND jm.quantity_consumed=0 FOR UPDATE OF i LOOP
      IF m.stock < m.quantity_required THEN
        short := short || format('%s (need %s %s, available %s %s); ', m.name, m.quantity_required, m.unit, m.stock, m.unit);
      END IF;
    END LOOP;
    IF short <> '' THEN RAISE EXCEPTION 'Insufficient stock: %', short; END IF;
    FOR m IN SELECT jm.*, i.cost_per_unit, i.quantity AS stock FROM public.job_materials jm JOIN public.inventory_items i ON i.id=jm.inventory_item_id WHERE jm.job_id=_job_id AND jm.quantity_consumed=0 LOOP
      UPDATE public.inventory_items SET quantity=quantity-m.quantity_required WHERE id=m.inventory_item_id;
      UPDATE public.job_materials SET quantity_consumed=m.quantity_required, unit_cost=m.cost_per_unit, total_cost=m.quantity_required*m.cost_per_unit WHERE id=m.id;
      INSERT INTO public.inventory_transactions(inventory_item_id,transaction_type,quantity,unit_cost,job_id,reference,reason,balance_after,created_by)
      VALUES (m.inventory_item_id,'consumption',m.quantity_required,m.cost_per_unit,_job_id,j.job_number,'Job production',m.stock-m.quantity_required,auth.uid());
    END LOOP;
    SELECT coalesce(sum(total_cost),0) INTO mat_cost FROM public.job_materials WHERE job_id=_job_id;
    UPDATE public.jobs SET material_cost=mat_cost WHERE id=_job_id;
  END IF;
  UPDATE public.jobs SET status=_to, completed_at = CASE WHEN _to='completed' THEN now() ELSE completed_at END WHERE id=_job_id;
  INSERT INTO public.job_status_history(job_id,from_status,to_status,reason,changed_by) VALUES (_job_id,j.status,_to,_reason,auth.uid());
  INSERT INTO public.audit_logs(user_id,action,record_type,record_id,before_value,after_value,reason)
  VALUES (auth.uid(),'job.status','jobs',_job_id,jsonb_build_object('status',j.status),jsonb_build_object('status',_to),_reason);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.refresh_job_payment(_job_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE paid numeric; tot numeric;
BEGIN
  IF _job_id IS NULL THEN RETURN; END IF;
  SELECT coalesce(sum(amount),0) INTO paid FROM public.payments WHERE job_id=_job_id AND status='confirmed';
  SELECT total INTO tot FROM public.jobs WHERE id=_job_id;
  UPDATE public.jobs SET amount_paid=paid, payment_status = CASE WHEN paid<=0 THEN 'unpaid' WHEN paid>=tot THEN 'paid' ELSE 'partial' END WHERE id=_job_id;
  UPDATE public.invoices i SET amount_paid=(SELECT coalesce(sum(amount),0) FROM public.payments p WHERE p.invoice_id=i.id AND p.status='confirmed') WHERE i.job_id=_job_id;
  UPDATE public.invoices SET status = CASE WHEN amount_paid<=0 THEN 'unpaid' WHEN amount_paid>=total THEN 'paid' ELSE 'partial' END WHERE job_id=_job_id AND status<>'cancelled';
END $$;

CREATE OR REPLACE FUNCTION public.record_payment(_job_id uuid, _amount numeric, _method text, _account uuid, _reference text, _sender_phone text, _cheque text, _proof text, _notes text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.jobs; pending numeric; inv uuid; pid uuid;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','accountant']::app_role[]) THEN RAISE EXCEPTION 'You are not allowed to record payments'; END IF;
  SELECT * INTO j FROM public.jobs WHERE id=_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  SELECT coalesce(sum(amount),0) INTO pending FROM public.payments WHERE job_id=_job_id AND status IN ('pending','confirmed');
  IF _amount > j.total - pending + 0.001 THEN RAISE EXCEPTION 'Amount exceeds outstanding balance of GHS %', round(j.total-pending,2); END IF;
  IF _method NOT IN ('cash','momo','bank','cheque') THEN RAISE EXCEPTION 'Invalid method'; END IF;
  IF _method='momo' AND (coalesce(_sender_phone,'')='' OR coalesce(_reference,'')='' OR _account IS NULL) THEN RAISE EXCEPTION 'Mobile Money needs sender phone, transaction reference and MoMo account'; END IF;
  IF _method IN ('bank','cheque') AND (coalesce(_proof,'')='' OR _account IS NULL) THEN RAISE EXCEPTION 'Bank/Cheque payments need an account and proof of payment'; END IF;
  IF _method='cheque' AND coalesce(_cheque,'')='' THEN RAISE EXCEPTION 'Cheque number is required'; END IF;
  SELECT id INTO inv FROM public.invoices WHERE job_id=_job_id AND status<>'cancelled' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO public.payments(job_id,invoice_id,customer_id,amount,method,payment_account_id,reference,momo_sender_phone,cheque_number,proof_path,status,paid_at,received_by,notes)
  VALUES (_job_id,inv,j.customer_id,_amount,_method,_account,nullif(_reference,''),nullif(_sender_phone,''),nullif(_cheque,''),nullif(_proof,''),'pending',now(),auth.uid(),nullif(_notes,''))
  RETURNING id INTO pid;
  INSERT INTO public.audit_logs(user_id,action,record_type,record_id,after_value) VALUES (auth.uid(),'payment.recorded','payments',pid,jsonb_build_object('amount',_amount,'method',_method,'job',j.job_number));
  RETURN pid;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_payment(_payment_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.payments; rn text;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','accountant']::app_role[]) THEN RAISE EXCEPTION 'You are not allowed to confirm payments'; END IF;
  SELECT * INTO p FROM public.payments WHERE id=_payment_id FOR UPDATE;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'Only pending payments can be confirmed'; END IF;
  rn := coalesce(p.receipt_number, public.next_document_number('receipt'));
  UPDATE public.payments SET status='confirmed', confirmed_by=auth.uid(), confirmed_at=now(), receipt_number=rn WHERE id=_payment_id;
  PERFORM public.refresh_job_payment(p.job_id);
  INSERT INTO public.ledger_entries(entry_date,entry_type,account,description,debit,credit,job_id,payment_id,reference,created_by)
  VALUES (current_date,'income',p.method,'Payment received',p.amount,0,p.job_id,p.id,rn,auth.uid());
  INSERT INTO public.audit_logs(user_id,action,record_type,record_id,after_value) VALUES (auth.uid(),'payment.confirmed','payments',p.id,jsonb_build_object('receipt',rn,'amount',p.amount));
  RETURN rn;
END $$;

CREATE OR REPLACE FUNCTION public.reverse_payment(_payment_id uuid, _reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.payments;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['super_admin','admin','accountant']::app_role[]) THEN RAISE EXCEPTION 'Only administrators or accountants can reverse payments'; END IF;
  IF coalesce(trim(_reason),'')='' THEN RAISE EXCEPTION 'A reason is required'; END IF;
  SELECT * INTO p FROM public.payments WHERE id=_payment_id FOR UPDATE;
  IF p.status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'Payment already reversed'; END IF;
  UPDATE public.payments SET status='reversed', reversed_by=auth.uid(), reversal_reason=_reason WHERE id=_payment_id;
  IF p.status='confirmed' THEN
    INSERT INTO public.ledger_entries(entry_date,entry_type,account,description,debit,credit,job_id,payment_id,reference,created_by)
    VALUES (current_date,'adjustment',p.method,'Payment reversal: '||_reason,0,p.amount,p.job_id,p.id,p.receipt_number,auth.uid());
  END IF;
  PERFORM public.refresh_job_payment(p.job_id);
  INSERT INTO public.audit_logs(user_id,action,record_type,record_id,before_value,reason) VALUES (auth.uid(),'payment.reversed','payments',p.id,to_jsonb(p),_reason);
END $$;

CREATE OR REPLACE FUNCTION public.stock_move(_item uuid, _type text, _qty numeric, _to_store uuid, _unit_cost numeric, _reference text, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.inventory_items; newq numeric; target uuid;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['super_admin','admin','storekeeper']::app_role[]) THEN RAISE EXCEPTION 'Only storekeepers or administrators can move stock'; END IF;
  IF _qty IS NULL OR _qty <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
  SELECT * INTO i FROM public.inventory_items WHERE id=_item FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;
  IF _type IN ('adjustment_out','damaged','stock_out','transfer') AND coalesce(trim(_reason),'')='' THEN RAISE EXCEPTION 'A reason is required'; END IF;
  newq := CASE WHEN _type IN ('stock_in','return','adjustment_in') THEN i.quantity+_qty ELSE i.quantity-_qty END;
  IF newq < 0 THEN RAISE EXCEPTION 'Not enough stock: % has % %', i.name, i.quantity, i.unit; END IF;
  UPDATE public.inventory_items SET quantity=newq,
    cost_per_unit = CASE WHEN _type='stock_in' AND coalesce(_unit_cost,0)>0 THEN round(((i.quantity*i.cost_per_unit)+(_qty*_unit_cost))/nullif(newq,0),4) ELSE cost_per_unit END
  WHERE id=_item;
  IF _type='transfer' THEN
    IF _to_store IS NULL OR _to_store=i.store_id THEN RAISE EXCEPTION 'Choose a different destination store'; END IF;
    SELECT id INTO target FROM public.inventory_items WHERE store_id=_to_store AND item_code=i.item_code;
    IF target IS NULL THEN
      INSERT INTO public.inventory_items(item_code,name,category,unit,store_id,quantity,min_quantity,reorder_level,cost_per_unit,supplier)
      VALUES (i.item_code,i.name,i.category,i.unit,_to_store,_qty,i.min_quantity,i.reorder_level,i.cost_per_unit,i.supplier) RETURNING id INTO target;
    ELSE UPDATE public.inventory_items SET quantity=quantity+_qty WHERE id=target; END IF;
  END IF;
  INSERT INTO public.inventory_transactions(inventory_item_id,transaction_type,quantity,unit_cost,from_store_id,to_store_id,reference,reason,balance_after,created_by)
  VALUES (_item,_type,_qty,coalesce(nullif(_unit_cost,0),i.cost_per_unit),i.store_id,_to_store,_reference,_reason,newq,auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.record_expense(_date date,_purpose text,_category text,_amount numeric,_method text,_account uuid,_receipt text,_notes text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE eid uuid; num text;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','accountant']::app_role[]) THEN RAISE EXCEPTION 'You are not allowed to record expenses'; END IF;
  IF _amount IS NULL OR _amount<=0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  num := public.next_document_number('expense');
  INSERT INTO public.expenses(expense_number,expense_date,purpose,category,amount,method,payment_account_id,staff_id,receipt_path,notes,created_by)
  VALUES (num,_date,_purpose,_category,_amount,_method,_account,auth.uid(),_receipt,_notes,auth.uid()) RETURNING id INTO eid;
  INSERT INTO public.ledger_entries(entry_date,entry_type,account,description,debit,credit,expense_id,reference,created_by)
  VALUES (_date,'expense',_category,_purpose,0,_amount,eid,num,auth.uid());
  RETURN eid;
END $$;

CREATE OR REPLACE FUNCTION public.set_user_role(_user uuid, _role app_role, _grant boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Only administrators can change roles'; END IF;
  IF _user = auth.uid() THEN RAISE EXCEPTION 'You cannot change your own roles'; END IF;
  IF _role='super_admin' AND NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Only a Super Admin can grant Super Admin'; END IF;
  IF _grant THEN INSERT INTO public.user_roles(user_id,role) VALUES (_user,_role) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM public.user_roles WHERE user_id=_user AND role=_role; END IF;
  INSERT INTO public.audit_logs(user_id,action,record_type,record_id,after_value) VALUES (auth.uid(),CASE WHEN _grant THEN 'role.granted' ELSE 'role.revoked' END,'user_roles',_user,jsonb_build_object('role',_role));
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['change_job_status(uuid,text,text)','refresh_job_payment(uuid)','record_payment(uuid,numeric,text,uuid,text,text,text,text,text)','confirm_payment(uuid)','reverse_payment(uuid,text)','stock_move(uuid,text,numeric,uuid,numeric,text,text)','record_expense(date,text,text,numeric,text,uuid,text,text)','set_user_role(uuid,app_role,boolean)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.refresh_job_payment(uuid) FROM authenticated;

CREATE POLICY "staff read documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='documents' AND public.is_staff(auth.uid()));
CREATE POLICY "staff upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='documents' AND public.is_staff(auth.uid()));
