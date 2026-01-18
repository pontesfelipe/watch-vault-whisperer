-- Fix security linter: ensure views use invoker's permissions (do not run with view owner's privileges)

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id,
       username,
       avatar_url,
       avatar_color
FROM public.profiles;

CREATE OR REPLACE VIEW public.usage_metrics
WITH (security_invoker = true)
AS
SELECT date_trunc('day'::text, created_at) AS date,
       action,
       count(*) AS count,
       count(DISTINCT user_id) AS unique_users
FROM public.access_logs
GROUP BY date_trunc('day'::text, created_at), action
ORDER BY date_trunc('day'::text, created_at) DESC;