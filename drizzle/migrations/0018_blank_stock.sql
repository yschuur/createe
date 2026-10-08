CREATE TABLE public.blank_stock (
  model text NOT NULL,
  color text NOT NULL,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (model, color, size)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blank_stock TO authenticated;
GRANT ALL ON public.blank_stock TO service_role;
ALTER TABLE public.blank_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all blank_stock" ON public.blank_stock FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.products ADD COLUMN blank_model text;

-- Variant stock mirrors the shared blank stock of its model/color/size.
CREATE OR REPLACE FUNCTION public.variant_from_blank() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare q integer;
begin
  select b.quantity into q from public.blank_stock b join public.products p on p.blank_model = b.model
  where p.id = new.product_id and b.color = lower(coalesce(new.color,'')) and b.size = lower(coalesce(new.size,''));
  if found then new.inventory_quantity := greatest(0, q); new.track_inventory := true; end if;
  return new;
end $$;
CREATE TRIGGER variant_from_blank BEFORE INSERT OR UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.variant_from_blank();

CREATE OR REPLACE FUNCTION public.blank_to_variants() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  new.quantity := greatest(0, new.quantity);
  new.updated_at := now();
  return new;
end $$;
CREATE TRIGGER blank_clamp BEFORE INSERT OR UPDATE ON public.blank_stock
  FOR EACH ROW EXECUTE FUNCTION public.blank_to_variants();

CREATE OR REPLACE FUNCTION public.blank_sync_variants() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  update public.product_variants v set inventory_quantity = new.quantity
  from public.products p
  where p.id = v.product_id and p.blank_model = new.model
    and lower(coalesce(v.color,'')) = new.color and lower(coalesce(v.size,'')) = new.size;
  return null;
end $$;
CREATE TRIGGER blank_sync AFTER INSERT OR UPDATE ON public.blank_stock
  FOR EACH ROW EXECUTE FUNCTION public.blank_sync_variants();

CREATE OR REPLACE FUNCTION public.product_blank_resync() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if new.blank_model is distinct from old.blank_model then
    update public.product_variants set inventory_quantity = inventory_quantity where product_id = new.id;
  end if;
  return null;
end $$;
CREATE TRIGGER product_blank_resync AFTER UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.product_blank_resync();

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(_variant uuid, _qty integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare m text; c text; s text;
begin
  select p.blank_model, lower(coalesce(v.color,'')), lower(coalesce(v.size,'')) into m, c, s
  from public.product_variants v join public.products p on p.id = v.product_id where v.id = _variant;
  if m is not null and exists (select 1 from public.blank_stock where model = m and color = c and size = s) then
    update public.blank_stock set quantity = greatest(0, quantity - _qty) where model = m and color = c and size = s;
  else
    update public.product_variants set inventory_quantity = greatest(0, inventory_quantity - _qty) where id = _variant;
  end if;
end $$;

UPDATE public.products SET blank_model = 'golf-polo' WHERE product_type ILIKE 'HYBR%';
UPDATE public.products SET blank_model = 't-shirt' WHERE product_type = 'ORGANISCH KATOEN';
INSERT INTO public.blank_stock (model, color, size, quantity)
SELECT p.blank_model, lower(v.color), lower(v.size), max(greatest(0, v.inventory_quantity))
FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
WHERE p.blank_model IS NOT NULL AND v.color IS NOT NULL AND v.size IS NOT NULL
GROUP BY 1, 2, 3;