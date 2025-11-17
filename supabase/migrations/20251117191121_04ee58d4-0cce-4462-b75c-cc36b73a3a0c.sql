-- Add MSRP field to watches table
ALTER TABLE public.watches 
ADD COLUMN IF NOT EXISTS msrp numeric DEFAULT NULL;

COMMENT ON COLUMN public.watches.msrp IS 'Manufacturer Suggested Retail Price';
COMMENT ON COLUMN public.watches.cost IS 'Actual price paid by user';
COMMENT ON COLUMN public.watches.average_resale_price IS 'Current market/resale value';