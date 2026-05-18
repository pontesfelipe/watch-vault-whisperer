
-- 1) Drop broad SELECT policies on public buckets to prevent listing.
-- Public bucket flag still allows direct object retrieval via public URL.
DROP POLICY IF EXISTS "Watch images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- 2) Fix mutable search_path on pgmq wrapper functions.
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
