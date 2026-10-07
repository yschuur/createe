create type public.app_role as enum ('admin');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- first signed up user becomes admin
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin if not exists(select 1 from public.user_roles where role='admin') then insert into public.user_roles(user_id, role) values (new.id,'admin'); end if; return new; end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_first_admin();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at = now(); return new; end $$;

create table public.products (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, description_html text,
 vendor text, product_category text, product_type text, tags text[] not null default '{}',
 status text not null default 'draft' check (status in ('active','draft','unlisted','archived')),
 published boolean not null default false, featured boolean not null default false, sort_order int not null default 0,
 is_service boolean not null default false,
 fit text, fabric text, target_gender text, seo_title text, seo_description text, metadata jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.product_variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 sku text, color text, size text, option1_name text, option1_value text, option2_name text, option2_value text, option3_name text, option3_value text,
 price numeric(10,2) not null default 0, compare_at_price numeric(10,2), inventory_quantity int not null default 0, original_inventory_qty int,
 allow_backorder boolean not null default false, track_inventory boolean not null default true, barcode text, weight numeric, weight_unit text,
 active boolean not null default true, sort_order int not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.product_images (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 variant_id uuid references public.product_variants(id) on delete set null, storage_path text, source_url text, url text not null,
 alt_text text, sort_order int not null default 0, is_primary boolean not null default false, created_at timestamptz not null default now());
create table public.collections (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, description text, image_url text,
 published boolean not null default true, sort_order int not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.collection_products (collection_id uuid not null references public.collections(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, sort_order int not null default 0, primary key(collection_id, product_id));
create table public.discounts (
 id uuid primary key default gen_random_uuid(), code text not null unique, description text,
 type text not null default 'percentage' check (type in ('percentage','fixed')), value numeric(10,2) not null,
 min_order_amount numeric(10,2), starts_at timestamptz, ends_at timestamptz, usage_limit int, times_used int not null default 0,
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.import_logs (id uuid primary key default gen_random_uuid(), created_by uuid, source text, summary jsonb not null default '{}', errors jsonb not null default '[]', created_at timestamptz not null default now());

create index on public.product_variants(product_id); create index on public.product_images(product_id);
create trigger t1 before update on public.products for each row execute function public.touch_updated_at();
create trigger t2 before update on public.product_variants for each row execute function public.touch_updated_at();
create trigger t3 before update on public.collections for each row execute function public.touch_updated_at();
create trigger t4 before update on public.discounts for each row execute function public.touch_updated_at();

grant select on public.products, public.product_variants, public.product_images, public.collections, public.collection_products to anon, authenticated;
grant insert, update, delete on public.products, public.product_variants, public.product_images, public.collections, public.collection_products, public.discounts, public.import_logs to authenticated;
grant select on public.discounts, public.import_logs to authenticated;
grant all on public.products, public.product_variants, public.product_images, public.collections, public.collection_products, public.discounts, public.import_logs to service_role;

alter table public.products enable row level security; alter table public.product_variants enable row level security; alter table public.product_images enable row level security;
alter table public.collections enable row level security; alter table public.collection_products enable row level security; alter table public.discounts enable row level security; alter table public.import_logs enable row level security;

create policy "public products" on public.products for select to anon, authenticated using (status in ('active','unlisted') and published);
create policy "public variants" on public.product_variants for select to anon, authenticated using (exists(select 1 from public.products p where p.id=product_id and p.status in ('active','unlisted') and p.published));
create policy "public images" on public.product_images for select to anon, authenticated using (exists(select 1 from public.products p where p.id=product_id and p.status in ('active','unlisted') and p.published));
create policy "public collections" on public.collections for select to anon, authenticated using (published);
create policy "public collection products" on public.collection_products for select to anon, authenticated using (true);
do $$ declare t text; begin foreach t in array array['products','product_variants','product_images','collections','collection_products','discounts','import_logs'] loop
 execute format('create policy "admin all %1$s" on public.%1$I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t); end loop; end $$;