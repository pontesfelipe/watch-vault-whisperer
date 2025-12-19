-- Create access logs table for tracking user activity
CREATE TABLE public.access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  action TEXT NOT NULL,
  page TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view all access logs"
ON public.access_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can insert their own logs
CREATE POLICY "Users can insert their own access logs"
ON public.access_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX idx_access_logs_action ON public.access_logs(action);

-- Create usage metrics view for aggregated stats
CREATE OR REPLACE VIEW public.usage_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  action,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.access_logs
GROUP BY DATE_TRUNC('day', created_at), action
ORDER BY date DESC;