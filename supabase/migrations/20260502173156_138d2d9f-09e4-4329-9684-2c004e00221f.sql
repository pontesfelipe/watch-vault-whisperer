-- Remove overly permissive watch-images storage policies that only check
-- for an authenticated user and do not enforce folder ownership.
-- Owner-scoped policies (added in a previous migration) remain in place.

DROP POLICY IF EXISTS "Users can delete watch images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update watch images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload watch images" ON storage.objects;