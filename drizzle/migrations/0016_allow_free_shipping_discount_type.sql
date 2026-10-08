ALTER TABLE public.discounts DROP CONSTRAINT discounts_type_check;
ALTER TABLE public.discounts ADD CONSTRAINT discounts_type_check CHECK (type IN ('percentage', 'fixed', 'free_shipping'));