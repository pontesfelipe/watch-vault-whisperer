-- Add policy to allow users to view wear_entries for watches in collections they have access to
CREATE POLICY "Users can view wear_entries in accessible collections"
ON public.wear_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON uc.collection_id = w.collection_id
    WHERE w.id = wear_entries.watch_id
    AND uc.user_id = auth.uid()
  )
);

-- Add policy to allow users to view water_usage for watches in collections they have access to
CREATE POLICY "Users can view water_usage in accessible collections"
ON public.water_usage
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON uc.collection_id = w.collection_id
    WHERE w.id = water_usage.watch_id
    AND uc.user_id = auth.uid()
  )
);