DROP POLICY IF EXISTS "Authenticated users can read post-images via API" ON storage.objects;

CREATE POLICY "Users can read own post images via API"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);