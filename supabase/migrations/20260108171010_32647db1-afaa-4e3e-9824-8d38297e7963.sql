-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON public.profiles;

-- Create a new policy that only allows users to view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a secure view for public profile data (non-sensitive fields only)
-- This view will be used when displaying other users' profiles
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  avatar_color
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Create a security definer function to get public profile data for connected users
-- This ensures we only return non-sensitive data
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  avatar_color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.avatar_color
  FROM public.profiles p
  WHERE p.id = _user_id
    AND (
      -- User is viewing their own profile
      auth.uid() = _user_id
      -- OR user is an admin
      OR public.has_role(auth.uid(), 'admin')
      -- OR they are friends
      OR EXISTS (
        SELECT 1 FROM public.friendships 
        WHERE (user_id = auth.uid() AND friend_id = _user_id)
           OR (friend_id = auth.uid() AND user_id = _user_id)
      )
      -- OR they have a conversation
      OR EXISTS (
        SELECT 1 FROM public.conversations
        WHERE (user1_id = auth.uid() AND user2_id = _user_id)
           OR (user2_id = auth.uid() AND user1_id = _user_id)
      )
      -- OR there's a pending friend request between them
      OR EXISTS (
        SELECT 1 FROM public.friend_requests
        WHERE (from_user_id = auth.uid() AND to_user_id = _user_id)
           OR (to_user_id = auth.uid() AND from_user_id = _user_id)
      )
    );
$$;

-- Function to get multiple public profiles at once (for efficiency)
CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  avatar_color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.avatar_color
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids);
$$;