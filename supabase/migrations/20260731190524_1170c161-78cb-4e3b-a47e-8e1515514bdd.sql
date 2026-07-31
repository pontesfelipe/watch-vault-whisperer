DROP POLICY IF EXISTS "Allowed users can insert their own collection access" ON public.user_collections;

CREATE POLICY "Users can self-add access to collections they created"
ON public.user_collections
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Collection owners can grant access"
ON public.user_collections
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_collection_owner(auth.uid(), collection_id)
);