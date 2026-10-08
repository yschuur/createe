ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url text;
GRANT UPDATE ON public.orders TO authenticated;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));