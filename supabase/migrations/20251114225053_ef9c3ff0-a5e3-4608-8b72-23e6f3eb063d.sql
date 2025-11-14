-- Create table to persist collection gap AI suggestions per user
CREATE TABLE IF NOT EXISTS public.collection_gap_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  dial_colors TEXT NOT NULL DEFAULT '',
  rank INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_gap_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all gap suggestions"
ON public.collection_gap_suggestions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own gap suggestions"
ON public.collection_gap_suggestions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gap suggestions"
ON public.collection_gap_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gap suggestions"
ON public.collection_gap_suggestions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gap suggestions"
ON public.collection_gap_suggestions
FOR DELETE
USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_collection_gap_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_collection_gap_suggestions_updated_at ON public.collection_gap_suggestions;
CREATE TRIGGER trg_update_collection_gap_suggestions_updated_at
BEFORE UPDATE ON public.collection_gap_suggestions
FOR EACH ROW EXECUTE FUNCTION public.update_collection_gap_suggestions_updated_at();