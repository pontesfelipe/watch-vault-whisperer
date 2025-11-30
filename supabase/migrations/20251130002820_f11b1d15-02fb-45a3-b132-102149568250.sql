-- Temporarily disable the create_default_collection trigger
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Insert the missing profile
INSERT INTO public.profiles (id, email, full_name)
VALUES ('2e633ce2-23a8-4e2c-acb7-f2e4d11a58de', 'laze-dusters.8b@icloud.com', '')
ON CONFLICT (id) DO NOTHING;

-- Insert the user role if missing
INSERT INTO public.user_roles (user_id, role)
VALUES ('2e633ce2-23a8-4e2c-acb7-f2e4d11a58de', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- Recreate the trigger
CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_collection();