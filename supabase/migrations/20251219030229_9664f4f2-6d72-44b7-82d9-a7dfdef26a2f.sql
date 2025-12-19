-- Drop the security definer view and recreate as a regular view
DROP VIEW IF EXISTS public.usage_metrics;

-- Recreate view without security definer (standard view)
CREATE VIEW public.usage_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  action,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.access_logs
GROUP BY DATE_TRUNC('day', created_at), action
ORDER BY date DESC;