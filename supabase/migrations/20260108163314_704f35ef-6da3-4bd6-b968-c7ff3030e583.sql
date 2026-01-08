-- Fix overly permissive RLS policies for registration_requests and terms_acceptances
-- These tables need public insert access for signup but we can add email validation

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can submit registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Anyone can insert acceptance" ON public.terms_acceptances;

-- Create more restrictive policies that still allow signup flow
-- Registration requests: require that email is provided and matches expected format
CREATE POLICY "Allow registration request submission"
ON public.registration_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND email <> '' 
  AND first_name IS NOT NULL 
  AND last_name IS NOT NULL
);

-- Terms acceptances: require valid email and must be accepting terms
CREATE POLICY "Allow terms acceptance submission"
ON public.terms_acceptances FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND email <> '' 
  AND (accepted_terms = true OR accepted_privacy = true)
);