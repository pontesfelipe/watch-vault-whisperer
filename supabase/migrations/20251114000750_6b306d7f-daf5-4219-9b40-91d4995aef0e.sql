-- Force types regeneration by adding a comment
COMMENT ON TABLE public.allowed_users IS 'Stores emails allowed to register';
COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON TABLE public.user_roles IS 'User role assignments';