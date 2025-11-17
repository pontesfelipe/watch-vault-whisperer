-- Create table to track AI feature usage
CREATE TABLE IF NOT EXISTS public.ai_feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_name text NOT NULL CHECK (feature_name IN ('about_me', 'wishlist', 'gap_analysis')),
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_feature_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own AI usage"
ON public.ai_feature_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own AI usage"
ON public.ai_feature_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all AI usage"
ON public.ai_feature_usage
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to check if user can use AI feature
CREATE OR REPLACE FUNCTION public.can_use_ai_feature(_user_id uuid, _feature_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if user is admin (unlimited access)
  SELECT CASE 
    WHEN public.has_role(_user_id, 'admin') THEN true
    ELSE (
      SELECT COUNT(*) < 4
      FROM public.ai_feature_usage
      WHERE user_id = _user_id
        AND feature_name = _feature_name
        AND date_trunc('month', used_at) = date_trunc('month', now())
    )
  END;
$$;

-- Create function to get remaining usage count
CREATE OR REPLACE FUNCTION public.get_ai_feature_usage(_user_id uuid, _feature_name text)
RETURNS TABLE (used_count bigint, remaining_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) as used_count,
    CASE 
      WHEN public.has_role(_user_id, 'admin') THEN 999
      ELSE GREATEST(0, 4 - COUNT(*))
    END as remaining_count
  FROM public.ai_feature_usage
  WHERE user_id = _user_id
    AND feature_name = _feature_name
    AND date_trunc('month', used_at) = date_trunc('month', now());
$$;