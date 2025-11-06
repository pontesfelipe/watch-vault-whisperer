-- Fix search_path security issue by recreating the function with proper settings
DROP FUNCTION IF EXISTS public.update_watches_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_watches_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER update_watches_timestamp
  BEFORE UPDATE ON public.watches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_watches_updated_at();

CREATE TRIGGER update_wear_entries_timestamp
  BEFORE UPDATE ON public.wear_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_watches_updated_at();