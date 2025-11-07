-- Modify trips table to support multiple watches
ALTER TABLE public.trips 
ALTER COLUMN watch_model TYPE text[] 
USING ARRAY[watch_model];

-- Also modify events table to support multiple watches for consistency
ALTER TABLE public.events 
ALTER COLUMN watch_model TYPE text[] 
USING ARRAY[watch_model];