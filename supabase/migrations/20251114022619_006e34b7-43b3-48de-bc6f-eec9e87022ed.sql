-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Collection owners can manage access" ON public.user_collections;

-- Create separate policies for different operations to avoid recursion
-- For INSERT: Users can add themselves to collections (no ownership check needed)
CREATE POLICY "Users can insert their own collection access"
ON public.user_collections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- For UPDATE: Only collection owners can update access
CREATE POLICY "Collection owners can update access"
ON public.user_collections
FOR UPDATE
USING (public.is_collection_owner(auth.uid(), collection_id));

-- For DELETE: Only collection owners can delete access
CREATE POLICY "Collection owners can delete access"
ON public.user_collections
FOR DELETE
USING (public.is_collection_owner(auth.uid(), collection_id));

-- Add a function and trigger to limit non-admin users to one owned collection
CREATE OR REPLACE FUNCTION public.check_collection_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  collection_count INTEGER;
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT public.has_role(NEW.created_by, 'admin') INTO is_admin;
  
  -- If admin, allow unlimited collections
  IF is_admin THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins, count existing collections they own
  SELECT COUNT(*) INTO collection_count
  FROM public.collections
  WHERE created_by = NEW.created_by;
  
  -- If they already have one collection, prevent creation
  IF collection_count >= 1 THEN
    RAISE EXCEPTION 'Non-admin users can only create one collection. You can be granted access to additional collections by other users.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce the collection limit
DROP TRIGGER IF EXISTS enforce_collection_limit ON public.collections;
CREATE TRIGGER enforce_collection_limit
BEFORE INSERT ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.check_collection_limit();