update public.product_images p set url=m.url, storage_path=m.path, source_url=coalesce(p.source_url,m.src)
from public.image_migration_map m where coalesce(p.source_url,p.url)=m.src;
update public.collections c set image_url=m.url from public.image_migration_map m where c.image_url=m.src;
delete from public.image_migration_map;
comment on table public.image_migration_map is 'DEPRECATED: one-off Shopify image migration helper';