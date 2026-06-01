ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS sale_price numeric,
  ADD COLUMN IF NOT EXISTS sale_reason text,
  ADD COLUMN IF NOT EXISTS sale_notes text,
  ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone;