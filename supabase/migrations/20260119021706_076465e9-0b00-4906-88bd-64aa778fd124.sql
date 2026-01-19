-- Drop the security definer view and recreate with proper security
DROP VIEW IF EXISTS public.feature_usage_stats;

-- Recreate view with security_invoker = true (Postgres 15+)
-- This ensures the view respects the querying user's RLS policies
CREATE VIEW public.feature_usage_stats 
WITH (security_invoker = true)
AS
SELECT 
  feature_key,
  collection_type,
  COUNT(*) as total_uses,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(used_at) as last_used,
  DATE_TRUNC('day', used_at) as usage_date
FROM public.feature_usage_events
GROUP BY feature_key, collection_type, DATE_TRUNC('day', used_at);