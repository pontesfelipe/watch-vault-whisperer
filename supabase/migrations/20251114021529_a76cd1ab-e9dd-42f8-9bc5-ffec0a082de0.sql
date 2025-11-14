-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Collection owners can manage access" ON public.user_collections;

-- Create a security definer function to check collection ownership
CREATE OR REPLACE FUNCTION public.is_collection_owner(_user_id uuid, _collection_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_collections
    WHERE user_id = _user_id
      AND collection_id = _collection_id
      AND role = 'owner'
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Collection owners can manage access"
ON public.user_collections
FOR ALL
USING (public.is_collection_owner(auth.uid(), collection_id));