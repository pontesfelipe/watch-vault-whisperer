-- Drop existing overly permissive policies on warranty-cards bucket
DROP POLICY IF EXISTS "Anyone can view warranty cards" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload warranty cards" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete warranty cards" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update warranty cards" ON storage.objects;

-- Create owner-only policies for warranty-cards bucket
-- Users can only view their own warranty cards (files in their user folder)
CREATE POLICY "Users can view own warranty cards"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'warranty-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can only upload to their own folder
CREATE POLICY "Users can upload own warranty cards"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'warranty-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can only update their own warranty cards
CREATE POLICY "Users can update own warranty cards"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'warranty-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can only delete their own warranty cards
CREATE POLICY "Users can delete own warranty cards"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'warranty-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all warranty cards for support purposes
CREATE POLICY "Admins can view all warranty cards"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'warranty-cards' 
  AND public.has_role(auth.uid(), 'admin')
);