-- Create function to check if user is in allowed_users table
CREATE OR REPLACE FUNCTION public.is_allowed_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.allowed_users au
    JOIN auth.users u ON u.email = au.email
    WHERE u.id = _user_id
  )
$$;

-- Update collections INSERT policy to check allowed_users
DROP POLICY IF EXISTS "Users can create their own collections" ON public.collections;
CREATE POLICY "Allowed users can create their own collections"
ON public.collections
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND 
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_allowed_user(auth.uid()))
);

-- Update user_collections INSERT policy
DROP POLICY IF EXISTS "Users can insert their own collection access" ON public.user_collections;
CREATE POLICY "Allowed users can insert their own collection access"
ON public.user_collections
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_allowed_user(auth.uid()))
);

-- Create table for registration requests
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  UNIQUE(email)
);

-- Enable RLS on registration_requests
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert registration requests (public form)
CREATE POLICY "Anyone can submit registration requests"
ON public.registration_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view registration requests
CREATE POLICY "Admins can view registration requests"
ON public.registration_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update registration requests (to change status)
CREATE POLICY "Admins can update registration requests"
ON public.registration_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));