-- Add metadata analysis fields to watches table
ALTER TABLE public.watches
ADD COLUMN IF NOT EXISTS metadata_analysis_reasoning text,
ADD COLUMN IF NOT EXISTS metadata_analyzed_at timestamp with time zone;