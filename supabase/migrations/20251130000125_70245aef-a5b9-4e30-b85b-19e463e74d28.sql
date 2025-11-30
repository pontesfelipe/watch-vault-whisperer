-- Fix the handle_new_user_signup function to also create profile and user role
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg_request_id uuid;
  user_first_name text;
  user_last_name text;
BEGIN
  -- Get user metadata
  user_first_name := NEW.raw_user_meta_data->>'first_name';
  user_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- Create profile (this was missing!)
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    CONCAT(COALESCE(user_first_name, ''), ' ', COALESCE(user_last_name, '')),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user role (default 'user' role)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create or get registration request
  INSERT INTO public.registration_requests (
    email, 
    first_name, 
    last_name, 
    status, 
    accepted_terms, 
    accepted_privacy,
    terms_version,
    privacy_version
  )
  VALUES (
    NEW.email, 
    COALESCE(user_first_name, 'User'),
    COALESCE(user_last_name, ''),
    'approved',
    true,
    true,
    'Beta v1.0',
    'Beta v1.0'
  )
  ON CONFLICT (email) DO UPDATE 
  SET status = 'approved',
      accepted_terms = true,
      accepted_privacy = true
  RETURNING id INTO reg_request_id;
  
  -- Record terms acceptance
  INSERT INTO public.terms_acceptances (
    email,
    accepted_terms,
    accepted_privacy,
    terms_version,
    privacy_version,
    registration_request_id,
    user_agent,
    ip_address
  )
  VALUES (
    NEW.email,
    true,
    true,
    'Beta v1.0',
    'Beta v1.0',
    reg_request_id,
    NEW.raw_user_meta_data->>'user_agent',
    NEW.raw_user_meta_data->>'ip_address'
  );
  
  -- Add user to allowed_users if not already there
  INSERT INTO public.allowed_users (email, added_at, notes)
  VALUES (NEW.email, now(), 'Auto-approved on signup')
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$;