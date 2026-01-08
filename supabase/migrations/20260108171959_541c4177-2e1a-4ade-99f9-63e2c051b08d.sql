-- Drop existing policies to recreate them with explicit role restrictions
DROP POLICY IF EXISTS "Admins can view all login history" ON public.login_history;
DROP POLICY IF EXISTS "Users can insert own login history" ON public.login_history;
DROP POLICY IF EXISTS "Users can view own login history" ON public.login_history;

-- Recreate policies with explicit TO authenticated clause
-- This ensures ONLY authenticated users can access, denying anonymous access

-- Users can view their own login history (authenticated only)
CREATE POLICY "Users can view own login history"
ON public.login_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all login history (authenticated only)
CREATE POLICY "Admins can view all login history"
ON public.login_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own login history (authenticated only)
CREATE POLICY "Users can insert own login history"
ON public.login_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Revoke any direct grants to anon role on login_history table
REVOKE ALL ON public.login_history FROM anon;