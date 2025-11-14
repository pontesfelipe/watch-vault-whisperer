-- Create table for storing collection insights
CREATE TABLE IF NOT EXISTS public.collection_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insights TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own insights"
  ON public.collection_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON public.collection_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON public.collection_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON public.collection_insights
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all insights"
  ON public.collection_insights
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));