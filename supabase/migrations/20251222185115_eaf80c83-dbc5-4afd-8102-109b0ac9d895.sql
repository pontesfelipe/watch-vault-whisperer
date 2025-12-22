-- Add policy to allow users to view watches in collections they have access to
CREATE POLICY "Users can view watches in collections they have access to"
ON public.watches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_collections
    WHERE user_collections.collection_id = watches.collection_id
    AND user_collections.user_id = auth.uid()
  )
);