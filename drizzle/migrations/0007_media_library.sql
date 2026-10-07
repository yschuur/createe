CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  storage_path text,
  kind text NOT NULL DEFAULT 'image' CHECK (kind IN ('image','video')),
  name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all media_assets" ON public.media_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.media_assets (url, storage_path, kind, name)
SELECT DISTINCT ON (url) url, storage_path, 'image', coalesce(alt_text, split_part(split_part(url,'?',1),'/',-1))
FROM public.product_images WHERE url IS NOT NULL ORDER BY url, created_at
ON CONFLICT (url) DO NOTHING;