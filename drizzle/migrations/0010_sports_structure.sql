CREATE TABLE public.sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sports TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sports TO authenticated;
GRANT ALL ON public.sports TO service_role;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public sports" ON public.sports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin all sports" ON public.sports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.products ADD COLUMN sport_id uuid REFERENCES public.sports(id) ON DELETE SET NULL;
ALTER TABLE public.collections ADD COLUMN sport_ids uuid[] NOT NULL DEFAULT '{}';
COMMENT ON COLUMN public.products.sports IS 'DEPRECATED: replaced by sport_id';

INSERT INTO public.sports (slug, name, sort_order) VALUES ('golf', 'Golf', 0), ('padel', 'Padel', 1);
UPDATE public.products p SET sport_id = s.id FROM public.sports s WHERE s.slug = p.sports[1];
UPDATE public.collections c SET sport_ids = ARRAY(SELECT id FROM public.sports WHERE slug = 'golf') WHERE c.slug = 'polos';
UPDATE public.collections c SET sport_ids = ARRAY(SELECT id FROM public.sports WHERE slug = 'padel') WHERE c.slug = 'performance-tees';
UPDATE public.collections c SET sport_ids = ARRAY(SELECT id FROM public.sports ORDER BY sort_order) WHERE c.slug = 't-shirts';