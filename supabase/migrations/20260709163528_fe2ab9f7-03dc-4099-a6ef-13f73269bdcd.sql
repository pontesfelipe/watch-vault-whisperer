ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS year integer;