ALTER TABLE public.orders ADD COLUMN admin_note text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN events jsonb NOT NULL DEFAULT '[]'::jsonb;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
CREATE POLICY "Admins insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update order items" ON public.order_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete order items" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));