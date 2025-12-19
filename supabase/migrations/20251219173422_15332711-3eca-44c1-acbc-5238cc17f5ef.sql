-- Drop the overly permissive profile search policy
DROP POLICY IF EXISTS "Users can search profiles by email for friend requests" ON public.profiles;

-- The existing "Users can view profiles for messaging" policy already handles legitimate use cases:
-- - Own profile access
-- - Friends' profiles
-- - Conversation participants
-- - Friend request senders
-- - Trade notification owners

-- Create a more restrictive email lookup function for friend requests
-- This function only returns the profile ID if an exact email match is found
CREATE OR REPLACE FUNCTION public.get_profile_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles 
  WHERE lower(email) = lower(_email)
  LIMIT 1;
$$;