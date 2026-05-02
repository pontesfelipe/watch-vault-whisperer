
-- Drop overly permissive policies on watch-images
DROP POLICY IF EXISTS "Users can upload watch images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update watch images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete watch images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload watch images" ON storage.objects;

-- Owner-scoped INSERT
CREATE POLICY "Users can upload watch images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'watch-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Owner-scoped UPDATE
CREATE POLICY "Users can update own watch images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'watch-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'watch-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Owner-scoped DELETE
CREATE POLICY "Users can delete own watch images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'watch-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
