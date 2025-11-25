-- Create function to automatically approve access when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add user to allowed_users if not already there
  INSERT INTO public.allowed_users (email, added_at, notes)
  VALUES (NEW.email, now(), 'Auto-approved on signup')
  ON CONFLICT (email) DO NOTHING;
  
  -- Update any pending registration requests to approved
  UPDATE public.registration_requests
  SET status = 'approved'
  WHERE email = NEW.email
    AND status = 'pending';
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();