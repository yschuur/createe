DROP POLICY IF EXISTS "public collection products" ON public.collection_products;
CREATE POLICY "public collection products" ON public.collection_products
FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_products.collection_id AND c.published)
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = collection_products.product_id AND p.published AND p.status IN ('active','unlisted'))
);

DROP POLICY IF EXISTS "visitors upload design references" ON storage.objects;
CREATE POLICY "visitors upload design references" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'studio-assets'
  AND name ~ '^requests/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|gif|webp|heic|heif|avif|bmp|tif|tiff|svg|pdf)$'
);