ALTER TABLE public.contact_submissions ADD COLUMN replies jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.design_requests ADD COLUMN replies jsonb NOT NULL DEFAULT '[]'::jsonb;