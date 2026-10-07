create policy "Admins can upload studio assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'studio-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update studio assets"
on storage.objects for update to authenticated
using (bucket_id = 'studio-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete studio assets"
on storage.objects for delete to authenticated
using (bucket_id = 'studio-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can list studio assets"
on storage.objects for select to authenticated
using (bucket_id = 'studio-assets' and public.has_role(auth.uid(), 'admin'));