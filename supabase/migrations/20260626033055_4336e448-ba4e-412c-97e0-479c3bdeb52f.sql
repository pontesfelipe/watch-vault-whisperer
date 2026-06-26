CREATE POLICY "Collection members can view watch specs"
ON public.watch_specs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.watches w
    JOIN public.user_collections uc ON uc.collection_id = w.collection_id
    WHERE w.id = watch_specs.watch_id
      AND uc.user_id = auth.uid()
  )
);