
-- 1. Update signup trigger to auto-allow new users
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  random_username TEXT;
  adjectives TEXT[] := ARRAY['Swift', 'Bold', 'Calm', 'Bright', 'Quick', 'Noble', 'Wise', 'Cool', 'Epic', 'Keen', 'Wild', 'True', 'Pure', 'Lucky', 'Happy'];
  nouns TEXT[] := ARRAY['Hawk', 'Wolf', 'Bear', 'Fox', 'Eagle', 'Tiger', 'Lion', 'Owl', 'Falcon', 'Raven', 'Phoenix', 'Dragon', 'Knight', 'Pilot', 'Sailor'];
BEGIN
  user_first_name := NEW.raw_user_meta_data->>'first_name';
  user_last_name := NEW.raw_user_meta_data->>'last_name';

  random_username := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
                  || nouns[1 + floor(random() * array_length(nouns, 1))::int]
                  || lpad(floor(random() * 1000)::text, 3, '0');

  INSERT INTO public.profiles (id, email, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    CONCAT(COALESCE(user_first_name, ''), ' ', COALESCE(user_last_name, '')),
    random_username,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(profiles.username, EXCLUDED.username);

  -- Auto-allow the user (terms acceptance is enforced by the signup form)
  INSERT INTO public.allowed_users (email, notes)
  VALUES (NEW.email, 'Auto-allowed on signup after terms acceptance')
  ON CONFLICT DO NOTHING;

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2. Backfill: add all existing signed-up users to allowed_users
INSERT INTO public.allowed_users (email, notes)
SELECT DISTINCT p.email, 'Backfilled — auto-allowed existing user'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.allowed_users au
  WHERE lower(au.email) = lower(p.email)
)
ON CONFLICT DO NOTHING;

-- 3. Backfill: ensure all existing users have a 'user' role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'user'::app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT (user_id, role) DO NOTHING;
