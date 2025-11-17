-- Create trigger function to auto-update updated_at for wear_entries
CREATE OR REPLACE FUNCTION public.update_wear_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger to automatically update updated_at on wear_entries
DROP TRIGGER IF EXISTS update_wear_entries_updated_at_trigger ON public.wear_entries;
CREATE TRIGGER update_wear_entries_updated_at_trigger
  BEFORE UPDATE ON public.wear_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wear_entries_updated_at();

-- Enable realtime for wear_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.wear_entries;