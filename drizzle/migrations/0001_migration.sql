create table public.design_requests (
 id uuid primary key default gen_random_uuid(), name text not null, email text not null, phone text, occasion text, quantity int, message text not null,
 status text not null default 'nieuw', created_at timestamptz not null default now());
grant insert on public.design_requests to anon, authenticated; grant select, update, delete on public.design_requests to authenticated; grant all on public.design_requests to service_role;
alter table public.design_requests enable row level security;
create policy "anyone can submit" on public.design_requests for insert to anon, authenticated with check (char_length(name) between 1 and 100 and char_length(email) between 3 and 255 and char_length(message) between 1 and 3000);
create policy "admin manage" on public.design_requests for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));