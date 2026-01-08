-- Drop the existing user self-view policy
DROP POLICY IF EXISTS "Users can view own login history" ON public.login_history;

-- The admin policy already exists: "Admins can view all login history"
-- No changes needed for admin access