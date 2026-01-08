-- Update the handle_new_user_signup function to auto-generate a random username
-- and NOT store the Google avatar_url (user will get initials-based avatar instead)

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  random_username TEXT;
  adjectives TEXT[] := ARRAY['Swift', 'Bold', 'Calm', 'Bright', 'Quick', 'Noble', 'Wise', 'Cool', 'Epic', 'Keen', 'Wild', 'True', 'Pure', 'Lucky', 'Happy'];
  nouns TEXT[] := ARRAY['Hawk', 'Wolf', 'Bear', 'Fox', 'Eagle', 'Tiger', 'Lion', 'Owl', 'Falcon', 'Raven', 'Phoenix', 'Dragon', 'Knight', 'Pilot', 'Sailor'];
BEGIN
  -- Get user metadata
  user_first_name := NEW.raw_user_meta_data->>'first_name';
  user_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- Generate a random username: Adjective + Noun + 3 random digits
  random_username := adjectives[1 + floor(random() * array_length(adjectives, 1))::int] 
                  || nouns[1 + floor(random() * array_length(nouns, 1))::int]
                  || lpad(floor(random() * 1000)::text, 3, '0');
  
  -- Create profile with auto-generated username and NO avatar_url (we'll use initials instead)
  INSERT INTO public.profiles (id, email, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    CONCAT(COALESCE(user_first_name, ''), ' ', COALESCE(user_last_name, '')),
    random_username,
    NULL  -- Don't store Google avatar, user will see initials-based avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(profiles.username, EXCLUDED.username);  -- Only set username if not already set
  
  -- Check if this email is in allowed_users
  IF EXISTS (SELECT 1 FROM public.allowed_users WHERE email = NEW.email) THEN
    -- Insert user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;