GRANT DELETE ON public.contact_submissions TO authenticated;
CREATE POLICY "Admins delete contact submissions" ON public.contact_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, UPDATE, DELETE ON public.design_requests TO authenticated;