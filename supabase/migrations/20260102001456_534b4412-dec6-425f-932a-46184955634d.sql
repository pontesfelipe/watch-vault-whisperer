-- Drop the overly permissive profiles policy
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON public.profiles;

-- Create a more restrictive policy that only allows viewing profiles of:
-- 1. The user's own profile
-- 2. Users they are friends with
-- 3. Users they have active conversations with
-- 4. Users who sent them friend requests (so they can see who is requesting)
-- NOTE: Removed trade_match_notifications condition as it exposes profiles to users without established relationships
CREATE POLICY "Users can view profiles for messaging" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = id) 
  OR (EXISTS ( 
    SELECT 1 FROM friendships
    WHERE ((friendships.user_id = auth.uid()) AND (friendships.friend_id = profiles.id)) 
       OR ((friendships.friend_id = auth.uid()) AND (friendships.user_id = profiles.id))
  )) 
  OR (EXISTS ( 
    SELECT 1 FROM conversations
    WHERE ((conversations.user1_id = auth.uid()) AND (conversations.user2_id = profiles.id)) 
       OR ((conversations.user2_id = auth.uid()) AND (conversations.user1_id = profiles.id))
  )) 
  OR (EXISTS ( 
    SELECT 1 FROM friend_requests
    WHERE (friend_requests.to_user_id = auth.uid()) AND (friend_requests.from_user_id = profiles.id)
  ))
);