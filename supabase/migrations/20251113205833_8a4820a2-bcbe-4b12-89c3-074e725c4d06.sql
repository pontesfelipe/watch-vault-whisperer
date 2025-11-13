-- Add personal notes columns to watches table
ALTER TABLE public.watches
ADD COLUMN IF NOT EXISTS why_bought text,
ADD COLUMN IF NOT EXISTS when_bought text,
ADD COLUMN IF NOT EXISTS what_i_like text,
ADD COLUMN IF NOT EXISTS what_i_dont_like text;