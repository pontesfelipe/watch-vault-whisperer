
-- Fix overly permissive watch-images storage policies
-- First drop the existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can delete watch images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update watch images" ON storage.objects;

-- Re-create with ownership checks
CREATE POLICY "Users can delete their own watch images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'watch-images' 
  AND auth.uid() IS NOT NULL 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own watch images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'watch-images' 
  AND auth.uid() IS NOT NULL 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add user-scoped SELECT policy for feature_usage_events
CREATE POLICY "Users can view their own usage events"
ON public.feature_usage_events
FOR SELECT
USING (auth.uid() = user_id);
