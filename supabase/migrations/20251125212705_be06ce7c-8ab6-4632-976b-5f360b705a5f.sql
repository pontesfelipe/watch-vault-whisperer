-- Update the trigger function to also record terms acceptance
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
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