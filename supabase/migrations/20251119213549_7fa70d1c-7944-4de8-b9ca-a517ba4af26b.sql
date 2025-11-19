-- Add optional foreign keys to wear_entries for linking to trips, events, and water usage
ALTER TABLE public.wear_entries
ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS water_usage_id UUID REFERENCES public.water_usage(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wear_entries_trip_id ON public.wear_entries(trip_id);
CREATE INDEX IF NOT EXISTS idx_wear_entries_event_id ON public.wear_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_wear_entries_water_usage_id ON public.wear_entries(water_usage_id);