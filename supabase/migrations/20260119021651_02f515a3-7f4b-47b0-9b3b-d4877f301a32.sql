-- Create a table to track feature usage events
CREATE TABLE public.feature_usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  collection_type TEXT NOT NULL CHECK (collection_type IN ('watches', 'sneakers', 'purses')),
  feature_key TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_feature_usage_events_feature ON public.feature_usage_events(feature_key, collection_type);
CREATE INDEX idx_feature_usage_events_used_at ON public.feature_usage_events(used_at);
CREATE INDEX idx_feature_usage_events_user ON public.feature_usage_events(user_id);

-- Enable RLS
ALTER TABLE public.feature_usage_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own usage events
CREATE POLICY "Users can insert their own usage events"
ON public.feature_usage_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only admins can view all usage events
CREATE POLICY "Admins can view all usage events"
ON public.feature_usage_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create a view for aggregated feature usage stats
CREATE OR REPLACE VIEW public.feature_usage_stats AS
SELECT 
  feature_key,
  collection_type,
  COUNT(*) as total_uses,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(used_at) as last_used,
  DATE_TRUNC('day', used_at) as usage_date
FROM public.feature_usage_events
GROUP BY feature_key, collection_type, DATE_TRUNC('day', used_at);

-- Create a function to get feature usage summary
CREATE OR REPLACE FUNCTION public.get_feature_usage_summary(
  _days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  feature_key TEXT,
  collection_type TEXT,
  total_uses BIGINT,
  unique_users BIGINT,
  last_used TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    feature_key,
    collection_type,
    COUNT(*) as total_uses,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(used_at) as last_used
  FROM public.feature_usage_events
  WHERE used_at >= NOW() - (_days_back || ' days')::INTERVAL
  GROUP BY feature_key, collection_type
  ORDER BY total_uses DESC;
$$;