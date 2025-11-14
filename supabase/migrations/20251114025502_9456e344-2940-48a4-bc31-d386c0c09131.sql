-- Make is_allowed_user email comparison case-insensitive and normalize existing data
-- 1) Normalize existing allowed_users emails to lowercase (idempotent)
UPDATE public.allowed_users SET email = lower(email);

-- 2) Replace function to use LOWER() on both sides to avoid case-sensitivity issues
CREATE OR REPLACE FUNCTION public.is_allowed_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.allowed_users au
    JOIN auth.users u ON lower(u.email) = lower(au.email)
    WHERE u.id = _user_id
  )
$$;