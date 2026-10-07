CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete site settings" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_settings (key, value) VALUES ('homepage', '{
  "announcements": [
    {"text": "Ontdek onze Design Studio", "link": "/design-studio"},
    {"text": "Shop exclusieve designs", "link": "/collections/golf"},
    {"text": "Binnen 1-3 werkdagen verzonden", "link": ""},
    {"text": "Gratis verzending vanaf €75", "link": ""},
    {"text": "Ervaar de signature HYBR™ POLO", "link": "/pages/de-hybr-polo"}
  ],
  "golf": {"label": "Golf", "link": "/collections/golf", "show_video": true},
  "padel": {"label": "Padel", "link": "/collections/padel", "show_video": true},
  "studio_button": {"label": "Studio", "link": "/design-studio"},
  "show_ratings": true,
  "carousel_title": "",
  "featured_slugs": ["padelo-picasso", "red-hot-chili-putters", "bogeymian-rhapsody", "bandeja-vu", "at-the-19th"],
  "collection_link_label": "Bekijk de collectie"
}'::jsonb);