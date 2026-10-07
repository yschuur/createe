create table public.image_migration_map (src text primary key, path text not null, url text not null);
grant select, insert on public.image_migration_map to postgres, service_role;
alter table public.image_migration_map enable row level security;