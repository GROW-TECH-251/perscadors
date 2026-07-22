-- Perscadors — intégrité suppression client et réglages partagés

create or replace function public.delete_customer_data(target_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_perscadors_admin() then
    raise exception 'unauthorized';
  end if;

  delete from public.customer_meta where phone = target_phone;
  delete from public.orders where client_phone = target_phone;
end;
$$;

grant execute on function public.delete_customer_data(text) to authenticated;
