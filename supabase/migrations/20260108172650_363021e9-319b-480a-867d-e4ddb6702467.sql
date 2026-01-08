-- Revoke all access from public and anon roles on the usage_metrics view
REVOKE ALL ON public.usage_metrics FROM anon;
REVOKE ALL ON public.usage_metrics FROM public;

-- Grant access only to authenticated role
GRANT SELECT ON public.usage_metrics TO authenticated;

-- Create a security definer function for admin-only access to usage metrics
CREATE OR REPLACE FUNCTION public.get_usage_metrics()
RETURNS TABLE (
  date timestamptz,
  action text,
  count bigint,
  unique_users bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date, action, count, unique_users
  FROM public.usage_metrics
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY date DESC;
$$;