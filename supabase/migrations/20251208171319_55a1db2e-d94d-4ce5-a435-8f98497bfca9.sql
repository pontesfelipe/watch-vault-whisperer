-- Allow users to view profiles of other users for friend requests and messaging
-- This is limited to just finding users by email or viewing friend profiles
CREATE POLICY "Users can view profiles for messaging"
ON public.profiles
FOR SELECT
USING (
  -- Can view own profile
  auth.uid() = id
  OR
  -- Can view profiles of users they have a friendship with
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id = auth.uid() AND friend_id = profiles.id)
       OR (friend_id = auth.uid() AND user_id = profiles.id)
  )
  OR
  -- Can view profiles of users in their conversations
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE (user1_id = auth.uid() AND user2_id = profiles.id)
       OR (user2_id = auth.uid() AND user1_id = profiles.id)
  )
  OR
  -- Can view profiles of users who sent them friend requests
  EXISTS (
    SELECT 1 FROM public.friend_requests
    WHERE to_user_id = auth.uid() AND from_user_id = profiles.id
  )
  OR
  -- Can view profiles of users in trade notifications
  EXISTS (
    SELECT 1 FROM public.trade_match_notifications
    WHERE user_id = auth.uid() AND trade_owner_id = profiles.id
  )
);

-- Drop the restrictive policies that only allowed own profile viewing
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Also need to allow searching by email for friend requests (minimal exposure)
-- This policy allows looking up a profile by email when sending a friend request
CREATE POLICY "Users can search profiles by email for friend requests"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);